/**
 * Centralized logging utility for consistent logging across the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  level?: LogLevel;
  context?: string;
  data?: any;
}

// Current environment - this should be set based on process.env or similar
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Default minimum log level
const MIN_LOG_LEVEL: LogLevel = IS_PRODUCTION ? 'warn' : 'debug';

/**
 * The order of log levels for comparison
 */
const LOG_LEVEL_ORDER: Record = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Checks if a message at the given level should be logged
 */
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[MIN_LOG_LEVEL];
}

/**
 * Formats a log message with optional context
 */
function formatMessage(message: string, options?: LogOptions): string {
  const { context } = options || {};
  if (context) {
    return `[${context}] ${message}`;
  }
  return message;
}

/**
 * Logs a debug message
 */
function debug(message: string, options?: Omit): void {
  if (!shouldLog('debug')) return;

  const formattedMessage = formatMessage(message, { ...options, level: 'debug' });

  if (options?.data) {
    console.debug(formattedMessage, options.data);
  } else {
    console.debug(formattedMessage);
  }
}

/**
 * Logs an info message
 */
function info(message: string, options?: Omit): void {
  if (!shouldLog('info')) return;

  const formattedMessage = formatMessage(message, { ...options, level: 'info' });

  if (options?.data) {
    console.info(formattedMessage, options.data);
  } else {
    console.info(formattedMessage);
  }
}

/**
 * Logs a warning message
 */
function warn(message: string, options?: Omit): void {
  if (!shouldLog('warn')) return;

  const formattedMessage = formatMessage(message, { ...options, level: 'warn' });

  if (options?.data) {
    console.warn(formattedMessage, options.data);
  } else {
    console.warn(formattedMessage);
  }
}

/**
 * Logs an error message
 */
function error(message: string, options?: Omit): void {
  if (!shouldLog('error')) return;

  const formattedMessage = formatMessage(message, { ...options, level: 'error' });

  if (options?.data) {
    console.error(formattedMessage, options.data);
  } else {
    console.error(formattedMessage);
  }
}

/**
 * Creates a logger with a specific context
 */
function createContextLogger(context: string) {
  return {
    debug: (message: string, options?: Omit) => debug(message, { ...options, context }),
    info: (message: string, options?: Omit) => info(message, { ...options, context }),
    warn: (message: string, options?: Omit) => warn(message, { ...options, context }),
    error: (message: string, options?: Omit) => error(message, { ...options, context }),
  };
}

// Export the logger functions
export const logger = {
  debug,
  info,
  warn,
  error,
  createContextLogger,
};

export default logger;
