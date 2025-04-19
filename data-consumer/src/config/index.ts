import { dbConfig } from './db.config';
import { kafkaConfig } from './kafka.config';
import { serverConfig } from './server.config';

export const config = {
    db: dbConfig,
    kafka: kafkaConfig,
    server: serverConfig,
    logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
};