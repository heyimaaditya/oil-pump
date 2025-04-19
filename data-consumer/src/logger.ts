import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  // Use pino-pretty only in development for readability
  transport: isProduction ? undefined : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } },
  base: { pid: process.pid }, // Add process ID to logs
});

export default logger;