import { Router } from 'express';
import { getPressureData, getMaterialData, getFluidData } from '../controllers/data.controller';
import { healthService } from '../services/health.service'; // Import health service
import logger from '../logger';

const router = Router();

// No authentication needed for health check
router.get('/health', async (req, res) => {
    const health = await healthService.check();
    const statusCode = health.status === 'UP' ? 200 : 503; 
    logger.info({ healthStatus: health }, 'Health check performed');
    res.status(statusCode).json(health);
});

// API routes - protected by middleware in server.ts
router.get('/pressure', getPressureData);
router.get('/material', getMaterialData);
router.get('/fluid', getFluidData);

export default router;