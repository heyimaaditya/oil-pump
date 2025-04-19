import express, { Express } from 'express';
import cors from 'cors';
import dataRoutes from './routes/data.routes';
import { KafkaConsumerService } from './services/kafka-consumer.service';
import { dbService } from './services/db.service'; // Singleton

const app: Express = express();
const port = process.env.PORT || 8080;

const kafkaConsumer = new KafkaConsumerService();

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust for production)
app.use(express.json()); // Parse JSON bodies

// API Routes
app.use('/api', dataRoutes); // Prefix API routes

// Health Check endpoint
app.get('/health', (req, res) => {

    res.status(200).send('OK');
});


// Start function
async function startServer() {
    try {
        console.log('Initializing service...');

        // 1. Connect to Database
        await dbService.connect(); // Ensure DB is reachable

        // 2. Start Kafka Consumer (Connects and starts consuming)
        await kafkaConsumer.connectAndConsume();

        // 3. Start Express Server
        const server = app.listen(port, () => {
            console.log(`Data Consumer API server running at http://localhost:${port}`);
        });

        // Graceful Shutdown
        const shutdown = async (signal: string) => {
            console.log(`${signal} received. Shutting down gracefully...`);
            server.close(async () => {
                console.log('HTTP server closed.');
                await kafkaConsumer.disconnect();
                await dbService.close(); // Close DB pool
                console.log('Resources cleaned up.');
                process.exit(0);
            });
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
        console.error('Failed to start the service:', error);
        // Attempt cleanup even on startup failure
        await kafkaConsumer.disconnect().catch(e => console.error("Error disconnecting Kafka on startup failure:", e));
        await dbService.close().catch(e => console.error("Error closing DB on startup failure:", e));
        process.exit(1);
    }
}

startServer();