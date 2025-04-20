import { kafkaConfig, producerConfig } from './kafka.config';

export const config = {
    kafka: kafkaConfig,
    producer: producerConfig,
    logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
};
