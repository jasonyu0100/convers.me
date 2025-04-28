'use client';

import React from 'react';
import { Button } from '../buttons';
import { cn } from '@/app/lib/utils';

interface OfflinePageProps {
  onRetry?: () => void;
}

/**
 * Page displayed when the application is offline
 * This can be shown when network requests fail due to connectivity issues
 */
export function OfflinePage({ onRetry }: OfflinePageProps) {
  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-4'>
      {/* Background pattern */}
      <div className='absolute inset-0 z-0 bg-gradient-to-br from-blue-50 to-cyan-100'>
        <div className='bg-grid-slate-200/70 mask-fade-out absolute inset-0 [mask-image:radial-gradient(black,transparent_70%)]' />
      </div>

      {/* Decorative elements */}
      <div className='absolute top-10 left-10 h-48 w-48 animate-pulse rounded-full bg-blue-300 opacity-20 blur-3xl filter'></div>
      <div className='absolute right-10 bottom-10 h-64 w-64 animate-pulse rounded-full bg-cyan-300 opacity-20 blur-3xl filter'></div>

      {/* Content */}
      <div className='z-10 w-full max-w-md overflow-hidden rounded-lg border border-gray-200 bg-white/90 shadow-xl backdrop-blur-sm'>
        <div className='p-6 sm:p-8'>
          <div className='text-center'>
            {/* Icon */}
            <div className='mb-6 flex justify-center'>
              <div className={cn('flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg')}>
                <svg className='h-14 w-14 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z'
                  />
                </svg>
              </div>
            </div>

            {/* Title */}
            <h1 className='mb-3 text-3xl font-bold text-gray-900'>You're Offline</h1>

            {/* Description */}
            <p className='mb-8 text-gray-600'>It seems there's a problem with your internet connection. Please check your connection and try again.</p>

            {/* Action button */}
            <div className='space-y-3'>
              <Button onClick={onRetry} variant='primary' className='w-full'>
                Try Again
              </Button>
            </div>
          </div>
        </div>

        {/* Network status checker */}
        <div className='border-t border-gray-200 bg-gray-50/80 px-6 py-4'>
          <NetworkStatusIndicator />
        </div>
      </div>
    </div>
  );
}

/**
 * Helper component that shows current network status
 */
function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = React.useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  React.useEffect(() => {
    function handleOnlineStatus() {
      setIsOnline(true);
    }

    function handleOfflineStatus() {
      setIsOnline(false);
    }

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOfflineStatus);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOfflineStatus);
    };
  }, []);

  return (
    <div className='flex items-center justify-center'>
      <div className={cn('mr-2 h-2 w-2 rounded-full', isOnline ? 'bg-green-500' : 'bg-red-500')} />
      <span className='text-sm text-gray-600'>{isOnline ? 'Your internet connection is restored' : 'You are currently offline'}</span>
    </div>
  );
}
