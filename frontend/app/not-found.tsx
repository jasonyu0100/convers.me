'use client';

import React from 'react';
import { Button } from './components/ui/buttons';
import { cn } from './lib/utils';

/**
 * Custom 404 Not Found page
 * Next.js automatically serves this component for unmatched routes
 */
export default function NotFound() {
  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4'>
      {/* Background pattern */}
      <div className='absolute inset-0 z-0 bg-gradient-to-br from-blue-50 to-indigo-100'>
        <div className='bg-grid-slate-200/70 mask-fade-out absolute inset-0 [mask-image:radial-gradient(black,transparent_70%)]' />
      </div>

      {/* Decorative elements */}
      <div className='absolute top-10 left-10 h-48 w-48 animate-pulse rounded-full bg-pink-300 opacity-20 blur-3xl filter'></div>
      <div className='absolute right-10 bottom-10 h-64 w-64 animate-pulse rounded-full bg-purple-300 opacity-20 blur-3xl filter'></div>

      {/* Content */}
      <div className='z-10 w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white/90 shadow-xl backdrop-blur-sm'>
        <div className='p-6 sm:p-8'>
          <div className='text-center'>
            {/* 404 Icon/Illustration */}
            <div className='mb-6 flex justify-center'>
              <div
                className={cn(
                  'flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-600',
                  'text-5xl font-bold text-white shadow-lg',
                )}
              >
                404
              </div>
            </div>

            {/* Title */}
            <h1 className='mb-3 text-3xl font-bold text-gray-900'>Page Not Found</h1>

            {/* Description */}
            <p className='mb-8 text-gray-600'>The page you're looking for doesn't exist or has been moved.</p>

            {/* Navigation options */}
            <div>
              <Button onClick={() => window.history.back()} variant='primary' className='w-full'>
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
