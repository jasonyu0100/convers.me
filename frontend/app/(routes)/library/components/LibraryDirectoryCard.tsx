'use client';

import { FolderIcon } from '@heroicons/react/24/outline';
import { ProcessDirectory } from '../hooks/useLibraryContext';
import { LibraryProcessCard } from './LibraryProcessCard';
import { useState } from 'react';

interface LibraryDirectoryCardProps {
  directory: ProcessDirectory;
}

export function LibraryDirectoryCard({ directory }: LibraryDirectoryCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const directoryColor = directory.color || 'from-blue-500 to-indigo-500';

  return (
    <div className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
      {/* Directory header */}
      <div className='flex cursor-pointer items-center justify-between border-b border-slate-100 px-6 py-4' onClick={() => setIsExpanded(!isExpanded)}>
        <div className='flex items-center gap-3'>
          {/* Colored icon with consistent styling */}
          <div className='relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg'>
            <div className={`h-10 w-10 bg-gradient-to-r ${directoryColor}`}></div>
            <div className='absolute inset-0 flex items-center justify-center'>
              <FolderIcon className='h-5 w-5 text-white' />
            </div>
          </div>
          <div>
            <h3 className='font-semibold text-slate-800'>{directory.name}</h3>
            <p className='text-sm text-slate-500'>{directory.description}</p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <span className='text-sm text-slate-500'>
            {directory.processes.length} {directory.processes.length === 1 ? 'process' : 'processes'}
          </span>
          <button
            className={`flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          >
            <svg width='10' height='6' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M1 1l4 4 4-4' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round' />
            </svg>
          </button>
        </div>
      </div>

      {/* Process grid */}
      {isExpanded && (
        <div className='grid grid-cols-1 gap-5 p-6 lg:grid-cols-2'>
          {directory.processes.map((process) => (
            <LibraryProcessCard key={process.id} process={process} />
          ))}
        </div>
      )}
    </div>
  );
}
