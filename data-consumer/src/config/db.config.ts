import { PoolConfig } from 'pg';
import fs from 'fs';
import logger from '../logger';

// Function to read password from Docker secret or env var
function getDbPassword(): string | undefined {
    const secretPath = process.env.POSTGRES_PASSWORD_FILE;
    if (secretPath && fs.existsSync(secretPath)) {
        try {
            logger.info(`Reading DB password from secret file: ${secretPath}`);
            return fs.readFileSync(secretPath, 'utf8').trim();
        } catch (error) {
            logger.error({ err: error, path: secretPath }, "Failed to read DB password secret file");
            // Fallback or throw error depending on policy
        }
    }
    // Fallback to environment variable if secret not found/readable
    logger.warn('DB password secret file not found or unreadable, falling back to POSTGRES_PASSWORD env var.');
    return process.env.POSTGRES_PASSWORD || 'example'; // Default password if nothing else is set
}

export const dbConfig: PoolConfig = {
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.POSTGRES_HOST || 'postgres',
  database: process.env.POSTGRES_DB || 'oil',
  password: getDbPassword(), // Use the function to get password
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // Increased timeout
};