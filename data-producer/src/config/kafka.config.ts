import logger from '../logger';

const brokers = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
logger.info({ brokers }, 'Kafka brokers configured');

export const kafkaConfig = {
  clientId: 'data-producer-app',
  brokers: brokers,
  topic: process.env.KAFKA_TOPIC || 'oil_equipment_data',
  connectionTimeout: 5000, // Increased timeout
  requestTimeout: 30000, // Increased timeout
  retry: {
    initialRetryTime: 300, // Increased retry time
    retries: 10, // Increased retries
  },
};

export const producerConfig = {
  messageIntervalMs: parseInt(process.env.MESSAGE_INTERVAL_MS || '1000', 10),
  runTimeSeconds: parseInt(process.env.RUN_TIME_SECONDS || '0', 10), // 0 means run indefinitely
};