import { Kafka, Consumer, EachMessagePayload, KafkaJSNonRetriableError, Producer, logLevel as KafkaLogLevel } from 'kafkajs';
import { config } from '../config';
import { dbService } from './db.service';
import { EquipmentDataModel } from '../models/equipment-data.model';
import logger from '../logger';

const kafkaJSLogLevelMap: { [key: string]: number } = { error: KafkaLogLevel.ERROR, warn: KafkaLogLevel.WARN, info: KafkaLogLevel.INFO, debug: KafkaLogLevel.DEBUG };
const pinoLogLevel = logger.levelVal;

export class KafkaConsumerService {
  private kafka: Kafka;
  private consumer: Consumer;
  private dlqProducer: Producer;
  private isRunning: boolean = false;
  private connectPromise: Promise<void> | null = null;

  constructor() {
    this.kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      connectionTimeout: config.kafka.connectionTimeout,
      requestTimeout: config.kafka.requestTimeout,
      retry: config.kafka.retry,
      logLevel: Object.values(kafkaJSLogLevelMap).find(level => level <= pinoLogLevel) || KafkaLogLevel.INFO,
      logCreator: (kafkaLogLevel) => ({ namespace, level, label, log }) => {
          if (level > pinoLogLevel) return;
          const pinoLevelLabel = Object.keys(kafkaJSLogLevelMap).find(key => kafkaJSLogLevelMap[key] === level) || 'info';
          const { message, ...extra } = log;
          const logPayload = { ...extra, kafka_namespace: namespace, kafka_label: label };
           if (extra.error) { (logPayload as any).err = new Error(extra.error); delete extra.error; }
          (logger as any)[pinoLevelLabel](logPayload, message);
      }
    });
    this.consumer = this.kafka.consumer({ groupId: config.kafka.groupId, ...config.kafka.consumer });
    this.dlqProducer = this.kafka.producer({ allowAutoTopicCreation: true, retry: config.kafka.retry });
  }

  async connectAndConsume(): Promise<void> {
    if (this.connectPromise) { return this.connectPromise; }
    if (this.isRunning) { return Promise.resolve(); }

    logger.info('Attempting to connect Kafka Consumer and DLQ Producer...');
    this.connectPromise = (async () => {
        try {
            await Promise.all([ this.consumer.connect(), this.dlqProducer.connect() ]);
            logger.info('Kafka Consumer and DLQ Producer connected.');

            logger.info(`Subscribing consumer to topic: ${config.kafka.topic}`);
            await this.consumer.subscribe({ topic: config.kafka.topic, fromBeginning: false });
            logger.info('Consumer subscribed successfully.');

            this.setupEventHandlers();
            logger.info('Starting message consumption loop...');
            this.isRunning = true;
            await this.consumer.run({ eachMessage: async (payload) => this.handleMessage(payload) });
            logger.info('Consumer run loop initiated.');

        } catch (error) {
            logger.error({ err: error }, 'Failed to connect/subscribe Kafka Consumer or DLQ Producer.');
            this.isRunning = false;
             await this.disconnect();
            throw error;
        } finally { this.connectPromise = null; }
    })();
    return this.connectPromise;
  }

  private async handleMessage({ topic, partition, message }: EachMessagePayload): Promise<void> {
      const messageLogger = logger.child({ kafkaTopic: topic, kafkaPartition: partition, kafkaOffset: message.offset, messageTimestamp: message.timestamp });
      messageLogger.debug('Received raw message.');

      if (!message.value) { messageLogger.warn('Received empty message value. Skipping.'); return; }
      const rawMessage = message.value.toString();
      let data: EquipmentDataModel;

      try {
        try { data = JSON.parse(rawMessage); }
        catch (parseError: any) {
             messageLogger.error({ err: parseError, rawMessage }, 'Failed to parse JSON message.');
             await this.sendToDLQ(rawMessage, message.headers, new Error(`JSON Parsing Error: ${parseError.message}`));
             return;
        }

        // Basic validation placeholder - enhance if needed
        if (!data || typeof data.timestamp !== 'string' || typeof data.suction_pressure !== 'number' ) {
            const validationError = new Error('Invalid message structure or missing required fields.');
            messageLogger.error({ err: validationError, parsedData: data }, 'Message validation failed.');
            await this.sendToDLQ(rawMessage, message.headers, validationError);
            return;
        }

        try {
            await dbService.insertData(data);
            messageLogger.info({ dataTimestamp: data.timestamp }, 'Message processed and inserted into DB successfully.');
        } catch (dbError: any) {
            messageLogger.error({ err: dbError, dataTimestamp: data.timestamp }, 'Failed to insert data into database.');
            await this.sendToDLQ(rawMessage, message.headers, new Error(`Database Error: ${dbError.message}`));
            return; // Acknowledge after DLQ send
        }
      } catch (error: any) {
        messageLogger.fatal({ err: error, rawMessage }, 'CRITICAL: Unhandled error during message processing loop.');
      }
  }

  private async sendToDLQ(messageValue: string, originalHeaders: any, processingError: Error): Promise<void> {
      const dlqTopic = config.kafka.dlqTopic;
      const headers = {
          ...(originalHeaders && Buffer.isBuffer(originalHeaders.someHeader) ? {} : originalHeaders), // Avoid Buffer issues
          'x-dlq-original-topic': config.kafka.topic, 'x-dlq-original-group-id': config.kafka.groupId,
          'x-dlq-error-message': processingError.message || 'Unknown error', 'x-dlq-error-stack': processingError.stack || '',
          'x-dlq-timestamp': new Date().toISOString(),
      };
      try {
          logger.warn({ dlqTopic, errorMessage: processingError.message }, `Sending message to DLQ topic: ${dlqTopic}`);
          await this.dlqProducer.send({ topic: dlqTopic, messages: [{ value: messageValue, headers: headers }], acks: 1 });
          logger.info({ dlqTopic }, `Message successfully sent to DLQ.`);
      } catch (dlqError) {
          logger.error({ err: dlqError, dlqTopic }, `CRITICAL: Failed to send message to DLQ!`);
      }
  }

  private setupEventHandlers(): void {
       const { CRASH, DISCONNECT, CONNECT, REBALANCING } = this.consumer.events;
       this.consumer.on(CRASH, async ({ payload }) => {
            logger.fatal({ error: payload.error, groupId: payload.groupId }, 'Kafka Consumer CRASHED!'); this.isRunning = false;
            await this.disconnect(); process.exit(1); });
       this.consumer.on(DISCONNECT, event => { logger.warn({ event }, 'Kafka Consumer disconnected.'); this.isRunning = false; });
       this.consumer.on(CONNECT, event => logger.info({ event }, 'Kafka Consumer connected/reconnected.'));
       this.consumer.on(REBALANCING, ({ payload }) => logger.info({ groupId: payload.groupId, memberId: payload.memberId }, 'Consumer group is rebalancing...'));
       this.dlqProducer.on(this.dlqProducer.events.DISCONNECT, event => logger.warn({ event }, 'DLQ Producer disconnected.'));
       this.dlqProducer.on(this.dlqProducer.events.CONNECT, event => logger.info({ event }, 'DLQ Producer connected/reconnected.'));
  }

  async disconnect(): Promise<void> {
    logger.info('Disconnecting Kafka Consumer and DLQ Producer...'); this.isRunning = false;
    try {
        const results = await Promise.allSettled([ this.consumer.disconnect(), this.dlqProducer.disconnect() ]);
        results.forEach((result, index) => {
            const service = index === 0 ? 'Consumer' : 'DLQ Producer';
            if (result.status === 'rejected') { logger.error({ err: result.reason }, `Error disconnecting Kafka ${service}.`); }
            else { logger.info(`Kafka ${service} disconnected successfully.`); }
        });
    } catch (error) { logger.error({ err: error }, 'Unexpected error during Kafka disconnect process.'); }
  }
}