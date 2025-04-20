import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { config } from './config';
import logger from './logger';
import apiRoutes from './routes/data.routes';
import { KafkaConsumerService } from './services/kafka-consumer.service';
import { dbService } from './services/db.service';
import http from 'http';

const app: Express = express();
const port = config.server.port;
const kafkaConsumer = new KafkaConsumerService();
let server: http.Server | null = null;

// --- Middleware Setup ---
app.use(pinoHttp({
    logger: logger,
    customLogLevel: (req, res, err) => {
        if (res.statusCode >= 400 && res.statusCode < 500) return 'warn';
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 300 && res.statusCode < 400) return 'silent';
        return 'info';
    },
    customSuccessMessage: (req, res) => `${req.method} ${req.url} completed ${res.statusCode} ${res.statusMessage || ''}`,
    customErrorMessage: (req, res, err) => `${req.method} ${req.url} errored ${res.statusCode} ${res.statusMessage || ''} - ${err.message}`
}));
app.use(cors({ origin: config.server.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// --- Routes ---

app.use('/api', apiRoutes);

// --- 404 Handler ---
app.use((req, res, next) => {
    res.status(404).json({ error: 'Not Found', message: `Cannot ${req.method} ${req.originalUrl}` });
});

// --- Global Error Handler ---
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const reqLogger = (req as any).log || logger;
    reqLogger.error({ err: err, stack: err.stack }, 'Unhandled error caught by global error handler');
    const statusCode = err.status || err.statusCode || 500;
    const responseError = {
        error: 'Internal ServerError',
        message: err.message || 'An unexpected error occurred on the server.',
        ...(config.nodeEnv !== 'production' && { stack: err.stack })
    };
    res.status(statusCode).json(responseError);
});

// --- Start Function ---
async function startServer() {
    try {
        logger.info('Initializing data-consumer service...');
        await dbService.ensureConnected();
        logger.info('Database connection verified.');
        await kafkaConsumer.connectAndConsume();
        logger.info('Kafka consumer initialized and running.');

        server = app.listen(port, () => { logger.info(`Data Consumer API server running at http://localhost:${port}`); });
        server.on('error', (error: NodeJS.ErrnoException) => { /* ... error handling ... */ });

    } catch (error) {
        logger.fatal({ err: error }, 'Failed to start the data-consumer service during initialization.');
        await shutdown('STARTUP_FAILURE');
    }
}

// --- Graceful Shutdown ---
async function shutdown(signal: string = 'UNKNOWN') {
    logger.warn({ signal }, `Received ${signal}. Shutting down gracefully...`);
    if (server) {
        server.close(async (err) => {
             if (err) { logger.error({ err }, 'Error during HTTP server closing.'); }
             else { logger.info('HTTP server closed.'); }
             await kafkaConsumer.disconnect(); await dbService.close();
             logger.info('Resources cleaned up. Exiting.'); process.exit(err ? 1 : 0);
        });
    } else {
         await kafkaConsumer.disconnect(); await dbService.close();
         logger.info('Resources cleaned up (server not running). Exiting.');
         process.exit(signal === 'STARTUP_FAILURE' ? 1 : 0);
    }
    setTimeout(() => { logger.error('Graceful shutdown timeout. Forcing exit.'); process.exit(1); }, 15000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason, promise) => { logger.fatal({ reason, promise }, 'Unhandled Rejection. Shutting down...'); shutdown('UNHANDLED_REJECTION'); });
process.on('uncaughtException', (error) => { logger.fatal({ err: error }, 'Uncaught Exception. Shutting down...'); shutdown('UNCAUGHT_EXCEPTION'); });

startServer();

