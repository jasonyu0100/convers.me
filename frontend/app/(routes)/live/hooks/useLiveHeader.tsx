'use client';

import { useAppHeader } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { useRouteComponent } from '@/app/components/router/useRouteComponent';
import { useCallback, useMemo, useState } from 'react';
import { useLive } from './useLive';

/**
 * Custom hook for Live header with specialized search functionality
 */
export function useLiveHeader() {
  const baseHeader = useAppHeader(AppRoute.LIVE);
  const live = useLive();
  const { setLoading, handleError } = useRouteComponent();
  const [searchTerm, setSearchTerm] = useState('');

  // Dynamically set title based on recording state with error handling
  const title = useMemo(() => {
    try {
      if (live.isRecording) {
        return `Live Room • Recording (${live.elapsedTime})`;
      }
      return 'Live Room';
    } catch (error) {
      handleError(error);
      return 'Live Room';
    }
  }, [live.isRecording, live.elapsedTime, handleError]);

  // Live transcript search functionality with error handling
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
        console.log('Searching conversation transcript for:', value);
        // This could highlight matching entries in the transcript
        // or scroll to the first matching entry
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
    searchPlaceholder: 'Search in this conversation...',
    onSearchChange: handleSearchChange,
    onSearchSubmit: handleSearchSubmit,
  };
}
