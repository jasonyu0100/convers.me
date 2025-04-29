'use client';

import { useAppHeader } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { useRouteComponent } from '@/app/components/router/useRouteComponent';
import { useCallback, useState, useMemo } from 'react';
import { useProcess } from './useProcess';

/**
 * Custom hook for managing Process header configuration
 * Provides title, search functionality, and other header properties
 */
export function useProcessHeader() {
  // Get base header properties from the app header hook
  const baseHeader = useAppHeader(AppRoute.PROCESS);
  const { setLoading, handleError } = useRouteComponent();
  const [searchTerm, setSearchTerm] = useState('');

  // Get process context to access selected directory for dynamic title
  const { selectedDirectoryId, selectedList, allDirectories } = useProcess();

  // Dynamic title based on current view
  const title = useMemo(() => {
    if (selectedList) {
      return selectedList.title || 'Process';
    }

    if (selectedDirectoryId) {
      const directory = allDirectories.find((dir) => dir.id === selectedDirectoryId);
      return directory ? `${directory.name}` : 'Directory';
    }

    return 'Process Manager';
  }, [selectedDirectoryId, selectedList, allDirectories]);

  // Process-specific search functionality
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

  // Process search submit handler
  const handleSearchSubmit = useCallback(
    (value: string) => {
      try {
        if (!value.trim()) return;

        setLoading(true);
        console.log('Searching processes for:', value);
        // Process-specific search logic would be implemented here
        // For now, this is a placeholder for future functionality
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, handleError],
  );

  return {
    ...baseHeader,
    title,
    searchValue: searchTerm,
    searchPlaceholder: 'Search processes, tasks, or people...',
    onSearchChange: handleSearchChange,
    onSearchSubmit: handleSearchSubmit,
  };
}
