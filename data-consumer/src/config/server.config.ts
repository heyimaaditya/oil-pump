import logger from "../logger";

const defaultApiKey = 'default-insecure-key-please-change';

export const serverConfig = {
    
    port: parseInt(process.env.API_PORT || '8080', 10),
    apiKey: process.env.API_KEY || defaultApiKey,
    corsOrigin: process.env.FRONTEND_URL || 'http://localhost:4200', 
};

if (serverConfig.apiKey === defaultApiKey) {
    if (process.env.NODE_ENV === 'production') {
        logger.fatal("CRITICAL SECURITY RISK: Using default insecure API key in production environment!");
    } else {
         logger.warn("Using default insecure API key. Set API_KEY environment variable for security.");
    }
} else {
    logger.info("API Key loaded from environment variable.");
}

logger.info({ port: serverConfig.port, corsOrigin: serverConfig.corsOrigin }, "Server configuration loaded");
  