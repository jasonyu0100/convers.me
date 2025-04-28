'use client';

import { useEffect } from 'react';
import { Button } from './components/ui/buttons';
import logger from './lib/logger';
import { cn } from './lib/utils';

/**
 * Global error page
 * This is rendered when an uncaught error is thrown in a route segment
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  // Log the error to our logging system
  useEffect(() => {
    logger.error('Global error caught:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4'>
          {/* Background pattern */}
          <div className='absolute inset-0 z-0 bg-gradient-to-b from-indigo-50 to-blue-100'>
            <div className='bg-grid-slate-200/70 mask-fade-out absolute inset-0 [mask-image:radial-gradient(black,transparent_70%)]' />
          </div>

          {/* Decorative elements */}
          <div className='absolute top-10 left-10 h-48 w-48 animate-pulse rounded-full bg-blue-300 opacity-20 blur-3xl filter'></div>
          <div className='absolute right-10 bottom-10 h-64 w-64 animate-pulse rounded-full bg-indigo-300 opacity-20 blur-3xl filter'></div>

          {/* Content */}
          <div className='z-10 w-full max-w-2xl overflow-hidden rounded-xl border border-gray-200 bg-white/80 shadow-2xl backdrop-blur-sm'>
            <div className='p-8'>
              <div className='text-center'>
                {/* Error Icon - Updated to a more modern style */}
                <div className='mb-6 flex justify-center'>
                  <div className={cn('flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg')}>
                    <svg className='h-12 w-12 text-white' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
                      <path
                        d='M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z'
                        stroke='currentColor'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                      />
                    </svg>
                  </div>
                </div>

                {/* Title - Updated styling */}
                <h1 className='mb-3 text-3xl font-bold text-gray-900'>Something Went Wrong</h1>

                {/* Description - Updated messaging */}
                <p className='mb-6 text-gray-600'>An unexpected error occurred. Our team has been notified and is working on a solution.</p>

                {/* Error details - always shown now with larger container */}
                <div className='mb-6 overflow-hidden rounded-lg border border-gray-700 bg-gray-900 p-4 text-left shadow-md'>
                  <p className='text-sm font-medium text-gray-300'>Error details:</p>
                  <pre className='mt-2 max-h-[400px] overflow-auto rounded-md bg-gray-800 p-4 font-mono text-xs whitespace-pre-wrap text-gray-200'>
                    {error.message}
                    {error.stack && (
                      <>
                        <br />
                        <br />
                        <span className='font-semibold'>Stack trace:</span>
                        <code className='mt-2 block text-gray-300'>{error.stack}</code>
                      </>
                    )}
                  </pre>
                </div>

                {/* Action buttons - Updated with multiple options */}
                <div className='flex flex-col gap-3'>
                  <Button onClick={reset} variant='primary' className='w-full'>
                    Try Again
                  </Button>
                  <Button onClick={() => (window.location.href = '/')} variant='secondary' className='w-full'>
                    Go to Home
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
