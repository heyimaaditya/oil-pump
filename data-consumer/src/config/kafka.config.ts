export const kafkaConfig = {
    clientId: 'data-consumer-app',
    brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
    topic: process.env.KAFKA_TOPIC || 'oil_equipment_data',
    groupId: process.env.KAFKA_GROUP_ID || 'oil-data-consumer-group',
    connectionTimeout: 3000,
    requestTimeout: 25000,
    retry:{
        initialRetryTime: 100,
        retries: 8,
    }
}