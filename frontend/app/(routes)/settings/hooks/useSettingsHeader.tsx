'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

export function useSettingsHeader() {
  const pathname = usePathname();

  const title = useMemo(() => {
    if (pathname === '/settings') return 'Settings';
    if (pathname === '/settings/profile') return 'Profile Settings';
    if (pathname === '/settings/notifications') return 'Notification Settings';
    if (pathname === '/settings/security') return 'Security Settings';
    if (pathname === '/settings/change-password') return 'Change Password';
    return 'Settings';
  }, [pathname]);

  // Settings doesn't need search functionality
  const searchPlaceholder = '';
  const searchValue = '';
  const isSearchVisible = false;
  const onSearchChange = (e: React.ChangeEvent) => {
    // No-op for settings
  };
  const onSearchSubmit = (value: string) => {
    // No-op for settings
  };

  return {
    title,
    pathname,
    searchPlaceholder,
    searchValue,
    isSearchVisible,
    onSearchChange,
    onSearchSubmit,
  };
}
