'use client';

import { DirectorySchema, ProcessSchema } from '@/app/types/schema';
import { FolderIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useMemo } from 'react';

// Process card component for the grid view
const ProcessCard = ({ process, onClick }: { process: ProcessSchema; onClick: () => void }) => {
  const isTemplate = process.isTemplate === true;

  // Calculate progress for process
  const calculateCompletion = () => {
    if (!process.steps || process.steps.length === 0) return 0;

    let totalItems = process.steps.length;
    let completedItems = process.steps.filter((step) => step.completed).length;

    // Count substeps
    process.steps.forEach((step) => {
      if (step.subSteps && step.subSteps.length > 0) {
        totalItems += step.subSteps.length;
        completedItems += step.subSteps.filter((subStep) => subStep.completed).length;
      }
    });

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const progress = calculateCompletion();
  const cardColor = process.color || 'from-blue-500 to-indigo-500';

  return (
    <div
      className={`relative cursor-pointer rounded-lg border bg-white shadow-sm transition-all hover:border-blue-300 hover:shadow-md ${
        isTemplate ? 'border-blue-200' : 'border-slate-200'
      } flex aspect-[4/3] flex-col`}
      onClick={onClick}
    >
      {/* Top colored bar */}
      <div className={`h-1.5 w-full rounded-t-lg bg-gradient-to-r ${cardColor}`}></div>

      {/* Card content with padding */}
      <div className='flex flex-1 flex-col p-4'>
        {/* Card header */}
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='truncate font-medium text-slate-800'>{process.title}</h3>
          {isTemplate && <span className='ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800'>Template</span>}
        </div>

        {/* Description - grows to fill available space */}
        {process.description ? (
          <p className='mb-auto line-clamp-2 text-sm text-slate-500' title={process.description}>
            {process.description}
          </p>
        ) : (
          <div className='mb-auto'></div> /* Spacer if no description */
        )}

        {/* Progress section - stays at bottom */}
        {process.steps && process.steps.length > 0 && (
          <div className='mt-2'>
            <div className='flex items-center justify-between text-xs'>
              <span className='text-gray-500'>Progress</span>
              <span className='font-medium'>{progress}%</span>
            </div>
            <div className='mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100'>
              <div className='h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all' style={{ width: `${progress}%` }}></div>
            </div>
            <div className='mt-1 text-xs text-slate-500'>
              {process.steps.length} {process.steps.length === 1 ? 'step' : 'steps'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ProcessGridViewProps {
  directories: DirectorySchema[];
  processes: ProcessSchema[];
  onSelectDirectory: (id: string) => void;
  onSelectProcess: (id: string) => void;
  onCreateProcess?: () => void;
  selectedDirectoryId?: string;
}

export function ProcessGridView({ directories, processes, onSelectDirectory, onSelectProcess, onCreateProcess, selectedDirectoryId }: ProcessGridViewProps) {
  // Get the selected directory
  const selectedDirectory = useMemo(() => directories.find((dir) => dir.id === selectedDirectoryId), [directories, selectedDirectoryId]);

  // Filter processes based on the selected directory
  const filteredProcesses = useMemo(() => {
    if (!selectedDirectoryId) return [];
    return processes.filter((process) => process.directoryId === selectedDirectoryId);
  }, [processes, selectedDirectoryId]);

  // If no directory is selected, show all directories
  if (!selectedDirectoryId) {
    return (
      <div className='flex h-full w-full flex-col p-6'>
        <h2 className='mb-6 text-2xl font-bold text-slate-800'>Process Directories</h2>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {directories.map((directory) => {
            // Count processes in this directory
            const directoryProcesses = processes.filter((p) => p.directoryId === directory.id);
            const templateCount = directoryProcesses.filter((p) => p.isTemplate).length;
            const directoryColor = directory.color || 'from-blue-500 to-indigo-500';

            return (
              <div
                key={directory.id}
                className='relative flex aspect-[3/2] cursor-pointer flex-col rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md'
                onClick={() => onSelectDirectory(directory.id)}
              >
                {/* Top colored bar */}
                <div className={`h-1.5 w-full rounded-t-xl bg-gradient-to-r ${directoryColor}`}></div>

                {/* Content */}
                <div className='flex flex-1 flex-col p-5'>
                  <h3 className='mb-2 text-lg font-semibold text-slate-800'>{directory.name}</h3>

                  {directory.description ? (
                    <p className='mb-auto line-clamp-3 text-sm text-slate-600'>{directory.description}</p>
                  ) : (
                    <div className='mb-auto'></div>
                  )}

                  <div className='mt-2 flex items-center justify-between text-sm text-slate-500'>
                    <div className='flex items-center'>
                      <FolderIcon className='mr-1.5 h-4 w-4 text-slate-400' />
                      <span>
                        {directoryProcesses.length} {directoryProcesses.length === 1 ? 'process' : 'processes'}
                      </span>
                    </div>
                    {templateCount > 0 && (
                      <span className='rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700'>
                        {templateCount} {templateCount === 1 ? 'template' : 'templates'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add directory button */}
          <div
            className='flex aspect-[3/2] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/50 hover:bg-slate-50'
            onClick={() => {
              /* Add directory creation logic here */
            }}
          >
            <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100'>
              <PlusIcon className='h-6 w-6 text-slate-400' />
            </div>
            <p className='text-sm font-medium text-slate-500'>Create New Directory</p>
          </div>
        </div>
      </div>
    );
  }

  // If a directory is selected, show its details and processes
  return (
    <div className='flex h-full w-full flex-col p-6'>
      {/* Directory summary */}
      <div className='mb-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm'>
        <div className='mb-4 border-b border-slate-100 pb-4'>
          <h1 className='mb-1 text-2xl font-bold text-slate-800'>{selectedDirectory?.name}</h1>
          {selectedDirectory?.description && <p className='text-slate-600'>{selectedDirectory.description}</p>}
        </div>

        <div className='flex items-center text-sm text-slate-500'>
          <span>
            {filteredProcesses.length} {filteredProcesses.length === 1 ? 'process' : 'processes'}
          </span>
          <span className='mx-2'>•</span>
          <span>{filteredProcesses.filter((p) => p.isTemplate).length} templates</span>
        </div>
      </div>

      {/* Processes grid */}
      <div className='mb-6 flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-slate-800'>Processes</h2>
        <button
          onClick={() => onCreateProcess && onCreateProcess()}
          className='flex items-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm text-white hover:shadow-md'
        >
          <PlusIcon className='mr-1.5 h-4 w-4' />
          New Process
        </button>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {filteredProcesses.map((process) => (
          <ProcessCard key={process.id} process={process} onClick={() => onSelectProcess(process.id)} />
        ))}

        {/* Add process button */}
        <div
          className='flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/50 hover:bg-slate-50'
          onClick={() => onCreateProcess && onCreateProcess()}
        >
          <div className='mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100'>
            <PlusIcon className='h-6 w-6 text-slate-400' />
          </div>
          <p className='text-sm font-medium text-slate-500'>Create New Process</p>
        </div>
      </div>
    </div>
  );
}
