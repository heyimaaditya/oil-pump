import { Kafka, Consumer, EachMessagePayload, KafkaJSNonRetriableError, Producer } from 'kafkajs';
import { config } from '../config';
import { dbService } from './db.service';
import { EquipmentDataModel } from '../models/equipment-data.model';
import logger from '../logger'; // Use pino logger

export class KafkaConsumerService {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer; // Producer needed for DLQ
  private isConnected: boolean = false;
  private connectPromise: Promise<void> | null = null;

  constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      connectionTimeout: config.kafka.connectionTimeout,
      requestTimeout: config.kafka.requestTimeout,
      retry: config.kafka.retry,
      logCreator: () => ({ namespace, level, label, log }) => {
                const { message, ...extra } = log;
                const logFn = logger[label.toLowerCase() as keyof typeof logger] as (bindings: Record<string, any>, msg: string) => void;
                if (typeof logFn === 'function') {
                    logFn({ ...extra, kafka_namespace: namespace }, message);
                } else {
                    logger.info({ ...extra, kafka_namespace: namespace }, message);
                }
            }
    });
    this.consumer = this.kafka.consumer({
        groupId: config.kafka.groupId,
        ...config.kafka.consumer // Spread other consumer options
    });
    // Create a producer instance specifically for sending to DLQ
    this.producer = this.kafka.producer({ allowAutoTopicCreation: true });
  }

  async connectAndConsume(): Promise<void> {
    if (this.connectPromise) return this.connectPromise;
    if (this.isConnected) return Promise.resolve();

    logger.info('Attempting to connect Kafka Consumer and DLQ Producer...');
    this.connectPromise = Promise.all([
        this.consumer.connect(),
        this.producer.connect() // Connect DLQ producer as well
    ]).then(async () => {
        this.isConnected = true;
        logger.info('Kafka Consumer and DLQ Producer connected.');

        logger.info(`Subscribing consumer to topic: ${config.kafka.topic}`);
        await this.consumer.subscribe({ topic: config.kafka.topic, fromBeginning: false });
        logger.info('Consumer subscribed successfully.');

        logger.info('Starting message consumption loop...');
        await this.consumer.run({
          eachMessage: async (payload) => this.handleMessage(payload),
        });
        logger.info('Consumer is running and processing messages.');
        this.connectPromise = null; // Reset on success

    }).catch((error) => {
        logger.error({ err: error }, 'Failed to connect Kafka Consumer or DLQ Producer.');
        this.isConnected = false;
        this.connectPromise = null; // Reset on failure
        // Consider cleanup or retry logic here
        throw error;
    });

    this.setupCrashHandler();
    return this.connectPromise;
  }

  private async handleMessage({ topic, partition, message }: EachMessagePayload): Promise<void> {
      const messageId = `<span class="math-inline">\{topic\}\-</span>{partition}-${message.offset}`;
      const messageLogger = logger.child({ messageId, offset: message.offset });

      if (!message.value) {
        messageLogger.warn('Received empty message value.');
        // Decide if this should go to DLQ or just be ignored
        return;
      }

      const rawMessage = message.value.toString();
      let data: EquipmentDataModel;

      try {
        messageLogger.debug('Received raw message'); // Avoid logging full message in prod usually
        data = JSON.parse(rawMessage);

        // More robust validation could go here (e.g., using Zod or Joi)
        if (!data || typeof data.timestamp !== 'string' || typeof data.suction_pressure !== 'number') {
            throw new Error('Invalid message structure or missing required fields.');
        }

        // Attempt to insert data into the database
        await dbService.insertData(data);
        messageLogger.info('Message processed and inserted into DB successfully.');

      } catch (error: any) {
        messageLogger.error({ err: error, rawMsg: rawMessage }, 'Error processing message.');

        // Send to DLQ on failure
        await this.sendToDLQ(rawMessage, message.headers, error);
        // Do NOT throw error here after sending to DLQ, as it would cause KafkaJS to retry endlessly
      }
  }

  private async sendToDLQ(messageValue: string, originalHeaders: any, processingError: Error): Promise<void> {
      const dlqTopic = config.kafka.dlqTopic;
      const headers = {
          ...originalHeaders,
          'x-dlq-original-topic': config.kafka.topic,
          'x-dlq-error-message': processingError.message || 'Unknown processing error',
          'x-dlq-error-stack': processingError.stack || '',
          'x-dlq-timestamp': new Date().toISOString(),
      };
      try {
          logger.warn(`Sending message to DLQ topic: ${dlqTopic}`);
          await this.producer.send({
              topic: dlqTopic,
              messages: [{ value: messageValue, headers: headers }],
          });
          logger.info(`Message successfully sent to DLQ topic: ${dlqTopic}`);
      } catch (dlqError) {
          logger.error({ err: dlqError, dlqTopic }, `Failed to send message to DLQ!`);
          // Critical failure - message might be lost if DLQ send fails repeatedly
      }
  }

  private setupCrashHandler(): void {
       this.consumer.on(this.consumer.events.CRASH, async (event) => {
            logger.fatal({ event }, 'Kafka Consumer crashed! This is a critical error.');
            this.isConnected = false;
            await this.disconnect(); // Attempt graceful cleanup
            // Exiting allows orchestrator (Docker) to restart the service
            process.exit(1);
        });
       
        this.consumer.on(this.consumer.events.DISCONNECT, event => {
            logger.warn({ event }, 'Kafka Consumer disconnected.');
            this.isConnected = false;
         
        });
         this.consumer.on(this.consumer.events.CONNECT, event => {
            logger.info({ event }, 'Kafka Consumer connected/reconnected.');
            this.isConnected = true;
        });
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected && !this.connectPromise) return;
    if (this.connectPromise) {
        try { await this.connectPromise } catch {} // Wait if connecting
    }

    logger.info('Disconnecting Kafka Consumer and DLQ Producer...');
    try {
        // Disconnect both consumer and producer
        await Promise.allSettled([
            this.consumer.disconnect(),
            this.producer.disconnect()
        ]);
        this.isConnected = false;
        logger.info('Kafka Consumer and DLQ Producer disconnected.');
    } catch (error) {
      logger.error({ err: error }, 'Error during Kafka disconnect.');
    }
  }
}