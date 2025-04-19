import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http'; // Import pino-http
import { config } from './config';
import logger from './logger'; // Import pino logger
import apiRoutes from './routes/data.routes';
import { KafkaConsumerService } from './services/kafka-consumer.service';
import { dbService } from './services/db.service';

const app: Express = express();
const port = config.server.port;
const kafkaConsumer = new KafkaConsumerService();


app.use(pinoHttp({ logger }));

// 2. CORS
app.use(cors({ origin: config.server.corsOrigin })); 

// 3. Body Parsing
app.use(express.json());


function verifyApiKey(req: Request, res: Response, next: NextFunction): void {
    if (!req.headers['x-api-key'] || req.headers['x-api-key'] !== config.server.apiKey) {
        res.status(403).json({ error: 'Forbidden' });
        return;
    }
    next();
}
app.use('/api', verifyApiKey, apiRoutes); 


app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error({ err, requestId: (req as any).id }, 'Unhandled error caught in global handler');
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: err.message || 'An unexpected error occurred',
    });
});

// --- Start Function ---
async function startServer() {
    try {
        logger.info('Initializing data-consumer service...');

        // 1. Connect to Database (includes check)
        await dbService.connect();

        // 2. Start Kafka Consumer
        await kafkaConsumer.connectAndConsume();

        // 3. Start Express Server
        const server = app.listen(port, () => {
            logger.info(`Data Consumer API server running at http://localhost:${port}`);
        });

        // --- Graceful Shutdown ---
        const shutdown = async (signal: string) => {
            logger.info({ signal }, `Received ${signal}. Shutting down gracefully...`);
            server.close(async () => {
                logger.info('HTTP server closed.');
                await kafkaConsumer.disconnect();
                await dbService.close();
                logger.info('Resources cleaned up. Exiting.');
                process.exit(0);
            });

            // Force shutdown after timeout if graceful fails
            setTimeout(() => {
                logger.warn('Graceful shutdown timeout exceeded. Forcing exit.');
                process.exit(1);
            }, 10000); // 10 second timeout
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        logger.fatal({ err: error }, 'Failed to start the data-consumer service.');
        // Attempt cleanup even on startup failure
        await kafkaConsumer.disconnect().catch(e => logger.error({ err: e }, "Error disconnecting Kafka on startup failure"));
        await dbService.close().catch(e => logger.error({ err: e }, "Error closing DB on startup failure"));
        process.exit(1);
    }
}

startServer();