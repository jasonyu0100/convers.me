'use client';

import { BookmarkIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { GradientBackground } from '../../../components/ui/backgrounds/GradientBackground';
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

  return (
    <div className='overflow-hidden rounded-lg border border-gray-200 bg-white/80 shadow-sm transition-all hover:translate-y-[-4px] hover:shadow-md'>
      <div className='p-4'>
        <div className='flex items-start gap-3'>
          <div className='relative flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full'>
            <div className='absolute inset-0'>
              <GradientBackground
                intensity='subtle'
                color={process.title.toLowerCase().includes('team') ? 'purple' : process.title.toLowerCase().includes('personal') ? 'teal' : 'blue'}
                shapes={false}
                texture={false}
                animated={false}
              />
            </div>
            <div style={{ zIndex: 1 }}>{process.icon}</div>
          </div>
          <div>
            <h3 className='font-semibold text-gray-900'>{process.title}</h3>
            <p className='mt-1 text-sm text-gray-600'>{process.description}</p>
          </div>
        </div>

        <div className='mt-4 flex flex-wrap items-center gap-2'>
          <div className='flex items-center rounded-full border border-gray-100/50 bg-gray-100 px-2 py-1 text-xs text-gray-700'>
            <ClockIcon className='mr-1 h-3 w-3' />
            {getEstimatedTime(process.steps.length)}
          </div>

          <div className='flex items-center rounded-full border border-gray-100/50 bg-gray-100 px-2 py-1 text-xs text-gray-700'>
            <BookmarkIcon className='mr-1 h-3 w-3' />
            {process.saves?.toLocaleString() || 0}
          </div>

          <div className='flex items-center rounded-full border border-gray-100/50 bg-gray-100 px-2 py-1 text-xs text-gray-700'>
            {process.steps.length} steps
          </div>

          <button onClick={handleViewToggle} className='ml-auto text-xs font-medium text-blue-600 hover:text-blue-800'>
            {showSteps ? 'Hide steps' : 'View steps'}
          </button>
        </div>
      </div>

      {/* Collapsible steps section */}
      {showSteps && (
        <div className='p-4'>
          <div className='mb-3 text-sm font-medium text-gray-700'>Process Steps:</div>
          <div className='mb-3 space-y-3'>
            {process.steps.slice(0, 3).map((step, i) => (
              <div key={i} className='rounded-lg border border-gray-100/80 bg-gray-50 p-3 transition-colors hover:border-blue-100'>
                <div className='text-sm font-medium text-gray-800'>
                  {i + 1}. {step.title}
                </div>
                <div className='mt-1 text-xs text-gray-600'>{step.description}</div>
              </div>
            ))}
            {process.steps.length > 3 && <div className='text-center text-xs text-gray-500'>+{process.steps.length - 3} more steps</div>}
          </div>
        </div>
      )}
    </div>
  );
}
