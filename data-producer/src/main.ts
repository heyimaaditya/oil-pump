import { DataGenerator } from './services/data-generator.service';
import { KafkaProducerService } from './services/kafka-producer.service';
import { config } from './config';
import logger from './logger';

const producer = new KafkaProducerService();
let running = true;
let startTime = Date.now();
let intervalId: NodeJS.Timeout | null = null;
let messageCounter = 0;

async function main() {
  logger.info('Starting data producer service...');
  try {
    await producer.connect();
  } catch (error) {
    logger.fatal({ err: error }, "Initial Kafka connection failed. Exiting.");
    process.exit(1);
  }

  logger.info(
      `Producer configured to run for ${config.producer.runTimeSeconds === 0 ? 'indefinitely' : config.producer.runTimeSeconds + ' seconds'}. ` +
      `Sending messages every ${config.producer.messageIntervalMs}ms to topic [${config.kafka.topic}].`
  );

  const runTimeLimit = config.producer.runTimeSeconds;

  const sendLoop = async () => {
    if (!running) return;

    if (runTimeLimit > 0 && (Date.now() - startTime) / 1000 >= runTimeLimit) {
        logger.info("Configured run time reached. Initiating shutdown...");
        await shutdown('RUNTIME_LIMIT');
        return;
    }

    const data = DataGenerator.generateData();
    try {
        await producer.sendData(data);
        messageCounter++;
        if (messageCounter % 100 === 0) { logger.info(`Sent ${messageCounter} messages...`); }
    } catch (sendError) {
        logger.warn({ err: sendError }, "Failed to send data batch, continuing...");
    }

    if (running) { intervalId = setTimeout(sendLoop, config.producer.messageIntervalMs); }
  };

  intervalId = setTimeout(sendLoop, config.producer.messageIntervalMs);
}

async function shutdown(signal: string = 'UNKNOWN') {
    if (!running) { logger.warn("Shutdown already in progress."); return; }
    running = false;
    logger.info({ signal }, "Shutdown initiated.");

    if (intervalId) { clearTimeout(intervalId); intervalId = null; }

    logger.info(`Total messages sent: ${messageCounter}`);
    await producer.disconnect();
    logger.info("Producer has shut down gracefully.");
    process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('unhandledRejection', (reason, promise) => {
    logger.fatal({ reason, promise }, 'Unhandled Rejection detected. Shutting down...');
    shutdown('UNHANDLED_REJECTION').catch(() => process.exit(1));
});
process.on('uncaughtException', (error) => {
    logger.fatal({ err: error }, 'Uncaught Exception detected. Shutting down...');
    shutdown('UNCAUGHT_EXCEPTION').catch(() => process.exit(1));
});

main().catch(async (error) => {
  logger.fatal({ err: error }, 'Unhandled error during producer startup.');
  await producer.disconnect().catch(e => logger.error({ err: e }, "Error disconnecting Kafka on startup failure"));
  process.exit(1);
});
