'use client';

import { useApp } from '@/app/components/app/hooks/useApp';
import { useAppHeader } from '@/app/components/app/hooks/useAppHeader';
import { UserAvatar } from '@/app/components/ui/avatars/UserAvatar';
import { BookingLink } from '@/app/components/ui/booking/BookingLink';
import { ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { NotificationBell } from '../ui/notifications';
import { SearchBar } from '../ui/search';
import { AppHeaderProps } from './types';

/**
 * Application header component that adapts to the current route context
 */
export function AppHeader({ route, title, searchPlaceholder, searchValue, isSearchVisible, onSearchChange, onSearchSubmit, profileImageUrl }: AppHeaderProps) {
  // Get header state from the hook, allowing props to override defaults
  const header = useAppHeader(route);
  const app = useApp();

  // State to handle user loading
  const [isUserLoading, setIsUserLoading] = useState(false);

  // Props override hook values when provided
  const finalSearchPlaceholder = searchPlaceholder || header.searchPlaceholder;
  const finalSearchValue = searchValue !== undefined ? searchValue : header.searchValue;
  const finalSearchVisible = isSearchVisible !== undefined ? isSearchVisible : header.isSearchVisible;
  const finalSearchChange = onSearchChange || header.onSearchChange;
  const finalSearchSubmit = onSearchSubmit || header.onSearchSubmit;

  // Fetch user data if not available
  useEffect(() => {
    const fetchUserData = async () => {
      if (!app.currentUser && app.isAuthenticated && !isUserLoading) {
        try {
          setIsUserLoading(true);
          await app.refreshUserProfile();
        } catch (error) {
          console.error('Error fetching user data:', error);
        } finally {
          setIsUserLoading(false);
        }
      }
    };

    fetchUserData();
  }, [app.isAuthenticated, app.currentUser, app.refreshUserProfile, isUserLoading]);

  // Get user information from context
  const userName = app.currentUser?.name || 'Guest User';
  const userImage = profileImageUrl || app.currentUser?.profileImage; // Allow profile image override for specific routes
  const userStatus = app.isAuthenticated ? 'online' : 'offline';

  return (
    <div className='flex h-16 w-full flex-shrink-0 items-center justify-between border-b border-slate-200 bg-white/80 px-6'>
      <div className='flex w-1/3 items-center justify-start'>
        {title ? <h1 className='text-lg font-semibold'>{title}</h1> : <BookingLink onClick={header.handleBookingClick} />}
      </div>
      <div className='flex w-1/3 items-center justify-center'>
        {finalSearchVisible && (
          <div className='absolute left-1/2 w-1/3 -translate-x-1/2'>
            <SearchBar onSearch={finalSearchSubmit} placeholder={finalSearchPlaceholder} value={finalSearchValue} onChange={finalSearchChange} />
          </div>
        )}
      </div>
      <div className='flex w-1/3 items-center justify-end space-x-4'>
        <NotificationBell />
        <button
          className='rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700'
          onClick={header.handleSettingsClick}
          aria-label='Settings'
        >
          <Cog6ToothIcon className='h-6 w-6' />
        </button>
        <button
          className='rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700'
          onClick={header.handleInsightsClick}
          aria-label='Insights'
        >
          <ChartBarIcon className='h-6 w-6' />
        </button>
        <UserAvatar
          user={{
            id: app.currentUser?.id || 'guest',
            name: userName,
            profileImage: userImage,
          }}
          size='md'
          onClick={header.handleProfileClick}
          className='cursor-pointer border-slate-200 hover:border-blue-300 hover:shadow-sm'
          showStatus={true}
          status={userStatus}
        />
      </div>
    </div>
  );
}
