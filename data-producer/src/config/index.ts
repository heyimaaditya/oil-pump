import { kafkaConfig, producerConfig } from './kafka.config';

// Centralized configuration export
export const config = {
    kafka: kafkaConfig,
    producer: producerConfig,
    logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
};