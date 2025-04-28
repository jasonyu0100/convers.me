'use client';

import * as Sentry from '@sentry/nextjs';
import { useState } from 'react';
import { Button } from '../buttons';

type ErrorBoundaryProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

export default function SentryErrorBoundary({ children, fallback }: ErrorBoundaryProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      fallback || (
        <div className='flex h-full w-full flex-col items-center justify-center p-4'>
          <div className='rounded-lg bg-white/80 p-6 shadow-md'>
            <h2 className='mb-4 text-xl font-semibold text-red-600'>Something went wrong</h2>
            <p className='mb-4 text-gray-700'>We've been notified about this issue and we'll take a look at it shortly.</p>
            <div className='flex flex-col gap-2 sm:flex-row'>
              <Button
                variant='primary'
                onClick={() => {
                  setHasError(false);
                  window.location.href = '/';
                }}
              >
                Go to Home
              </Button>
              <Button
                variant='secondary'
                onClick={() => {
                  setHasError(false);
                  window.location.reload();
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )
    );
  }

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, componentStack, resetError }) => {
        Sentry.captureException(error);
        setHasError(true);
        return null;
      }}
    >
      {children}
    </Sentry.ErrorBoundary>
  );
}
