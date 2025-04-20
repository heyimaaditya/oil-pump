import logger from '../logger';
import { Partitioners } from 'kafkajs'; 

const defaultBroker = 'kafka:9092';
const brokers = (process.env.KAFKA_BROKERS || defaultBroker).split(',');
logger.info({ brokers, source: process.env.KAFKA_BROKERS ? 'env' : 'default' }, 'Kafka brokers configured for producer');

export const kafkaConfig = {
  clientId: 'data-producer-app',
  brokers: brokers,
  topic: process.env.KAFKA_TOPIC || 'oil_equipment_data',
  connectionTimeout: 5000,
  requestTimeout: 30000,
  retry: {
    initialRetryTime: 300,
    retries: 10,
    maxRetryTime: 30000
  },
};

export const producerConfig = {
  messageIntervalMs: parseInt(process.env.MESSAGE_INTERVAL_MS || '1000', 10),
  runTimeSeconds: parseInt(process.env.RUN_TIME_SECONDS || '0', 10),
 
};
