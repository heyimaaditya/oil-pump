import { Kafka, Producer, CompressionTypes, KafkaJSNonRetriableError, logLevel as KafkaLogLevel, Partitioners } from 'kafkajs';
import { config } from '../config';
import { EquipmentDataModel } from '../models/equipment-data.model';
import logger from '../logger';

const kafkaJSLogLevelMap: { [key: string]: number } = { error: KafkaLogLevel.ERROR, warn: KafkaLogLevel.WARN, info: KafkaLogLevel.INFO, debug: KafkaLogLevel.DEBUG };
const pinoLogLevel = logger.levelVal;

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
      logLevel: Object.values(kafkaJSLogLevelMap).find(level => level <= pinoLogLevel) || KafkaLogLevel.INFO,
      logCreator: (kafkaLogLevel) => ({ namespace, level, label, log }) => {
          if (level > pinoLogLevel) return;
          const pinoLevelLabel = (Object.keys(kafkaJSLogLevelMap).find(key => kafkaJSLogLevelMap[key] === level) || 'info') as string;
          const { message, ...extra } = log;
          const logPayload = { ...extra, kafka_namespace: namespace, kafka_label: label };
          if (extra.error) { (logPayload as any).err = new Error(extra.error); delete extra.error; }
          (logger as any)[pinoLevelLabel](logPayload, message);
      }
    });
    this.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
        retry: config.kafka.retry,
        idempotent: true,
        maxInFlightRequests: 5,
        // Use partitioner from config if defined, otherwise default
        createPartitioner: (config.producer as any).createPartitioner || Partitioners.DefaultPartitioner
    });
  }

  async connect(): Promise<void> {
      if (this.connectPromise) { return this.connectPromise; }
      if (this.isConnected) { return Promise.resolve(); }

      logger.info('Attempting to connect Kafka Producer...');
      this.connectPromise = this.producer.connect()
          .then(() => {
              this.isConnected = true;
              logger.info('Kafka Producer connected successfully.');
              this.connectPromise = null;
          })
          .catch((error) => {
              logger.error({ err: error }, 'Failed to connect Kafka Producer initially.');
              this.isConnected = false;
              this.connectPromise = null;
              throw error;
          });
      return this.connectPromise;
  }

  async sendData(data: EquipmentDataModel): Promise<void> {
    if (!this.isConnected) {
      logger.warn('Kafka Producer is not connected. Attempting to reconnect...');
      try { await this.connect(); }
      catch (connectError) {
          logger.error({ err: connectError }, 'Reconnect failed. Cannot send data.');
          throw new Error('Producer disconnected and reconnect failed.');
      }
    }

    const message = JSON.stringify(data);
    const kafkaMessage = { value: message }; // Can add key: data.someId if partitioning needed
    const topic = config.kafka.topic;

    try {
      await this.producer.send({
        topic: topic,
        compression: CompressionTypes.GZIP,
        messages: [kafkaMessage],
        acks: -1
      });
      logger.debug({ timestamp: data.timestamp, topic }, `Data sent successfully`);
    } catch (error: any) {
      logger.error({ err: error, topic, dataTimestamp: data.timestamp }, `Failed to send data`);
      if (error instanceof KafkaJSNonRetriableError || error?.type === 'connection' || error?.message.includes('disconnected')) {
          logger.warn('Marking producer as disconnected due to send error.');
          this.isConnected = false;
      }
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connectPromise) {
        logger.info('Waiting for ongoing connection attempt before disconnecting...');
        try { await this.connectPromise; } catch (e) { logger.warn({ err: e }, 'Connection attempt failed while waiting to disconnect.'); }
    }
    if (!this.isConnected) { logger.info('Kafka Producer already disconnected.'); return; }

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