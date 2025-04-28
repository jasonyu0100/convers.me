'use client';

import { AppRoute } from '@/app/components/router';
import { useAppHeader } from '@/app/components/app/hooks';
import { useRouteComponent } from '@/app/components/router/useRouteComponent';
import { useCallback } from 'react';
import { useSchedule } from './useSchedule';

/**
 * Custom hook for Schedule header with specialized functionality
 */
export function useScheduleHeader() {
  const baseHeader = useAppHeader(AppRoute.SCHEDULE);
  const { setLoading, handleError } = useRouteComponent();
  const { searchQuery, setSearchQuery } = useSchedule();

  // Schedule-specific search functionality with error handling
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent) => {
      try {
        setSearchQuery(e.target.value);
        // Schedule-specific search logic could go here
      } catch (error) {
        handleError(error);
      }
    },
    [handleError, setSearchQuery],
  );

  const handleSearchSubmit = useCallback(
    (value: string) => {
      try {
        if (!value.trim()) return;

        setLoading(true);
        console.log('Searching schedule data for:', value);
        // Implement schedule-specific search logic here
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
    title: 'Schedule',
  };
}
