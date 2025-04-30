'use client';

import { LibraryProcess } from '../../types';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface DirectoryCardProps {
  process: LibraryProcess;
  onSelect: () => void;
}

/**
 * Card component for displaying a process within a directory
 */
export function DirectoryCard({ process, onSelect }: DirectoryCardProps) {
  // For a real implementation, we would map icon strings to actual icon components
  // Here we'll just use a default icon
  const ProcessIcon = DocumentTextIcon;

  return (
    <div onClick={onSelect} className='relative flex aspect-[4/3] cursor-pointer flex-col rounded-lg bg-white transition-all hover:bg-slate-50'>
      {/* Card content with padding */}
      <div className='flex flex-1 flex-col p-3'>
        {/* Card header */}
        <div className='mb-1 flex items-center justify-between'>
          <h3 className='truncate text-sm font-medium text-slate-800'>{process.title}</h3>
          <span className='ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800'>Template</span>
        </div>

        {/* Description - grows to fill available space */}
        {process.description ? (
          <p className='mb-auto line-clamp-2 text-xs text-slate-500' title={process.description}>
            {process.description}
          </p>
        ) : (
          <div className='mb-auto'></div> /* Spacer if no description */
        )}

        {/* Card footer with meta info */}
        <div className='mt-2 flex items-center justify-between text-xs text-slate-400'>
          <div className='flex items-center'>
            <span>{process.steps.length} steps</span>
          </div>
          {process.saves && <span>{process.saves.toLocaleString()} saves</span>}
        </div>
      </div>
    </div>
  );
}
