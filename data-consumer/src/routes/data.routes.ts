import { Router } from 'express';
import { getPressureData, getMaterialData, getFluidData } from '../controllers/data.controller';
import { healthService } from '../services/health.service';
import { verifyApiKey } from '../middleware/auth.middleware';
import logger from '../logger';

const router = Router();
const protectedRouter = Router(); // Separate router for protected routes

// --- Public Routes ---
router.get('/health', async (req, res) => {
    const health = await healthService.check();
    const statusCode = health.status === 'UP' ? 200 : 503;
    res.status(statusCode).json(health);
});

// --- Define Protected API Routes ---
protectedRouter.get('/pressure', getPressureData);
protectedRouter.get('/material', getMaterialData);
protectedRouter.get('/fluid', getFluidData);

// --- Mount Routers ---
router.use('/', (req, res, next) => { verifyApiKey(req, res, next); }, protectedRouter);

export default router;
