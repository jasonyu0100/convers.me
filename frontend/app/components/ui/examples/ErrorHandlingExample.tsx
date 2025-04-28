'use client';

import React, { useState } from 'react';
import { ApiErrorDisplay, ApiErrorBadge } from '../error/ApiErrorDisplay';
import { AppError, ErrorType } from '@/app/lib/errorHandler';
import { Button } from '../buttons';

/**
 * Example component demonstrating different error types and how they're displayed
 * This component showcases how the ApiErrorDisplay handles different HTTP status codes
 */
export function ErrorHandlingExample() {
  const [selectedError, setSelectedError] = useState<AppError | null>(null);

  // Create example errors for different status codes
  const createError = (statusCode: number, message?: string): AppError => {
    const errorTypes: Record = {
      400: ErrorType.VALIDATION,
      401: ErrorType.AUTHENTICATION,
      403: ErrorType.AUTHORIZATION,
      404: ErrorType.NOT_FOUND,
      422: ErrorType.VALIDATION,
      500: ErrorType.SERVER,
      503: ErrorType.SERVER,
      0: ErrorType.NETWORK,
    };

    return {
      message: message || `Error message for ${statusCode}`,
      type: errorTypes[statusCode] || ErrorType.UNKNOWN,
      statusCode,
    };
  };

  // Example errors
  const exampleErrors = [
    createError(400, 'Invalid parameters provided.'),
    createError(401, 'Authentication required to access this resource.'),
    createError(403, 'You do not have permission to access this resource.'),
    createError(404, 'The requested resource was not found.'),
    createError(422, 'The provided data failed validation.'),
    createError(500, 'An unexpected error occurred on the server.'),
    createError(503, 'The service is temporarily unavailable.'),
    createError(0, 'Network error: Could not connect to server.'),
  ];

  return (
    <div className='p-6'>
      <h2 className='mb-4 text-xl font-bold'>Error Handling Examples</h2>

      <div className='mb-6'>
        <h3 className='mb-2 text-lg font-medium'>Select an error type to display:</h3>
        <div className='flex flex-wrap gap-2'>
          {exampleErrors.map((error) => (
            <button key={error.statusCode} onClick={() => setSelectedError(error)} className='rounded-md bg-gray-100 px-3 py-1 text-sm hover:bg-gray-200'>
              Error {error.statusCode || 'Network'}
            </button>
          ))}
        </div>
      </div>

      {selectedError && (
        <div className='space-y-8'>
          <div>
            <h3 className='mb-2 text-lg font-medium'>Full Error Display:</h3>
            <ApiErrorDisplay error={selectedError} onRetry={() => alert('Retry action triggered')} />
          </div>

          <div>
            <h3 className='mb-2 text-lg font-medium'>Compact Error Badge:</h3>
            <ApiErrorBadge error={selectedError} onRetry={() => alert('Retry action triggered')} />
          </div>
        </div>
      )}

      {!selectedError && (
        <div className='rounded-lg border border-dashed border-gray-300 py-8 text-center text-gray-500'>
          Select an error type above to see how it's displayed
        </div>
      )}
    </div>
  );
}
