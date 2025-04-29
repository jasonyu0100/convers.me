'use client';

import { useEffect, useState } from 'react';
import { AppRoute, RoutePageTemplate } from '@/app/components/router';
import { ProcessProvider, useProcess } from './hooks/useProcess';
import { ProcessView } from './ProcessView';
import { PageLoading } from '@/app/components/ui/loading';

/**
 * ProcessPage wrapper that handles initialization and selection persistence
 * Ensures directories and processes are selected properly on navigation and first load
 */
function ProcessPage() {
  const { allDirectories, processes, setSelectedDirectoryId, selectedDirectoryId, handleProcessesSelect, selectedList, isLoading } = useProcess();
  const [initializationComplete, setInitializationComplete] = useState(false);

  // Select directory and persist to localStorage
  const selectDirectory = (dirId: string | null) => {
    if (typeof window !== 'undefined' && dirId) {
      localStorage.setItem('process_selected_directory', dirId);
    }
    setSelectedDirectoryId(dirId);
  };

  // Select process and persist to localStorage
  const selectProcess = (processId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('process_selected_process', processId);
    }
    handleProcessesSelect(processId);
  };

  // Handle initial selections
  useEffect(() => {
    // Set a timeout to avoid infinite loading state
    const timeoutId = setTimeout(() => {
      setInitializationComplete(true);
    }, 2000);

    // Check if we already have a selection (coming back from another view)
    const hasExistingSelection = selectedDirectoryId !== null || selectedList !== null;

    if (!isLoading && allDirectories.length > 0 && !hasExistingSelection) {
      // Restore saved selections if available
      const savedDir = localStorage.getItem('process_selected_directory');
      const savedProcess = localStorage.getItem('process_selected_process');

      // If we have valid saved selections, restore them
      if (savedDir && allDirectories.some((dir) => dir.id === savedDir)) {
        selectDirectory(savedDir);
      }

      if (savedProcess && processes.some((p) => p.id === savedProcess)) {
        selectProcess(savedProcess);
      }
    }

    // Once we've loaded directories, we're done initializing
    if (!isLoading && allDirectories.length > 0) {
      setInitializationComplete(true);
    }

    return () => clearTimeout(timeoutId);
  }, [allDirectories, processes, selectedDirectoryId, selectedList, isLoading]);

  // Brief loading state when data is available but selections aren't made yet
  if (!initializationComplete && !isLoading && allDirectories.length > 0) {
    return (
      <div className='flex h-full w-full flex-col'>
        <div className='flex flex-1 items-center justify-center'>
          <PageLoading message='Initializing view...' />
        </div>
      </div>
    );
  }

  return <RoutePageTemplate routeType={AppRoute.PROCESS} Component={ProcessView} />;
}

/**
 * Root processes page component
 * Sets up the provider and context for process management
 */
export default function Page() {
  return (
    <ProcessProvider>
      <ProcessPage />
    </ProcessProvider>
  );
}
