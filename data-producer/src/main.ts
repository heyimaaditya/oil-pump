import { DataGenerator } from './services/data-generator.service';
import { KafkaProducerService } from './services/kafka-producer.service';
import { config } from './config';
import logger from './logger'; // Import pino logger

const producer = new KafkaProducerService();
let running = true;
let startTime = Date.now();
let intervalId: NodeJS.Timeout | null = null;

async function main() {
  logger.info('Starting data producer service...');
  try {
    await producer.connect();
  } catch (error) {
    logger.fatal({ err: error }, "Initial Kafka connection failed. Exiting.");
    process.exit(1);
  }

  logger.info(
      `Producer configured to run for ${config.producer.runTimeSeconds === 0 ? 'indefinitely' : config.producer.runTimeSeconds + ' seconds'}.` +
      ` Sending messages every ${config.producer.messageIntervalMs}ms.`
  );

  intervalId = setInterval(async () => {
    if (!running) {
        if (intervalId) clearInterval(intervalId);
        return;
    }

    const data = DataGenerator.generateData();
    try {
        await producer.sendData(data);
    } catch (sendError) {
        logger.warn({ err: sendError }, "Failed to send data batch, continuing...");
        
    }

    // Check runtime limit if set
    const runTimeLimit = config.producer.runTimeSeconds;
    if (runTimeLimit > 0 && (Date.now() - startTime) / 1000 > runTimeLimit) {
        logger.info("Configured run time reached. Initiating shutdown...");
        running = false;
        if (intervalId) clearInterval(intervalId);
        await shutdown('RUNTIME_LIMIT');
    }

  }, config.producer.messageIntervalMs);
}

async function shutdown(signal: string = 'UNKNOWN') {
    if (!running) return; // Avoid double shutdown
    running = false;
    logger.info({ signal }, "Shutdown initiated.");
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    await producer.disconnect();
    logger.info("Producer has shut down.");
    process.exit(0);
}

// Graceful shutdown handling
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main().catch(async (error) => {
  logger.fatal({ err: error }, 'Unhandled error during producer startup or main loop.');
  await producer.disconnect();
  process.exit(1);
});