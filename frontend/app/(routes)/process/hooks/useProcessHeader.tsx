'use client';

import { useAppHeader } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { useRouteComponent } from '@/app/components/router/useRouteComponent';
import { useCallback, useState, useMemo } from 'react';
import { useProcess } from './useProcess';

/**
 * Custom hook for Processes header with specialized search functionality
 */
export function useProcessHeader() {
  const baseHeader = useAppHeader(AppRoute.PROCESS);
  const { setLoading, handleError } = useRouteComponent();
  const [searchTerm, setSearchTerm] = useState('');

  // Processes-specific search functionality with error handling
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent) => {
      try {
        setSearchTerm(e.target.value);
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  const handleSearchSubmit = useCallback(
    (value: string) => {
      try {
        if (!value.trim()) return;

        setLoading(true);
        console.log('Searching processes for:', value);
        // Implement processes-specific search logic here
        // This could search across processes titles, tasks, descriptions, etc.
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, handleError],
  );

  // Get process context to access selected directory
  const { selectedDirectoryId, selectedList, allDirectories } = useProcess();
  
  // Get dynamic title based on the current view
  const title = useMemo(() => {
    if (selectedList) {
      return selectedList.title || 'Process';
    }
    
    if (selectedDirectoryId) {
      const directory = allDirectories.find(dir => dir.id === selectedDirectoryId);
      return directory ? `${directory.name}` : 'Directory';
    }
    
    return 'Directory Map';
  }, [selectedDirectoryId, selectedList, allDirectories]);

  return {
    ...baseHeader,
    title,
    searchValue: searchTerm,
    searchPlaceholder: 'Search processes, tasks, or people...',
    onSearchChange: handleSearchChange,
    onSearchSubmit: handleSearchSubmit,
  };
}
