'use client';

import { useState, useCallback } from 'react';
import { useProgress } from './useProgress';
import { useRouteComponent } from '@/app/components/router/useRouteComponent';

export function useProgressHeader() {
  const [searchValue, setSearchValue] = useState('');
  const { selectedTimeFrame, weeklyProgress, quarterlyProgress } = useProgress();
  const { setLoading, handleError } = useRouteComponent();

  // Get the title for the header
  const getTitle = useCallback(() => {
    return 'Progress';
  }, []);

  // Handle search input changes with error handling
  const handleSearchChange = useCallback(
    (value: string) => {
      try {
        setSearchValue(value);
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  // Handle search submissions with error handling
  const handleSearchSubmit = useCallback(
    (value: string) => {
      try {
        setLoading(true);
        console.log('Searching for:', value);
        // Search logic would go here
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, handleError],
  );

  return {
    title: getTitle(),
    searchPlaceholder: 'Search progress metrics...',
    searchValue,
    onSearchChange: handleSearchChange,
    onSearchSubmit: handleSearchSubmit,
  };
}
