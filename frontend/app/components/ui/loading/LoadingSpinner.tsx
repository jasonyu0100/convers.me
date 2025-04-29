'use client';

import { useEffect, useState } from 'react';
import { LOADING_COLOR_CLASSES, LOADING_SIZE_CLASSES, LoadingSpinnerProps } from './types';

/**
 * Enhanced animated loading spinner component with modern design and animations
 */
export function LoadingSpinner({ size = 'md', color = 'blue', text, fullScreen = false }: LoadingSpinnerProps) {
  const [opacity, setOpacity] = useState(0);
  const [dots, setDots] = useState('');

  // Fade in effect
  useEffect(() => {
    // Start the fade in animation after a tiny delay
    const fadeTimer = setTimeout(() => {
      setOpacity(1);
    }, 50);

    // Animate the loading dots
    const dotsTimer = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => {
      clearTimeout(fadeTimer);
      clearInterval(dotsTimer);
    };
  }, []);

  // Container styles for fullScreen mode
  const containerClasses = fullScreen
    ? 'h-screen w-full flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm'
    : 'flex flex-col items-center justify-center';

  // Transition style for smooth fade-in
  const transitionStyle = {
    opacity: opacity,
    transition: 'opacity 0.4s ease-out',
  };

  return (
    <div className={containerClasses} style={transitionStyle} role='status'>
      <div className='relative'>
        {/* Subtle glow effect */}
        <div
          className={`absolute inset-0 ${LOADING_COLOR_CLASSES[color]} rounded-full opacity-20 blur-md`}
          style={{ transform: 'scale(1.35)' }}
          aria-hidden='true'
        ></div>

        {/* Main spinner */}
        <div className={`${LOADING_SIZE_CLASSES[size]} ${LOADING_COLOR_CLASSES[color]} relative z-10 animate-spin`}>
          <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' aria-hidden='true'>
            <circle className='opacity-20' cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='4'></circle>
            <path
              className='opacity-90'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            ></path>
          </svg>
        </div>
      </div>

      {/* Loading text with animated dots */}
      {text && (
        <div className='mt-6 text-center'>
          <p className={`font-medium ${size === 'lg' ? 'text-lg' : 'text-base'}`}>
            {text.replace(/\.+$/, '')}
            <span className='inline-block w-6 opacity-80'>{dots}</span>
          </p>

          {/* Modern progress bar */}
          <div className='mt-3 h-1 w-32 overflow-hidden rounded-full bg-gray-100'>
            <div className='animate-loadingBar h-full bg-gradient-to-r from-blue-400 to-blue-600'></div>
          </div>
        </div>
      )}

      {/* Screen reader text */}
      <span className='sr-only'>Loading{text ? `: ${text}` : ''}</span>
    </div>
  );
}
