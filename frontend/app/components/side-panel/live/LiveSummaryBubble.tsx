'use client';

import { CheckIcon } from '@heroicons/react/24/solid';
import { useEffect, useState } from 'react';

interface LiveSummaryBubbleProps {
  timestamp: string;
  summary: string;
  isNew?: boolean;
}

export function LiveSummaryBubble({ timestamp, summary, isNew = false }: LiveSummaryBubbleProps) {
  const [highlight, setHighlight] = useState(isNew);

  // If it's a new summary, highlight it briefly
  useEffect(() => {
    if (isNew) {
      const timer = setTimeout(() => {
        setHighlight(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  return (
    <div
      className={`mb-3 rounded-lg border transition-all duration-500 ${highlight ? 'border-blue-200 bg-blue-50 shadow-md' : 'border-slate-200 bg-white/80'}`}
    >
      <div className='flex items-center justify-between border-b border-slate-100 px-3 py-2'>
        <div className='flex items-center'>
          <div className='mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100'>
            <CheckIcon className='h-4 w-4 text-blue-600' />
          </div>
          <span className='text-xs font-medium text-slate-500'>Summary at {timestamp}</span>
        </div>
      </div>
      <div className='p-3'>
        <p className='text-sm text-slate-700'>{summary}</p>
      </div>
    </div>
  );
}
