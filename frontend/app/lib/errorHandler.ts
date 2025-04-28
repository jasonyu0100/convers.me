/**
 * Centralized error handling utilities for the application
 * This file provides standardized error handling for API calls and React components
 */

import * as Sentry from '@sentry/nextjs';
import { ApiResult } from '../services/api';
import logger from './logger';
import { reportError } from './sentryUtils';

/**
 * Error types used throughout the application
 */
export enum ErrorType {
  AUTHENTICATION = 'authentication', // 401 errors
  AUTHORIZATION = 'authorization', // 403 errors
  NETWORK = 'network', // Connection issues
  SERVER = 'server', // 5xx errors
  VALIDATION = 'validation', // 400, 422 errors
  NOT_FOUND = 'not_found', // 404 errors
  UNKNOWN = 'unknown', // Any other errors
}

/**
 * Standardized error object with additional metadata
 */
export interface AppError {
  message: string;
  type: ErrorType;
  originalError?: unknown;
  statusCode?: number;
  data?: any;
}

/**
 * Convert HTTP status code to ErrorType
 */
export function statusCodeToErrorType(statusCode: number): ErrorType {
  if (!statusCode || statusCode === 0) return ErrorType.NETWORK;

  switch (statusCode) {
    case 401:
      return ErrorType.AUTHENTICATION;
    case 403:
      return ErrorType.AUTHORIZATION;
    case 404:
      return ErrorType.NOT_FOUND;
    case 400:
    case 422:
      return ErrorType.VALIDATION;
    case 500:
    case 502:
    case 503:
    case 504:
      return ErrorType.SERVER;
    default:
      if (statusCode >= 500) return ErrorType.SERVER;
      if (statusCode >= 400 && statusCode < 500) return ErrorType.VALIDATION;
      return ErrorType.UNKNOWN;
  }
}

/**
 * Get a user-friendly message for common HTTP status codes
 */
export function getStatusCodeMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Bad request: The server could not understand the request.';
    case 401:
      return 'Authentication required: You need to be logged in to access this resource.';
    case 403:
      return 'Access denied: You do not have permission to access this resource.';
    case 404:
      return 'Not found: The requested resource does not exist.';
    case 408:
      return 'Request timeout: The server timed out waiting for the request.';
    case 422:
      return 'Validation error: The provided data is invalid.';
    case 429:
      return 'Too many requests: You have sent too many requests in a short time.';
    case 500:
      return 'Server error: Something went wrong on the server.';
    case 502:
      return 'Bad gateway: The server received an invalid response from an upstream server.';
    case 503:
      return 'Service unavailable: The server is temporarily unavailable.';
    case 504:
      return 'Gateway timeout: The server did not receive a timely response from an upstream server.';
    default:
      if (statusCode >= 500) return 'Server error: An unexpected error occurred on the server.';
      if (statusCode >= 400 && statusCode < 500) return 'Request error: There was a problem with your request.';
      return 'An unknown error occurred.';
  }
}

/**
 * Create a standardized app error from any error
 */
export function createAppError(error: unknown, defaultMessage = 'An error occurred', statusCode?: number): AppError {
  // If it's already an AppError, return it
  if (typeof error === 'object' && error !== null && 'type' in error && 'message' in error) {
    return error as AppError;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return {
      message: error.message || defaultMessage,
      type: statusCode ? statusCodeToErrorType(statusCode) : ErrorType.UNKNOWN,
      originalError: error,
      statusCode,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error || defaultMessage,
      type: statusCode ? statusCodeToErrorType(statusCode) : ErrorType.UNKNOWN,
      statusCode,
    };
  }

  // Handle unknown errors
  return {
    message: defaultMessage,
    type: statusCode ? statusCodeToErrorType(statusCode) : ErrorType.UNKNOWN,
    originalError: error,
    statusCode,
  };
}

/**
 * Convert an API result with error to an AppError
 */
export function apiResultToError<T>(result: ApiResult): AppError | null {
  if (!result.error) return null;

  const type = statusCodeToErrorType(result.status);

  return {
    message: result.error,
    type,
    statusCode: result.status,
    data: result.data,
    originalError: result.originalError,
  };
}

/**
 * Handle API errors with different strategies based on error type
 * @param error - The error to handle
 * @param options - Error handling options
 */
export function handleApiError(
  error: unknown,
  options: {
    logError?: boolean;
    rethrow?: boolean;
    defaultMessage?: string;
    statusCode?: number;
  } = {},
): AppError {
  const { logError = true, rethrow = false, defaultMessage = 'An error occurred', statusCode } = options;

  // Create consistent error object
  const appError = createAppError(error, defaultMessage, statusCode);

  // Log the error
  if (logError) {
    logger.error(`API Error [${appError.type}]: ${appError.message}`, appError);

    // Also report to Sentry for production monitoring
    reportToSentry(appError, {
      source: 'api',
      handled: true,
    });
  }

  // Rethrow if requested
  if (rethrow) {
    throw appError;
  }

  return appError;
}

/**
 * Display an error message to the user
 * This can be extended to use a toast notification system or other UI components
 */
export function displayErrorToUser(error: AppError | string): void {
  const message = typeof error === 'string' ? error : error.message;

  // For now, just log to console, but this can be replaced with a UI notification
  console.error(`Error: ${message}`);

  // This is where you would implement Toast notifications or other UI feedback
  // Example: toast.error(message);
}

/**
 * Error boundary component fallback message generator
 */
export function getErrorBoundaryFallbackMessage(error: Error): string {
  return `Something went wrong. Please try refreshing the page. Error: ${error.message}${error.stack ? `\n\nStack trace:\n${error.stack}` : ''}`;
}

/**
 * Transform error for reporting to error tracking services
 * Use this when sending errors to external services like Sentry
 */
export function prepareErrorForReporting(error: AppError | unknown): Record {
  const appError = error && typeof error === 'object' && 'type' in error ? (error as AppError) : createAppError(error);

  return {
    message: appError.message,
    errorType: appError.type,
    statusCode: appError.statusCode,
    timestamp: new Date().toISOString(),
    // Add other contextual information as needed
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
  };
}

/**
 * Report error to Sentry with proper context
 */
export function reportToSentry(error: AppError | unknown, context?: Record): string | undefined {
  try {
    const appError = error && typeof error === 'object' && 'type' in error ? (error as AppError) : createAppError(error);

    // Only report in browser context
    if (typeof window === 'undefined') return;

    // Prepare error data
    const errorData = {
      ...prepareErrorForReporting(appError),
      ...(context || {}),
    };

    // Use our Sentry utility to report the error
    return reportError(appError.originalError || new Error(appError.message), errorData);
  } catch (e) {
    // Don't break the app if Sentry reporting fails
    console.error('Failed to report error to Sentry:', e);
    return undefined;
  }
}
