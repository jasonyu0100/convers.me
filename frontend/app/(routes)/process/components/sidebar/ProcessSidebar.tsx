import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { Divider } from '@/app/components/ui/dividers/Divider';
import { CalendarDaysIcon, FolderPlusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { useProcess } from '../../hooks';
import { ProcessSidebarItem } from './ProcessSidebarItem';
import { CreateDirectoryModal } from '../CreateDirectoryModal';

export function ProcessSidebar() {
  const {
    processes,
    selectedList,
    handleCreateNewList,
    selectedDirectoryId,
    allDirectories,
    setSelectedDirectoryId,
    isCreatingNewDirectory,
    setIsCreatingNewDirectory,
    handleCreateDirectory,
    handleProcessesSelect,
  } = useProcess();
  
  // Use access to process context to get all processes
  const processContext = useProcess();
  const router = useRouter();
  const app = useApp();

  // Get current directory with fallbacks
  const currentDirectory = useMemo(() => {
    // First try to get selected directory
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

  // Auto-selection is now disabled to support back button navigation

  const directoryName = currentDirectory?.name || 'All Processes';
  const directoryColor = currentDirectory?.color || 'bg-gradient-to-r from-blue-500 to-indigo-500';

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

  // Always show the regular directory list in the sidebar
  return (
    <div className='flex w-[360px] flex-shrink-0 flex-col border-r border-slate-200/50 bg-gradient-to-b from-white/95 to-white/90 p-6 backdrop-blur-xl'>
      <div className='mb-6'>
        <div className='mb-3 flex items-center justify-between'>
          <div className='flex items-center gap-1.5'>
            <h3 className='text-xs font-semibold tracking-wider text-slate-600'>Directories</h3>
            {!selectedDirectoryId && (
              <span className='flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-[10px] font-medium text-blue-600' title='Directory Map View Active'>
                M
              </span>
            )}
          </div>
          <button
            className='flex items-center gap-1 text-xs font-medium text-slate-500 transition-all hover:text-blue-600'
            title='Create new directory'
            onClick={openCreateDirectoryModal}
          >
            <FolderPlusIcon className='h-3.5 w-3.5' />
          </button>
        </div>
        <div className='space-y-1.5'>
          {/* Render top-level directories */}
          {allDirectories
            .filter((dir) => !dir.parentId)
            .map((directory) => {
              // Check if this directory has subdirectories
              const hasSubDirs = allDirectories.some((dir) => dir.parentId === directory.id);

              return (
                <div key={directory.id} className='space-y-1'>
                  {/* Parent directory */}
                  <button
                    onClick={() => setSelectedDirectoryId(directory.id)}
                    className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition-all ${
                      selectedDirectoryId === directory.id ? 'bg-blue-50 font-medium text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`mr-2.5 h-3.5 w-3.5 flex-shrink-0 rounded-full ${directory.color || 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}></div>
                    <span className='truncate'>{directory.name}</span>
                    <span
                      className={`ml-auto text-xs ${
                        selectedDirectoryId === directory.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                      } min-w-[20px] rounded-full px-2 py-0.5 text-center`}
                    >
                      {directory.processCount ?? (Array.isArray(directory.processes) ? directory.processes.length : 0)}
                    </span>
                  </button>

                  {/* Subdirectories */}
                  {hasSubDirs && (
                    <div className='ml-4 border-l border-slate-200 pl-2'>
                      {allDirectories
                        .filter((dir) => dir.parentId === directory.id)
                        .map((subDir) => (
                          <button
                            key={subDir.id}
                            onClick={() => setSelectedDirectoryId(subDir.id)}
                            className={`flex w-full items-center rounded-lg px-3 py-1.5 text-sm transition-all ${
                              selectedDirectoryId === subDir.id ? 'bg-blue-50 font-medium text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            <div
                              className={`mr-2 h-2.5 w-2.5 flex-shrink-0 rounded-full ${subDir.color || 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                            ></div>
                            <span className='truncate text-xs'>{subDir.name}</span>
                            <span
                              className={`ml-auto text-xs ${
                                selectedDirectoryId === subDir.id ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                              } min-w-[18px] rounded-full px-1.5 py-0.5 text-center`}
                            >
                              {subDir.processCount ?? (Array.isArray(subDir.processes) ? subDir.processes.length : 0)}
                            </span>
                          </button>
                        ))}
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

      {/* Process list */}
      <div className='flex-1 overflow-y-auto'>
        <div className='mb-3 flex items-center justify-between'>
          <div className='flex items-center'>
            <div className={`h-3.5 w-3.5 flex-shrink-0 rounded-full ${directoryColor} mr-2.5`}></div>
            <h3 className='text-xs font-semibold tracking-wider text-slate-600'>{directoryName}</h3>
          </div>
          <div className='flex items-center gap-2'>
            <button
              className='flex items-center gap-1 text-xs font-medium text-slate-500 transition-all hover:text-blue-600'
              title='Back to Map View'
              onClick={() => setSelectedDirectoryId(null)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <button
              className='flex items-center gap-1 text-xs font-medium text-slate-500 transition-all hover:text-blue-600'
              title='Add new process'
              onClick={handleCreateNewList}
            >
              <PlusIcon className='h-3.5 w-3.5' />
            </button>
          </div>
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
          className='mt-5 flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow focus:ring-2 focus:ring-blue-300'
        >
          <CalendarDaysIcon className='mr-2 h-4 w-4' />
          Schedule New Event
        </button>
      </div>

      {/* Create directory modal */}
      <CreateDirectoryModal
        isOpen={isCreatingNewDirectory}
        onClose={closeCreateDirectoryModal}
        onSuccess={handleDirectoryCreated}
        parentDirectoryId={currentDirectory?.parentId ? currentDirectory.id : undefined}
      />
    </div>
  );
}
