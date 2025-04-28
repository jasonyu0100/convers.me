import React from 'react';

export interface ErrorDisplayProps {
  /**
   * The error message to display
   */
  error: string;

  /**
   * Optional title for the error display
   * @default "Error"
   */
  title?: string;

  /**
   * Function to retry or refresh after error
   * @default () => window.location.reload()
   */
  onRetry?: () => void;

  /**
   * Text for the retry button
   * @default "Try Again"
   */
  retryText?: string;

  /**
   * Whether to show the retry button
   * @default true
   */
  showRetryButton?: boolean;

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Standardized error display component for use across all routes
 * Displays an error message with optional retry functionality
 */
export function ErrorDisplay({
  error,
  title = 'Error',
  onRetry = () => window.location.reload(),
  retryText = 'Try Again',
  showRetryButton = true,
  className = '',
}: ErrorDisplayProps) {
  return (
    <div className={`flex flex-1 items-center justify-center p-4 ${className}`}>
      <div className='max-w-md rounded-lg border border-red-300 bg-red-50 p-6 text-center shadow-md'>
        <svg className='mx-auto mb-3 h-10 w-10 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
          <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
        </svg>
        <h3 className='text-xl font-semibold text-red-800'>{title}</h3>
        <p className='mt-3 font-medium text-red-700'>{error}</p>
        {showRetryButton && (
          <button
            onClick={onRetry}
            className='mt-5 rounded-md bg-red-600 px-5 py-2 font-medium text-white transition-colors hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none'
            aria-label={retryText}
          >
            {retryText}
          </button>
        )}
      </div>
    </div>
  );
}
