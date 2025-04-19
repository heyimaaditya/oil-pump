import { Kafka, Producer, CompressionTypes } from 'kafkajs';
import { kafkaConfig } from '../config/kafka.config';
import { EquipmentDataModel } from '../models/equipment-data.model';

export class KafkaProducerService {
  private kafka: Kafka;
  private producer: Producer;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: kafkaConfig.clientId,
      brokers: kafkaConfig.brokers,
      connectionTimeout: kafkaConfig.connectionTimeout,
      requestTimeout: kafkaConfig.requestTimeout,
      retry: kafkaConfig.retry,
    });
    this.producer = this.kafka.producer();
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      console.log('Kafka Producer connected successfully.');
    } catch (error) {
      console.error('Failed to connect Kafka Producer:', error);
      throw error; // Re-throw to handle in main loop
    }
  }

  async sendData(data: EquipmentDataModel): Promise<void> {
    if (!this.isConnected) {
      console.warn('Kafka Producer is not connected. Attempting to reconnect...');
      await this.connect(); // Try to reconnect
      if (!this.isConnected) {
          console.error('Cannot send data: Producer still not connected.');
          return;
      }
    }

    const message = JSON.stringify(data);
    try {
      await this.producer.send({
        topic: kafkaConfig.topic,
        compression: CompressionTypes.GZIP, 
        messages: [{ value: message }],
      });
      console.log(`Data sent to topic ${kafkaConfig.topic}:`, data.timestamp);
    } catch (error) {
      console.error(`Failed to send data to topic ${kafkaConfig.topic}:`, error);
      
      this.isConnected = false; 
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      console.log('Kafka Producer disconnected.');
    } catch (error) {
      console.error('Failed to disconnect Kafka Producer:', error);
    }
  }
}