'use client';

import { useAppHeader } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { useRouteComponent } from '@/app/components/router/useRouteComponent';
import { useCallback, useState } from 'react';

/**
 * Custom hook for Feed header with specialized search functionality
 */
export function useFeedHeader() {
  const baseHeader = useAppHeader(AppRoute.FEED);
  const { setLoading, handleError } = useRouteComponent();
  const [searchTerm, setSearchTerm] = useState('');

  // Feed-specific search functionality with error handling
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
        console.log('Searching feed for:', value);
        // Implement feed-specific search logic here
        // This could search across posts, trending topics, users, etc.
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
    searchValue: searchTerm,
    searchPlaceholder: 'Search people, topics, and conversations...',
    onSearchChange: handleSearchChange,
    onSearchSubmit: handleSearchSubmit,
  };
}
