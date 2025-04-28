import React from 'react';

interface PlayButtonProps {
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PlayButton({ onClick, size = 'md', className = '' }: PlayButtonProps) {
  const sizeClasses = {
    sm: 'size-4',
    md: 'size-6',
    lg: 'size-8',
  };

  return (
    <button className={`text-gray-700 transition-colors hover:text-gray-900 ${className}`} onClick={onClick} aria-label='Play audio'>
      <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className={sizeClasses[size]}>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          d='M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z'
        />
      </svg>
    </button>
  );
}
