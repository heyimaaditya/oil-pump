import { Request, Response } from 'express';
import { dbService } from '../services/db.service';
import logger from '../logger';

// Helper to parse pagination params
const getPaginationParams = (req: Request): { page: number; limit: number } => {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '50', 10); // Default limit 50
    return {
        page: Math.max(1, page), // Ensure page is at least 1
        limit: Math.min(100, Math.max(1, limit)) // Ensure limit is between 1 and 100
    };
};

export const getPressureData = async (req: Request, res: Response): Promise<void> => {
  const { page, limit } = getPaginationParams(req);
  const requestLogger = logger.child({ requestId: (req as any).id, endpoint: '/pressure', page, limit }); // Use request ID from pino-http

  try {
    requestLogger.info('Fetching pressure data');
    const paginatedResult = await dbService.getPressureData(page, limit);
    res.status(200).json(paginatedResult); // Return the paginated structure
  } catch (error) {
    requestLogger.error({ err: error }, "API Error fetching pressure data");
    res.status(500).json({ error: 'Failed to retrieve pressure data' });
  }
};

export const getMaterialData = async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = getPaginationParams(req);
    const requestLogger = logger.child({ requestId: (req as any).id, endpoint: '/material', page, limit });
    try {
        requestLogger.info('Fetching material data');
        const paginatedResult = await dbService.getMaterialData(page, limit);
        res.status(200).json(paginatedResult);
    } catch (error) {
        requestLogger.error({ err: error }, "API Error fetching material data");
        res.status(500).json({ error: 'Failed to retrieve material data' });
    }
};

export const getFluidData = async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = getPaginationParams(req);
    const requestLogger = logger.child({ requestId: (req as any).id, endpoint: '/fluid', page, limit });
    try {
        requestLogger.info('Fetching fluid data');
        const paginatedResult = await dbService.getFluidData(page, limit);
        res.status(200).json(paginatedResult);
    } catch (error) {
        requestLogger.error({ err: error }, "API Error fetching fluid data");
        res.status(500).json({ error: 'Failed to retrieve fluid data' });
    }
};