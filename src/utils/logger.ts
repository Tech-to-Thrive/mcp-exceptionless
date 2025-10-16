import pino from 'pino';

export const logger = pino({
  level: process.env.EXCEPTIONLESS_DEBUG === 'true' ? 'debug' : 'error',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss',
      ignore: 'pid,hostname'
    }
  }
});
