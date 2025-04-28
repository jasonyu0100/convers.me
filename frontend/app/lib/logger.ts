/**
 * Simple logging utility for the application.
 * Only logs errors in production, debug/info in development.
 * Also sends errors to Sentry when available.
 */

import * as Sentry from '@sentry/nextjs';

// Control log levels using environment variables
const ENABLE_ALL_LOGS = process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true' || process.env.NODE_ENV === 'development';

// Production mode - only allow errors
const ENABLE_DEBUG_LOGS = ENABLE_ALL_LOGS && (process.env.NEXT_PUBLIC_ENABLE_DEBUG_LOGS === 'true' || process.env.NODE_ENV === 'development');

// Different log levels
const LogLevel = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
} as const;

type LogLevelType = (typeof LogLevel)[keyof typeof LogLevel];

function log(level: LogLevelType, message: string, ...args: any[]) {
  // Always allow errors in any environment
  if (level !== LogLevel.ERROR) {
    // Skip non-error logs in production
    if (!ENABLE_ALL_LOGS) return;

    // Skip debug logs unless explicitly enabled
    if (level === LogLevel.DEBUG && !ENABLE_DEBUG_LOGS) {
      // Only allow auth-related debug messages if critical
      if (!message.includes('[Auth:Critical]')) {
        return;
      }
    }
  }

  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;

  switch (level) {
    case LogLevel.ERROR:
      console.error(`${prefix} ${message}`, ...args);
      // Send errors to Sentry
      try {
        // Check if the first argument is an error object
        const errorObject = args[0] instanceof Error ? args[0] : new Error(message);

        // Add context from additional args
        const extraContext = args.length > 1 ? { additionalInfo: args.slice(1) } : undefined;

        // Send to Sentry with context
        if (typeof window !== 'undefined') {
          Sentry.captureException(errorObject, {
            extra: extraContext,
          });
        }
      } catch (e) {
        // Don't let Sentry reporting break the application
        console.error('Failed to report error to Sentry', e);
      }
      break;
    case LogLevel.WARN:
      console.warn(`${prefix} ${message}`, ...args);
      break;
    case LogLevel.DEBUG:
      console.debug(`${prefix} ${message}`, ...args);
      break;
    case LogLevel.INFO:
    default:
      console.log(`${prefix} ${message}`, ...args);
  }
}

// Exported logging functions
export const logger = {
  info: (message: string, ...args: any[]) => log(LogLevel.INFO, message, ...args),
  warn: (message: string, ...args: any[]) => log(LogLevel.WARN, message, ...args),
  error: (message: string, ...args: any[]) => log(LogLevel.ERROR, message, ...args),
  debug: (message: string, ...args: any[]) => log(LogLevel.DEBUG, message, ...args),
};

export default logger;
