import { dbService } from './db.service';
import logger from '../logger';

interface HealthStatus {
    status: 'UP' | 'DOWN' | 'DEGRADED';
    details: Record<string, { status: string; details?: any; error?: string }>;
}

export class HealthService {
    async check(): Promise<HealthStatus> {
        const response: HealthStatus = { status: 'UP', details: {} };
        try {
            const dbOk = await dbService.checkConnection();
            if (dbOk) { response.details.database = { status: 'UP' }; }
            else { response.details.database = { status: 'DOWN', error: 'Failed simple query check.' }; response.status = 'DOWN'; }
        } catch (error: any) {
            logger.error({ err: error }, 'Health check: Database check threw an error');
            response.details.database = { status: 'DOWN', error: error.message || 'Exception during check.' }; response.status = 'DOWN';
        }
        
        response.details.kafka = { status: 'UNKNOWN', details: 'No direct connection check implemented.' };
        logger.info({ healthStatus: response }, 'Health check completed');
        return response;
    }
}
export const healthService = new HealthService();
