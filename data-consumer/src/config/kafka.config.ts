import logger from '../logger';

const brokers = (process.env.KAFKA_BROKERS || 'kafka:9092').split(',');
logger.info({ brokers }, 'Kafka brokers configured');

export const kafkaConfig = {
  clientId: 'data-consumer-app',
  brokers: brokers,
  topic: process.env.KAFKA_TOPIC || 'oil_equipment_data',
  dlqTopic: process.env.KAFKA_DLQ_TOPIC || 'oil_equipment_data_dlq', // DLQ Topic Name
  groupId: process.env.KAFKA_GROUP_ID || 'oil-data-consumer-group',
  connectionTimeout: 5000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 300,
    retries: 10,
  },
  consumer: {
    sessionTimeout: 30000,
    heartbeatInterval: 3000,
    allowAutoTopicCreation: true, // Allow consumer group to create internal topics
  }
};