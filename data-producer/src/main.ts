import { DataGenerator } from "./services/data-generator.service";
import { KafkaProducerService } from "./services/kafka-producer.service";
import { producerConfig } from './config/kafka.config';
const producer= new KafkaProducerService();
let running= true;
let startTime= Date.now();
async function main(){
    console.log("Starting data producer...");
    try{
        await producer.connect();
    }
    catch(error){
        console.error("Error connecting to Kafka:", error);
        process.exit(1);
    }
    console.log(`Producer configured to run for ${producerConfig.runTimeSeconds===0?'indefinitely':producerConfig.runTimeSeconds+'seconds'}. `);
    console.log(`Message interval set to ${producerConfig.messageIntervalMs}ms.`);
    const intervalId= setInterval(async ()=>{
        if(!running){
            clearInterval(intervalId);
            return;
        }
        const data= DataGenerator.generateData();
        await producer.sendData(data);
        if(producerConfig.runTimeSeconds>0 && (Date.now()-startTime)/1000>producerConfig.runTimeSeconds){
            console.log("Run time exceeded. Stopping producer...");
            running= false;
            clearInterval(intervalId);
            await shutdown();
        }
    }
    , producerConfig.messageIntervalMs);
    process.on('SIGINT', async () => {
        console.log("SIGINT received. Stopping producer...");
        running= false;
        clearInterval(intervalId);
        await shutdown();
    });
    process.on('SIGTERM', async () => {
        console.log("SIGTERM received. Stopping producer...");
        running= false;
        clearInterval(intervalId);
        await shutdown();
    });

}
async function shutdown(){
    await producer.disconnect();
    console.log("Producer disconnected. Exiting...");
    process.exit(0);
}