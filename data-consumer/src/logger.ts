import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  transport: isProduction ? undefined : { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' } },
  base: isProduction ? { pid: process.pid } : undefined,
  redact: ['req.headers.authorization', 'req.headers["x-api-key"]'],
});

export default logger;
