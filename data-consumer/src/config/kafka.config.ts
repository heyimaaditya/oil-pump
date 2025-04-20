import logger from '../logger';
const defaultBroker = 'kafka:9092'; 
const brokers = (process.env.KAFKA_BROKERS || defaultBroker).split(',');
logger.info({ brokers, source: process.env.KAFKA_BROKERS ? 'env' : 'default' }, 'Kafka brokers configured for consumer');


export const kafkaConfig = {
  clientId: 'data-consumer-app',
  brokers: brokers,
  topic: process.env.KAFKA_TOPIC || 'oil_equipment_data',
  dlqTopic: process.env.KAFKA_DLQ_TOPIC || 'oil_equipment_data_dlq',
  groupId: process.env.KAFKA_GROUP_ID || 'oil-data-consumer-group',
  connectionTimeout: 5000,
  requestTimeout: 30000,
  retry: { initialRetryTime: 300, retries: 10, maxRetryTime: 30000 },
  consumer: {
    sessionTimeout: 45000,
    heartbeatInterval: 3000,
    allowAutoTopicCreation: true,
    maxWaitTimeInMs: 5000,
  }
};
