'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { AppRoute } from '../../router';
import { useApp } from './useApp';

export interface AppHeaderState {
  title?: string;
  searchPlaceholder: string;
  searchValue: string;
  isSearchVisible: boolean;
  onSearchChange: (e: React.ChangeEvent) => void;
  onSearchSubmit: (value: string) => void;
}

export function useAppHeader(route: AppRoute) {
  const app = useApp();
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');

  // Determine the current route context
  const currentRoute = route || app.mainView;

  // Default search placeholder
  let searchPlaceholder = 'Search...';
  let isSearchVisible = true;

  // Set route-specific search placeholders
  switch (currentRoute) {
    case AppRoute.FEED:
      searchPlaceholder = 'Search conversations and people...';
      break;
    case AppRoute.LIBRARY:
      searchPlaceholder = 'Search your library...';
      break;
    case AppRoute.PROFILE:
      searchPlaceholder = 'Search your activities...';
      break;
    case AppRoute.LIVE:
      searchPlaceholder = 'Search this conversation...';
      break;
    case AppRoute.ROOM:
      searchPlaceholder = 'Search topics and participants...';
      break;
    case AppRoute.CALENDAR:
      searchPlaceholder = 'Search your events...';
      break;
    case AppRoute.SCHEDULE:
      searchPlaceholder = 'Search available times...';
      break;
    case AppRoute.SUMMARY:
      // Hide search for playback routes
      isSearchVisible = false;
      break;
    case AppRoute.INSIGHT:
      searchPlaceholder = 'Search cycles content...';
      break;
    case AppRoute.LIBRARY:
      searchPlaceholder = 'Search library collections...';
      break;
    default:
      searchPlaceholder = 'Search...';
  }

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent) => {
    setSearchValue(e.target.value);
  }, []);

  // Handle search submit - route-specific implementation
  const handleSearchSubmit = useCallback(
    (value: string) => {
      console.log(`Searching in ${currentRoute} for: ${value}`);

      // Route-specific search behavior could be implemented here
      switch (currentRoute) {
        case AppRoute.FEED:
          // Search conversations and people
          break;
        case AppRoute.LIBRARY:
          // Search library content
          break;
        case AppRoute.PROFILE:
          // Search activities
          break;
        // Add other route-specific search implementations
        default:
          // Generic search behavior
          break;
      }
    },
    [currentRoute],
  );

  // Handle profile click
  const handleProfileClick = useCallback(() => {
    app.setMainView(AppRoute.PROFILE);
    router.push('/profile');
  }, [app, router]);

  // Handle settings click
  const handleSettingsClick = useCallback(() => {
    app.setMainView(AppRoute.SETTINGS);
    router.push('/settings');
  }, [app, router]);

  // Handle booking link click - redirect to book route
  const handleBookingClick = useCallback(() => {
    app.setMainView(AppRoute.SCHEDULE);
    router.push('/schedule');
  }, [app, router]);

  return {
    title: undefined, // Default to no title, can be overridden by component
    searchPlaceholder,
    searchValue,
    isSearchVisible,
    onSearchChange: handleSearchChange,
    onSearchSubmit: handleSearchSubmit,
    handleProfileClick,
    handleSettingsClick,
    handleBookingClick,
  };
}
