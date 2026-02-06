import pino from 'pino';

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

// Environment-based configuration
const getLogLevel = (): LogLevel => {
  const env = process.env.NODE_ENV || 'development';
  const configuredLevel = process.env.LOG_LEVEL as LogLevel | undefined;

  if (configuredLevel) {
    return configuredLevel;
  }

  switch (env) {
    case 'production':
      return 'warn';
    default:
      return 'debug';
  }
};

// Create base logger
const baseLogger = pino({
  level: getLogLevel(),
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
    bindings: (bindings) => ({
      pid: bindings.pid,
      host: bindings.hostname,
      env: process.env.NODE_ENV || 'development',
    }),
  },
  // Pretty print in development
  ...(process.env.NODE_ENV !== 'production' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
});

// Logger context interface
interface LogContext {
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  duration?: number;
  [key: string]: unknown;
}

// Create child logger with context
export function createLogger(context: LogContext) {
  return baseLogger.child(context);
}

// Main logger instance
export const logger = {
  debug: (message: string, context?: LogContext) => {
    baseLogger.debug(context || {}, message);
  },

  info: (message: string, context?: LogContext) => {
    baseLogger.info(context || {}, message);
  },

  warn: (message: string, context?: LogContext) => {
    baseLogger.warn(context || {}, message);
  },

  error: (message: string, error?: Error | unknown, context?: LogContext) => {
    const errorInfo = error instanceof Error
      ? {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
        }
      : { error };

    baseLogger.error({ ...context, ...errorInfo }, message);
  },

  fatal: (message: string, error?: Error | unknown, context?: LogContext) => {
    const errorInfo = error instanceof Error
      ? {
          errorName: error.name,
          errorMessage: error.message,
          errorStack: error.stack,
        }
      : { error };

    baseLogger.fatal({ ...context, ...errorInfo }, message);
  },

  // Request logging
  request: (
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    context?: Omit<LogContext, 'method' | 'path' | 'duration'>
  ) => {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    baseLogger[level](
      {
        method,
        path,
        statusCode,
        duration,
        ...context,
      },
      `${method} ${path} ${statusCode} ${duration}ms`
    );
  },

  // Database query logging
  query: (query: string, duration: number, context?: LogContext) => {
    baseLogger.debug(
      {
        type: 'database',
        query: query.substring(0, 200), // Truncate long queries
        duration,
        ...context,
      },
      `DB Query ${duration}ms`
    );
  },

  // External API logging
  externalApi: (
    service: string,
    method: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ) => {
    baseLogger.info(
      {
        type: 'external_api',
        service,
        method,
        statusCode,
        duration,
        ...context,
      },
      `External API: ${service} ${method} ${statusCode} ${duration}ms`
    );
  },

  // AI/Claude API logging
  ai: (
    action: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    duration: number,
    context?: LogContext
  ) => {
    baseLogger.info(
      {
        type: 'ai',
        action,
        model,
        inputTokens,
        outputTokens,
        totalTokens: inputTokens + outputTokens,
        duration,
        ...context,
      },
      `AI: ${action} (${inputTokens}+${outputTokens} tokens) ${duration}ms`
    );
  },

  // Workflow/Business event logging
  event: (eventName: string, data?: unknown, context?: LogContext) => {
    baseLogger.info(
      {
        type: 'event',
        eventName,
        data,
        ...context,
      },
      `Event: ${eventName}`
    );
  },

  // Security event logging
  security: (eventName: string, details?: unknown, context?: LogContext) => {
    baseLogger.warn(
      {
        type: 'security',
        eventName,
        details,
        ...context,
      },
      `Security: ${eventName}`
    );
  },
};

export default logger;
