'use client';

import React from 'react';

interface PlaybackControlsProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onSeek: (time: number) => void;
  variant?: 'default' | 'minimal' | 'transparent';
  showTimestamps?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Reusable playback controls component for video/audio players
 */
export function PlaybackControls({
  currentTime,
  duration,
  isPlaying,
  onPlayPause,
  onSeek,
  variant = 'default',
  showTimestamps = true,
  size = 'md',
  className = '',
}: PlaybackControlsProps) {
  // Format time as mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle slider change
  const handleSeek = (e: React.ChangeEvent) => {
    onSeek(Number(e.target.value));
  };

  // Size classes
  const sizeClasses = {
    sm: 'p-2 rounded-md',
    md: 'p-3 rounded-lg',
    lg: 'p-4 rounded-xl',
  };

  // Button size classes
  const buttonSizeClasses = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  // Variant classes
  const variantClasses = {
    default: 'bg-black/40 text-white',
    minimal: 'bg-slate-100 text-slate-800',
    transparent: 'bg-transparent text-white',
  };

  return (
    <div className={`flex flex-col ${sizeClasses[size]} ${variantClasses[variant]} w-full ${className}`}>
      <div className='mb-2 flex items-center justify-between'>
        {showTimestamps && <span className='text-sm'>{formatTime(currentTime)}</span>}

        <div className='flex items-center justify-center'>
          <button
            className={`flex items-center justify-center rounded-full bg-white/80 text-black transition-colors hover:bg-gray-200 ${buttonSizeClasses[size]}`}
            onClick={onPlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className={iconSizeClasses[size]}>
                <path strokeLinecap='round' strokeLinejoin='round' d='M15.75 5.25v13.5m-7.5-13.5v13.5' />
              </svg>
            ) : (
              <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className={iconSizeClasses[size]}>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z'
                />
              </svg>
            )}
          </button>
        </div>

        {showTimestamps && <span className='text-sm'>{formatTime(duration)}</span>}
      </div>

      <input
        type='range'
        min='0'
        max={duration || 100}
        value={currentTime}
        onChange={handleSeek}
        className='w-full cursor-pointer accent-white'
        aria-label='Seek'
      />
    </div>
  );
}
