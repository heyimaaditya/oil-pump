import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import logger from '../logger';

export const verifyApiKey = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key']; // Case-insensitive check might be better

  if (!apiKey) {
    logger.warn({ path: req.path, ip: req.ip }, 'API Key missing');
    return res.status(401).json({ error: 'Unauthorized: API Key required' });
  }

  if (apiKey !== config.server.apiKey) {
    logger.warn({ path: req.path, ip: req.ip }, 'Invalid API Key provided');
    return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
  }

  // API Key is valid
  next();
};