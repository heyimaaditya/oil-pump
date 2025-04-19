export const kafkaConfig = {
    clientId:'data-producer-app',
    brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
    topic:process.env.KAFKA_TOPIC || 'oil_equipment_data',
    connectionTimeout: 3000,
    requestTimeout: 25000,
    retry: {
        initialRetryTime: 100,
        retries: 8,
    }
}
export const producerConfig = {
    messageIntervalMs:parseInt(process.env.MESSAGE_INTERVAL_MS || '1000',10),
    runTimeSeconds:parseInt(process.env.RUN_TIME_SECONDS || '0',10),
};