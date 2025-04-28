'use client';

import { useEffect, useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { PageLoadingProps } from './types';

/**
 * Enhanced full page loading component for route transitions with fade effects
 */
export function PageLoading({ message = 'Loading...', showBackground = true }: PageLoadingProps) {
  const [show, setShow] = useState(false);
  const timeout = 0; // Default for page transitions

  // Only show the loading indicator after a small delay
  // This prevents flashing for very quick transitions
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  if (!show) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${
        showBackground ? 'bg-opacity-90 bg-white/80 backdrop-blur-sm' : ''
      }`}
    >
      <div className='animate-fadeIn'>
        <LoadingSpinner size='lg' text={message} />
      </div>
    </div>
  );
}

/**
 * Enhanced loading component for content sections with animation
 */
export interface ContentLoadingProps extends PageLoadingProps {
  timeout?: number;
}

export function ContentLoading({ message = 'Loading content...', timeout = 100, showBackground = false }: ContentLoadingProps) {
  const [show, setShow] = useState(false);

  // Only show the loading indicator after a small delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, timeout);

    return () => clearTimeout(timer);
  }, [timeout]);

  if (!show) {
    return <div className='w-full flex-1'></div>;
  }

  return (
    <div
      className={`flex w-full flex-1 items-center justify-center transition-opacity duration-300 ${
        showBackground ? 'rounded-xl bg-white/80 p-8 backdrop-blur-sm' : ''
      }`}
    >
      <div className='animate-fadeIn'>
        <LoadingSpinner size='md' text={message} />
      </div>
    </div>
  );
}
