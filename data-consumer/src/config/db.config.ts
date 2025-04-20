import { PoolConfig } from 'pg';
import fs from 'fs';
import logger from '../logger';

function getDbPassword(): string {
    const secretPath = process.env.POSTGRES_PASSWORD_FILE;
    const envPassword = process.env.POSTGRES_PASSWORD;

    if (secretPath) {
        try {
            if (fs.existsSync(secretPath)) {
                const password = fs.readFileSync(secretPath, 'utf8').trim();
                if (password) {
                    logger.info(`Reading DB password from secret file: ${secretPath}`);
                    return password;
                } else { logger.warn(`DB password secret file found but is empty: ${secretPath}. Falling back...`); }
            } else { logger.warn(`DB password secret file not found at: ${secretPath}. Falling back...`); }
        } catch (error) { logger.error({ err: error, path: secretPath }, "Failed to read DB password secret file. Falling back..."); }
    } else { logger.debug('POSTGRES_PASSWORD_FILE environment variable not set.'); }

    if (envPassword) { logger.warn('Using DB password from POSTGRES_PASSWORD environment variable.'); return envPassword; }

    logger.error("No DB password provided via secret file or POSTGRES_PASSWORD env var. Using default 'example'. THIS IS INSECURE.");
    return 'example';
}

export const dbConfig: PoolConfig = {
  user: process.env.POSTGRES_USER || 'postgres',
 
  host: process.env.POSTGRES_HOST || 'postgres',
  database: process.env.POSTGRES_DB || 'oil',
  password: getDbPassword(),
 
  port: parseInt(process.env.POSTGRES_PORT_INTERNAL || '5432', 10),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

logger.info({
    user: dbConfig.user, host: dbConfig.host, database: dbConfig.database, port: dbConfig.port, max: dbConfig.max,
    passwordSource: process.env.POSTGRES_PASSWORD_FILE && fs.existsSync(process.env.POSTGRES_PASSWORD_FILE) ? 'secret_file' : (process.env.POSTGRES_PASSWORD ? 'env_var' : 'default')
}, 'PostgreSQL configuration loaded');
