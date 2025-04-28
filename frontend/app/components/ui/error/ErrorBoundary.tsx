'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { getErrorBoundaryFallbackMessage } from '@/app/lib/errorHandler';
import logger from '@/app/lib/logger';
import { Button } from '../buttons';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, resetError: () => void) => ReactNode);
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary component for catching and handling errors in the component tree
 * Prevents the entire application from crashing when a component throws an error
 */
export class ErrorBoundary extends Component {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    logger.error('Error caught by ErrorBoundary:', error, errorInfo);

    // Call the optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use the provided fallback or generate a default error message
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, this.resetError);
        }
        return fallback;
      }

      // Default error UI
      return (
        <div className='mx-auto my-8 w-full max-w-2xl rounded-lg border border-red-200 bg-red-50 p-6 shadow-sm'>
          <div className='mb-3 flex items-center'>
            <svg className='mr-2 h-6 w-6 text-red-500' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' />
            </svg>
            <h3 className='text-lg font-medium text-red-800'>Something went wrong</h3>
          </div>
          <pre className='mb-4 max-h-[400px] overflow-auto rounded border border-gray-700 bg-gray-800 p-4 font-mono text-xs whitespace-pre-wrap text-gray-200 shadow-inner'>
            {getErrorBoundaryFallbackMessage(error)}
          </pre>
          <Button onClick={this.resetError} variant='danger'>
            Try again
          </Button>
        </div>
      );
    }

    return children;
  }
}

/**
 * Hook-based error boundary for use within functional components
 */
export function withErrorBoundary<P extends object>(Component: React.ComponentType, errorBoundaryProps?: Omit): React.ComponentType {
  const WithErrorBoundary = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}
