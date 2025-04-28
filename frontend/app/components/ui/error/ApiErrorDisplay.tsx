'use client';

import React from 'react';
import { AppError, ErrorType } from '@/app/lib/errorHandler';
import { Button } from '../buttons';

interface ApiErrorDisplayProps {
  error: AppError | Error | string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Standardized component for displaying API errors in the UI
 * Provides specific messaging based on the error type (401, 404, 500, etc.)
 */
export function ApiErrorDisplay({ error, onRetry, className = '' }: ApiErrorDisplayProps) {
  // Extract error message and type
  const errorMessage = typeof error === 'string' ? error : 'message' in error ? error.message : 'An unknown error occurred';

  // Extract status code if available
  const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error ? (error as AppError).statusCode : undefined;

  // Determine error type if it's an AppError
  const errorType = typeof error === 'object' && error !== null && 'type' in error ? (error.type as ErrorType) : ErrorType.UNKNOWN;

  // Choose appropriate UI based on error type
  let title = 'Error';
  let description = errorMessage;
  let icon = (
    <svg className='mr-2 h-6 w-6 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
    </svg>
  );

  // Customize display based on error type
  switch (errorType) {
    case ErrorType.AUTHENTICATION:
      title = 'Authentication Error';
      description = statusCode === 401 ? 'You need to be logged in to access this resource. Please log in and try again.' : errorMessage;
      icon = (
        <svg className='mr-2 h-6 w-6 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
          />
        </svg>
      );
      break;

    case ErrorType.AUTHORIZATION:
      title = 'Authorization Error';
      description = statusCode === 403 ? 'You do not have permission to access this resource.' : errorMessage;
      icon = (
        <svg className='mr-2 h-6 w-6 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
          />
        </svg>
      );
      break;

    case ErrorType.NETWORK:
      title = 'Network Error';
      description = 'Unable to connect to the server. Please check your internet connection and try again.';
      icon = (
        <svg className='mr-2 h-6 w-6 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z'
          />
        </svg>
      );
      break;

    case ErrorType.NOT_FOUND:
      title = 'Not Found';
      description = statusCode === 404 ? 'The requested resource was not found.' : errorMessage;
      icon = (
        <svg className='mr-2 h-6 w-6 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
          />
        </svg>
      );
      break;

    case ErrorType.VALIDATION:
      title = 'Validation Error';
      description = statusCode === 400 ? 'There was a problem with the data you submitted. Please check your inputs and try again.' : errorMessage;
      icon = (
        <svg className='mr-2 h-6 w-6 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
          />
        </svg>
      );
      break;

    case ErrorType.SERVER:
      title = 'Server Error';
      description =
        statusCode === 500
          ? 'An unexpected error occurred on the server. Please try again later or contact support if the problem persists.'
          : statusCode === 503
          ? 'The service is temporarily unavailable. Please try again later.'
          : errorMessage;
      icon = (
        <svg className='mr-2 h-6 w-6 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'
          />
        </svg>
      );
      break;
  }

  return (
    <div className={`rounded-lg border border-red-300 bg-red-50 p-5 shadow-md ${className}`}>
      <div className='mb-3 flex items-center'>
        {icon}
        <h3 className='text-lg font-semibold text-red-800'>
          {title}
          {statusCode && <span className='ml-2 text-sm font-medium text-red-600'>Error {statusCode}</span>}
        </h3>
      </div>
      <p className='mb-4 text-sm font-medium text-red-700'>{description}</p>
      {onRetry && (
        <Button onClick={onRetry} variant='danger' size='sm'>
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * A smaller, more compact version of the API error display
 * Shows specific error types with minimal UI
 */
export function ApiErrorBadge({ error, onRetry, className = '' }: ApiErrorDisplayProps) {
  // Extract error type and message
  const errorType = typeof error === 'object' && error !== null && 'type' in error ? (error.type as ErrorType) : ErrorType.UNKNOWN;

  const errorMessage = typeof error === 'string' ? error : 'message' in error ? error.message : 'An unknown error occurred';

  // Status code if available
  const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error ? (error as AppError).statusCode : undefined;

  // Determine display message based on error type
  let displayMessage = errorMessage;
  switch (errorType) {
    case ErrorType.AUTHENTICATION:
      displayMessage = 'Authentication required';
      break;
    case ErrorType.AUTHORIZATION:
      displayMessage = 'Permission denied';
      break;
    case ErrorType.NETWORK:
      displayMessage = 'Network error';
      break;
    case ErrorType.NOT_FOUND:
      displayMessage = 'Not found';
      break;
    case ErrorType.VALIDATION:
      displayMessage = 'Invalid data';
      break;
    case ErrorType.SERVER:
      displayMessage = 'Server error';
      break;
  }

  // Add status code if available
  if (statusCode) {
    displayMessage = `${displayMessage} (${statusCode})`;
  }

  return (
    <div
      className={`inline-flex items-center rounded-md border border-red-200 bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-800 shadow-sm ${className}`}
    >
      <svg className='mr-1.5 h-3.5 w-3.5 text-red-600' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
      </svg>
      <span className='max-w-[220px] truncate'>{displayMessage}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className='ml-2 rounded-sm text-red-700 hover:text-red-900 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 focus:outline-none'
          aria-label='Retry'
        >
          <svg className='h-3.5 w-3.5' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15'
            />
          </svg>
        </button>
      )}
    </div>
  );
}
