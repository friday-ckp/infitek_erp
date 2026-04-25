import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import pino from 'pino';
import type { Params } from 'nestjs-pino';
import { createDailyFileStream } from './daily-file-stream';

const LOG_RETENTION_DAYS = 14;

function resolveLogLevel() {
  return process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug');
}

function ensureLogsDirectory() {
  const logsDir = join(process.cwd(), 'logs');
  return logsDir;
}

export function createLoggerConfig(): Params {
  const level = resolveLogLevel();
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    return {
      pinoHttp: {
        level,
        autoLogging: true,
        customLogLevel: resolveHttpLogLevel,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      },
    };
  }

  const logsDir = ensureLogsDirectory();
  const fileStream = createDailyFileStream({
    filename: 'app.log',
    logsDir,
    retentionDays: LOG_RETENTION_DAYS,
  });
  const logger = pino(
    {
      level,
      timestamp: pinoTimeFunction,
    },
    pino.multistream([
      { level, stream: pino.destination(1) },
      { level, stream: fileStream },
    ]),
  );

  return {
    pinoHttp: {
      logger,
      autoLogging: true,
      customLogLevel: resolveHttpLogLevel,
    },
  };
}

function pinoTimeFunction() {
  return `,"time":"${new Date().toISOString()}"`;
}

function resolveHttpLogLevel(
  request: IncomingMessage & { route?: unknown },
  response: ServerResponse<IncomingMessage>,
  error?: Error,
) {
  if (error || (response.statusCode ?? 200) >= 500) {
    return 'error';
  }

  if ((response.statusCode ?? 200) >= 400) {
    return 'warn';
  }

  if (request.route) {
    return 'silent';
  }

  return 'info';
}
