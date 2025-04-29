'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { Divider } from '@/app/components/ui/dividers/Divider';
import { ArrowLeftIcon, CalendarDaysIcon, FolderIcon, FolderPlusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { useProcess } from '../../hooks';
import { CreateDirectoryModal } from '../CreateDirectoryModal';
import { ProcessSidebarItem } from './ProcessSidebarItem';

export function ProcessSidebar() {
  const {
    processes,
    selectedList,
    handleCreateNewList,
    selectedDirectoryId,
    allDirectories,
    allProcesses,
    setSelectedDirectoryId,
    isCreatingNewDirectory,
    setIsCreatingNewDirectory,
    handleCreateDirectory,
    handleProcessesSelect,
  } = useProcess();

  const router = useRouter();
  const app = useApp();

  // Get current directory with fallbacks
  const currentDirectory = useMemo(() => {
    if (selectedDirectoryId) {
      const selected = allDirectories?.find((dir) => dir.id === selectedDirectoryId);
      if (selected) return selected;
    }

    // If no selection or selection not found, find first directory with processes
    if (allDirectories && allDirectories.length > 0) {
      const dirWithProcesses = allDirectories.find((dir) => dir.processes && Array.isArray(dir.processes) && dir.processes.length > 0);
      if (dirWithProcesses) return dirWithProcesses;

      // Last resort: return first directory
      return allDirectories[0];
    }

    return null;
  }, [selectedDirectoryId, allDirectories]);

  const directoryName = currentDirectory?.name || 'All Processes';
  const directoryColor = currentDirectory?.color || 'from-blue-500 to-indigo-500';

  // Open directory creation modal
  const openCreateDirectoryModal = () => {
    setIsCreatingNewDirectory(true);
  };

  // Close directory creation modal
  const closeCreateDirectoryModal = () => {
    setIsCreatingNewDirectory(false);
  };

  // Handle successful directory creation
  const handleDirectoryCreated = (directoryId: string) => {
    // Selection will be handled by the context's onSuccess callback
  };

  // Handle back to directories
  const handleBackToDirectories = () => {
    setSelectedDirectoryId(null);
  };

  // Render directory cards in a consistent style with the grid view
  const renderDirectoryItem = (directory, isSubdirectory = false) => {
    const hasProcesses = directory.processes && Array.isArray(directory.processes) && directory.processes.length > 0;
    const isSelected = selectedDirectoryId === directory.id;
    const dirColor = directory.color || 'from-blue-500 to-indigo-500';
    const processCount = directory.processCount ?? (Array.isArray(directory.processes) ? directory.processes.length : 0);

    return (
      <button
        key={directory.id}
        onClick={() => setSelectedDirectoryId(directory.id)}
        className={`relative mb-2 flex w-full flex-col rounded-lg border text-left ${
          isSelected ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'
        } overflow-hidden transition-all`}
      >
        {/* Colored top bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${dirColor}`}></div>

        <div className='p-3'>
          <div className='flex items-center'>
            {isSubdirectory && <div className='mr-2 h-4 w-4 rounded-tl border-t-2 border-l-2 border-slate-200'></div>}
            <h4 className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-slate-700'} truncate`}>{directory.name}</h4>
          </div>

          {!isSubdirectory && directory.description && <p className='mt-1 line-clamp-1 text-xs text-slate-500'>{directory.description}</p>}

          <div className={`mt-2 flex items-center text-xs ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
            <FolderIcon className='mr-1 h-3 w-3' />
            <span>
              {processCount} {processCount === 1 ? 'process' : 'processes'}
            </span>
          </div>
        </div>
      </button>
    );
  };

  // Conditionally show either directories or processes depending on selectedDirectoryId
  if (!selectedDirectoryId) {
    // Show directories list when no directory is selected
    return (
      <div className='flex w-[360px] flex-shrink-0 flex-col border-r border-slate-200/50 bg-gradient-to-b from-white/95 to-white/90 p-5 backdrop-blur-xl'>
        <div className='mb-5'>
          <div className='mb-4 flex items-center justify-between'>
            <h3 className='text-lg font-semibold text-slate-800'>Directories</h3>
            <button
              className='flex items-center rounded-full bg-blue-50 p-1.5 text-blue-600 transition-all hover:bg-blue-100'
              title='Create new directory'
              onClick={openCreateDirectoryModal}
            >
              <FolderPlusIcon className='h-4 w-4' />
            </button>
          </div>

          <div className='space-y-1'>
            {/* Render top-level directories */}
            {allDirectories
              .filter((dir) => !dir.parentId)
              .map((directory) => {
                // Check if this directory has subdirectories
                const hasSubDirs = allDirectories.some((dir) => dir.parentId === directory.id);

                return (
                  <div key={directory.id}>
                    {/* Parent directory */}
                    {renderDirectoryItem(directory)}

                    {/* Subdirectories */}
                    {hasSubDirs && (
                      <div className='ml-4'>
                        {allDirectories.filter((dir) => dir.parentId === directory.id).map((subDir) => renderDirectoryItem(subDir, true))}
                      </div>
                    )}
                  </div>
                );
              })}

            {allDirectories.length === 0 && (
              <div className='my-4 rounded-xl bg-slate-50 p-4 text-center'>
                <div className='mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50'>
                  <FolderPlusIcon className='h-6 w-6 text-blue-400' />
                </div>
                <p className='text-sm font-medium text-slate-600'>No directories yet</p>
                <p className='mt-1 mb-3 text-xs text-slate-500'>Create directories to organize your processes</p>
                <button
                  className='rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow'
                  onClick={openCreateDirectoryModal}
                >
                  Create directory
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className='mt-auto pt-6'>
          <Divider className='opacity-50' />
          <button
            onClick={() => {
              app.setMainView(AppRoute.SCHEDULE);
              router.push('/schedule');
            }}
            className='mt-5 flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow'
          >
            <CalendarDaysIcon className='mr-2 h-4 w-4' />
            Schedule Event
          </button>
        </div>

        {/* Create directory modal */}
        <CreateDirectoryModal
          isOpen={isCreatingNewDirectory}
          onClose={closeCreateDirectoryModal}
          onSuccess={handleDirectoryCreated}
          parentDirectoryId={undefined}
        />
      </div>
    );
  } else {
    // Show processes list when a directory is selected
    return (
      <div className='flex w-[360px] flex-shrink-0 flex-col border-r border-slate-200/50 bg-gradient-to-b from-white/95 to-white/90 p-5 backdrop-blur-xl'>
        <div className='flex-1 overflow-y-auto'>
          {/* Directory header with back button */}
          <div className='mb-4'>
            <button onClick={handleBackToDirectories} className='mb-4 flex items-center text-sm font-medium text-slate-600 hover:text-blue-600'>
              <ArrowLeftIcon className='mr-1.5 h-3.5 w-3.5' />
              Back to Directories
            </button>

            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${directoryColor} mr-2`}></div>
                <h3 className='truncate text-lg font-semibold text-slate-800'>{directoryName}</h3>
              </div>
              <button
                className='flex items-center rounded-full bg-blue-50 p-1.5 text-blue-600 transition-all hover:bg-blue-100'
                title='Add new process'
                onClick={handleCreateNewList}
              >
                <PlusIcon className='h-4 w-4' />
              </button>
            </div>

            {currentDirectory?.description && <p className='mt-1 mb-3 text-sm text-slate-500'>{currentDirectory.description}</p>}

            <Divider className='mb-4' />
          </div>

          <div className='space-y-2'>
            {processes.map((list) => (
              <ProcessSidebarItem key={list.id} list={list} isSelected={selectedList?.id === list.id} />
            ))}

            {processes.length === 0 && (
              <div className='flex flex-col items-center justify-center py-6 text-center'>
                <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    width='24'
                    height='24'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='1.5'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    className='h-6 w-6 text-blue-400'
                  >
                    <path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2' />
                    <path d='M15 2H9a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1z' />
                  </svg>
                </div>
                <p className='text-sm font-medium text-slate-600'>No processes yet</p>
                <p className='mt-1 mb-3 max-w-[220px] text-xs text-slate-500'>Create your first process to get started</p>
                <button
                  className='rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow'
                  onClick={handleCreateNewList}
                >
                  Create process
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className='mt-auto pt-6'>
          <Divider className='opacity-50' />
          <button
            onClick={() => {
              app.setMainView(AppRoute.SCHEDULE);
              router.push('/schedule');
            }}
            className='mt-5 flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow'
          >
            <CalendarDaysIcon className='mr-2 h-4 w-4' />
            Schedule Event
          </button>
        </div>
      </div>
    );
  }
}
