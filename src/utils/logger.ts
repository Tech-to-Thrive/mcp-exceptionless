import pino from 'pino';

const isDebug = process.env.EXCEPTIONLESS_DEBUG === 'true';

export const logger = pino({
  level: isDebug ? 'debug' : 'error',
  ...(isDebug && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname'
      }
    }
  })
});
