'use client';

import { BookmarkIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useLibrary } from '../hooks/useLibrary';
import { LibraryProcess } from '../hooks/useLibraryContext';

interface LibraryProcessCardProps {
  process: LibraryProcess;
}

export function LibraryProcessCard({ process }: LibraryProcessCardProps) {
  const { handleProcessSelect } = useLibrary();
  const [showSteps, setShowSteps] = useState(false);

  const handleViewToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSteps(!showSteps);
  };

  // Calculate the estimated time for the process
  const getEstimatedTime = (steps: number) => {
    const avgTimePerStep = 20; // minutes per step
    const totalMinutes = steps * avgTimePerStep;

    if (totalMinutes < 60) {
      return `${totalMinutes} min`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return minutes > 0 ? `${hours} hr ${minutes} min` : `${hours} hr`;
  };

  // Add a simulated progress for display purposes
  const progress = 100; // All are complete templates

  return (
    <div
      className='relative flex aspect-[4/3] cursor-pointer flex-col rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:border-blue-300 hover:shadow-md'
      onClick={(e) => {
        e.stopPropagation();
        if (handleProcessSelect) handleProcessSelect(process.id);
      }}
    >
      {/* Card content with padding */}
      <div className='flex flex-1 flex-col p-4'>
        {/* Card header */}
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='truncate font-medium text-slate-800'>{process.title}</h3>
          <span className='ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800'>Template</span>
        </div>

        {/* Description - grows to fill available space */}
        {process.description ? (
          <p className='mb-auto line-clamp-2 text-sm text-slate-500' title={process.description}>
            {process.description}
          </p>
        ) : (
          <div className='mb-auto'></div> /* Spacer if no description */
        )}

        {/* View steps button */}
        <div className='mt-auto pt-2 text-right'>
          <button onClick={handleViewToggle} className='text-xs font-medium text-blue-600 hover:text-blue-800'>
            {showSteps ? 'Hide steps' : 'View steps'}
          </button>
        </div>
      </div>

      {/* Collapsible steps section */}
      {showSteps && (
        <div className='absolute top-full right-0 left-0 z-10 mt-2 rounded-lg border border-slate-200 bg-white p-4 shadow-lg'>
          <div className='mb-3 text-sm font-medium text-slate-700'>Process Steps:</div>
          <div className='mb-3 space-y-3'>
            {process.steps.slice(0, 3).map((step, i) => (
              <div key={i} className='rounded-lg border border-slate-100 bg-slate-50 p-3 transition-colors hover:border-blue-100'>
                <div className='text-sm font-medium text-slate-800'>
                  {i + 1}. {step.title}
                </div>
                <div className='mt-1 text-xs text-slate-600'>{step.description}</div>
              </div>
            ))}
            {process.steps.length > 3 && <div className='text-center text-xs text-slate-500'>+{process.steps.length - 3} more steps</div>}
          </div>
        </div>
      )}
    </div>
  );
}
