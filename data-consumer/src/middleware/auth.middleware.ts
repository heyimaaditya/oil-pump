import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import logger from '../logger';

export const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const reqId = (req as any).id; 

  if (!apiKey) {
    const logCtx = { path: req.path, ip: req.ip, requestId: reqId };
    logger.warn(logCtx, 'API Key missing');
    return res.status(401).json({ error: 'Unauthorized: API Key required' });
  }

  if (apiKey !== config.server.apiKey) {
    const logCtx = { path: req.path, ip: req.ip, keyProvided: apiKey.substring(0, 4) + '...', requestId: reqId };
    logger.warn(logCtx, 'Invalid API Key provided');
    return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
  }

  logger.debug({ requestId: reqId }, 'API Key verified successfully');
  next();
};