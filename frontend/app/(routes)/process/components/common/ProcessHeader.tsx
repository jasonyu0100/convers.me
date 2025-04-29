'use client';

import { ArrowLeftIcon, DocumentDuplicateIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ProcessHeaderProps {
  directoryName?: string;
  processName?: string;
  isDetailView?: boolean;
  onBack?: () => void;
  onDuplicate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  color?: string;
}

/**
 * Header component for the process section
 * Shows directory and process information with action buttons
 */
export function ProcessHeader({
  directoryName,
  processName,
  isDetailView = false,
  onBack,
  onDuplicate,
  onEdit,
  onDelete,
  color = 'from-blue-500 to-indigo-500',
}: ProcessHeaderProps) {
  return (
    <div className='sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-8 py-4 backdrop-blur-sm'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          {isDetailView && onBack && (
            <button
              onClick={onBack}
              className='mr-2 flex items-center rounded-full bg-white p-1.5 text-slate-500 hover:bg-blue-50 hover:text-blue-600'
              title='Back to Processes'
            >
              <ArrowLeftIcon className='h-4 w-4' />
            </button>
          )}
          {isDetailView ? (
            <>
              <span className='mr-2 text-sm font-medium text-slate-600'>{directoryName || 'Directory'} /</span>
              <span className='text-sm font-medium text-slate-900'>{processName || 'Process'}</span>
            </>
          ) : (
            <span className='text-sm font-medium text-slate-900'>{directoryName || 'Processes'}</span>
          )}
        </div>

        {isDetailView && (
          <div className='flex space-x-2'>
            {onDuplicate && (
              <button onClick={onDuplicate} className='rounded-full p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600' title='Duplicate'>
                <DocumentDuplicateIcon className='h-4.5 w-4.5' />
              </button>
            )}
            {onEdit && (
              <button onClick={onEdit} className='rounded-full p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600' title='Edit'>
                <PencilIcon className='h-4.5 w-4.5' />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className='rounded-full p-2 text-slate-500 hover:bg-red-50 hover:text-red-600' title='Delete'>
                <TrashIcon className='h-4.5 w-4.5' />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
