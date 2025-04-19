import { dbService } from './db.service';
import logger from '../logger';

export class HealthService {
    async check(): Promise<{ status: string; details: Record<string, string> }> {
        const details: Record<string, string> = {};
        let overallStatus = 'UP';

        // Check Database Connection
        try {
            const dbOk = await dbService.checkConnection();
            details.database = dbOk ? 'UP' : 'DOWN';
            if (!dbOk) {
                overallStatus = 'DOWN';
            }
        } catch (error) {
            logger.error({ err: error }, 'Health check: Database check failed');
            details.database = 'DOWN';
            overallStatus = 'DOWN';
        }

       
        details.kafkaConsumer = 'UNKNOWN'; // Or check this.consumer.events state if possible

        return {
            status: overallStatus,
            details: details,
        };
    }
}

export const healthService = new HealthService();