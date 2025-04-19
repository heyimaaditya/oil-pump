import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { kafkaConfig } from '../config/kafka.config';
import { dbService } from './db.service'; // Use the singleton instance
import { EquipmentDataModel } from '../models/equipment-data.model';

export class KafkaConsumerService {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected: boolean = false;

  constructor() {
    this.kafka = new Kafka({
      clientId: kafkaConfig.clientId,
      brokers: kafkaConfig.brokers,
      connectionTimeout: kafkaConfig.connectionTimeout,
      requestTimeout: kafkaConfig.requestTimeout,
      retry: kafkaConfig.retry,
    });
    this.consumer = this.kafka.consumer({ groupId: kafkaConfig.groupId });
  }

  async connectAndConsume(): Promise<void> {
    try {
      console.log('Connecting Kafka Consumer...');
      await this.consumer.connect();
      this.isConnected = true;
      console.log('Kafka Consumer connected.');

      console.log(`Subscribing to topic: ${kafkaConfig.topic}`);
      await this.consumer.subscribe({ topic: kafkaConfig.topic, fromBeginning: false }); // Or true if needed
      console.log('Subscribed successfully.');

      console.log('Starting message consumption...');
      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
          if (!message.value) {
            console.warn(`Received empty message from topic ${topic}, partition ${partition}`);
            return;
          }

          try {
            const rawMessage = message.value.toString();
            // console.log(`Received raw message: ${rawMessage}`); 
            const data: EquipmentDataModel = JSON.parse(rawMessage);

            
            if (data && typeof data.timestamp === 'string') {
                
                await dbService.insertData(data);
            } else {
                console.warn('Received invalid data format:', data);
            }

          } catch (error) {
            console.error(`Error processing message from topic ${topic}:`, error);

          }
        },
      });
      console.log('Consumer is running...');

    } catch (error) {
      console.error('Failed to connect or run Kafka Consumer:', error);
      this.isConnected = false;
    
      throw error;
    }


    this.consumer.on(this.consumer.events.CRASH, async (event) => {
        console.error('Kafka Consumer crashed:', event.payload.error);
        this.isConnected = false;
        // Attempt to restart or handle cleanup
        await this.disconnect();
        
        process.exit(1); // Exit to allow Docker/orchestrator to restart
    });
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;
    try {
      await this.consumer.disconnect();
      this.isConnected = false;
      console.log('Kafka Consumer disconnected.');
    } catch (error) {
      console.error('Failed to disconnect Kafka Consumer:', error);
    }
  }
}