import { Request, Response } from 'express';
import { dbService } from '../services/db.service';
import logger from '../logger';

const getPaginationParams = (req: Request): { page: number; limit: number } => {
    const rawPage = req.query.page; const rawLimit = req.query.limit;
    let page = parseInt(rawPage as string || '1', 10); let limit = parseInt(rawLimit as string || '50', 10);
    page = isNaN(page) || page < 1 ? 1 : page;
    limit = isNaN(limit) || limit < 1 ? 10 : Math.min(100, limit); 
    return { page, limit };
};

const handleApiResponse = async ( req: Request, res: Response, serviceCall: (page: number, limit: number) => Promise<any>, endpointName: string ) => {
    const { page, limit } = getPaginationParams(req);
    const requestLogger = logger.child({ endpoint: endpointName, page, limit, requestId: (req as any).id });
    try {
        requestLogger.info(`Fetching ${endpointName} data`);
        const paginatedResult = await serviceCall(page, limit);
        requestLogger.info({ totalFound: paginatedResult.total }, `Successfully fetched ${endpointName} data`);
        res.status(200).json(paginatedResult);
    } catch (error: any) {
        requestLogger.error({ err: error }, `API Error fetching ${endpointName} data`);
        res.status(500).json({ error: `Failed to retrieve ${endpointName} data` });
    }
};

export const getPressureData = async (req: Request, res: Response): Promise<void> => { await handleApiResponse(req, res, dbService.getPressureData.bind(dbService), 'pressure'); };
export const getMaterialData = async (req: Request, res: Response): Promise<void> => { await handleApiResponse(req, res, dbService.getMaterialData.bind(dbService), 'material'); };
export const getFluidData = async (req: Request, res: Response): Promise<void> => { await handleApiResponse(req, res, dbService.getFluidData.bind(dbService), 'fluid'); };