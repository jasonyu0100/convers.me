'use client';

import React from 'react';
import { InterestTagProps, TAG_SIZE_CLASSES } from './types';

/**
 * Reusable interest tag component for profiles, topics and filters
 */
export function InterestTag({ label, onClick, size = 'md', active = false, removable = false, onRemove, className = '' }: InterestTagProps) {
  // State classes
  const stateClasses = active ? 'bg-slate-100 border-slate-400 text-slate-800 hover:bg-slate-200' : 'bg-transparent hover:bg-slate-50 text-slate-700';

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) onRemove();
  };

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full border border-slate-200 transition-colors ${TAG_SIZE_CLASSES[size]} ${stateClasses} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `${label} interest` : undefined}
      aria-pressed={active ? 'true' : undefined}
    >
      {label}

      {removable && (
        <button
          className='hover:bg-opacity-50 ml-1.5 rounded-full p-0.5 hover:bg-slate-200'
          onClick={handleRemove}
          aria-label={`Remove ${label}`}
          type='button'
        >
          <svg xmlns='http://www.w3.org/2000/svg' className='h-3 w-3' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
            <path
              fillRule='evenodd'
              d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
              clipRule='evenodd'
            />
          </svg>
        </button>
      )}
    </div>
  );
}
