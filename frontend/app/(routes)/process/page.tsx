'use client';

import { useEffect, useState } from 'react';
import { AppRoute, RoutePageTemplate } from '@/app/components/router';
import { ProcessProvider, useProcess } from './hooks/useProcess';
import { ProcessView } from './ProcessView';
import { PageLoading } from '@/app/components/ui/loading';

/**
 * Wrapper component that ensures autoselection of directory and process
 */
function ProcessWrapper() {
  const {
    allDirectories,
    processes,
    setSelectedDirectoryId: contextSetSelectedDirectoryId,
    selectedDirectoryId,
    handleProcessesSelect,
    selectedList,
    isLoading,
  } = useProcess();
  const [initializationComplete, setInitializationComplete] = useState(false);

  // Select directory and save to localStorage
  const selectDirectory = (dirId: string | null) => {
    if (typeof window !== 'undefined' && dirId) {
      localStorage.setItem('process_selected_directory', dirId);
    }
    contextSetSelectedDirectoryId(dirId);
  };

  // Select process and save to localStorage
  const selectProcess = (processId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('process_selected_process', processId);
    }
    handleProcessesSelect(processId);
  };

  // Handle initial selection only if nothing is currently selected
  useEffect(() => {
    // Set a timeout to avoid infinite loading state
    const timeoutId = setTimeout(() => {
      setInitializationComplete(true);
    }, 2000);

    // Check if we're coming back from another view (as with back button press)
    // If we already have a directory or process selected, we'll assume we're returning and skip selection
    const hasExistingSelection = selectedDirectoryId !== null || selectedList !== null;

    if (!isLoading && allDirectories.length > 0 && !hasExistingSelection) {
      // We only do auto-selection on first initialization, not on back navigation
      // Check localStorage first
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

    // Once we've loaded directories or made selections, we're done initializing
    if (!isLoading && allDirectories.length > 0) {
      setInitializationComplete(true);
    }

    return () => clearTimeout(timeoutId);
  }, [allDirectories, processes, selectedDirectoryId, selectedList, isLoading]);

  // Brief loading state only when data is available but selections aren't made yet
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
 * Root processes page component for direct URL access
 */
export default function Page() {
  return (
    <ProcessProvider>
      <ProcessWrapper />
    </ProcessProvider>
  );
}
