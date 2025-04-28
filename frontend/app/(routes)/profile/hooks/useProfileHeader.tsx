'use client';

import { useAppHeader } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { useRouteComponent } from '@/app/components/router/useRouteComponent';
import { useCallback, useState } from 'react';
import { useProfile } from './useProfile';

/**
 * Custom hook for Profile header with specialized search functionality
 */
export function useProfileHeader() {
  const baseHeader = useAppHeader(AppRoute.PROFILE);
  const profile = useProfile();
  const { setLoading, handleError } = useRouteComponent();
  const [searchTerm, setSearchTerm] = useState('');

  // Profile-specific search functionality with error handling
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
        console.log('Searching profile activities for:', value);
        // Implement profile-specific search logic here
        // This could filter user's activities, conversations, etc.
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
    title: profile.user?.name || 'Profile',
    searchValue: searchTerm,
    searchPlaceholder: 'Search your activities and conversations...',
    onSearchChange: handleSearchChange,
    onSearchSubmit: handleSearchSubmit,
    profileImageUrl: profile.user?.profileImage,
  };
}
