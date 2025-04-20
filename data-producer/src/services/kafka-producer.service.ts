import { Kafka, Producer, CompressionTypes, KafkaJSNonRetriableError } from 'kafkajs';
import { config } from '../config';
import { EquipmentDataModel } from '../models/equipment-data.model';
import logger from '../logger'; // Use pino logger

export class KafkaProducerService {
  private kafka: Kafka;
  private producer: Producer;
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
        // Route kafkajs logs through pino
        const { message, ...extra } = log;
        (logger as any)[label.toLowerCase()]({ ...extra, kafka_namespace: namespace }, message);
      } 
    });
    this.producer = this.kafka.producer({
        allowAutoTopicCreation: true, // Ensure topic exists
        retry: config.kafka.retry // Apply retry to producer too
    });
  }

  async connect(): Promise<void> {
      // Prevent parallel connection attempts
      if (this.connectPromise) {
          return this.connectPromise;
      }
      if (this.isConnected) {
          return Promise.resolve();
      }

      logger.info('Attempting to connect Kafka Producer...');
      this.connectPromise = this.producer.connect()
          .then(() => {
              this.isConnected = true;
              logger.info('Kafka Producer connected successfully.');
              this.connectPromise = null; // Reset promise on success
          })
          .catch((error) => {
              logger.error({ err: error }, 'Failed to connect Kafka Producer initially.');
              this.isConnected = false;
              this.connectPromise = null; // Reset promise on failure
              throw error; // Re-throw to signal connection failure
          });
      return this.connectPromise;
  }

  async sendData(data: EquipmentDataModel): Promise<void> {
    if (!this.isConnected) {
      logger.warn('Kafka Producer is not connected. Attempting to reconnect...');
      try {
          await this.connect();
      } catch (connectError) {
          logger.error({ err: connectError }, 'Reconnect failed. Cannot send data.');
          return; // Skip sending if reconnect fails
      }
    }

    const message = JSON.stringify(data);
    const kafkaMessage = { value: message };
    const topic = config.kafka.topic;

    try {
      await this.producer.send({
        topic: topic,
        compression: CompressionTypes.GZIP,
        messages: [kafkaMessage],
      });
      logger.debug({ timestamp: data.timestamp, topic }, `Data sent successfully`);
    } catch (error) {
      logger.error({ err: error, topic, dataTimestamp: data.timestamp }, `Failed to send data`);
      // If it's a non-retriable error or connection issue, mark as disconnected
      if (error instanceof KafkaJSNonRetriableError || (error as any).type === 'connection') {
          logger.warn('Marking producer as disconnected due to send error.');
          this.isConnected = false;
      }
      // Let the caller decide if to retry the specific message, producer handles internal retries
      throw error; // Re-throw to indicate send failure
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected && !this.connectPromise) return; // Already disconnected or connecting
    // Wait if a connection is in progress before disconnecting
    if (this.connectPromise) {
        try {
            await this.connectPromise;
        } catch {
            // Ignore connection error if we are disconnecting anyway
        }
    }

    logger.info('Disconnecting Kafka Producer...');
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      logger.info('Kafka Producer disconnected.');
    } catch (error) {
      logger.error({ err: error }, 'Failed to disconnect Kafka Producer.');
    }
  }
}