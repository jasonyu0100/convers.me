'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { Divider } from '@/app/components/ui/dividers/Divider';
import { PencilIcon, CalendarDaysIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useProfile } from '../hooks';
import { TimelineSelector } from './timeline/TimelineSelector';
import { useAuthStore } from '@/app/store/authStore';
import { ProfileUser } from '@/app/types/profile';
import { useMemo } from 'react';

/**
 * Sidebar component for the profile view
 * Shows user info, timeline selector, and action buttons
 */
export function ProfileSidebar() {
  const router = useRouter();
  const app = useApp();
  const { viewType, selectTab } = useProfile();

  // Get user data from auth store instead of the profile hook
  const currentUser = useAuthStore((state) => state.currentUser);

  // Convert from UserProfile (auth store) to ProfileUser type needed for the profile view
  const user = useMemo<ProfileUser>(() => {
    if (!currentUser) {
      return {
        id: '',
        name: '',
        username: '',
        profileImage: undefined,
        biography: '',
        isOnline: false,
        profileUrl: '',
      };
    }

    return {
      id: currentUser.id,
      name: currentUser.name,
      username: currentUser.handle,
      profileImage: currentUser.profileImage,
      biography: currentUser.bio || '',
      isOnline: true,
      profileUrl: `/profile/${currentUser.handle}`,
    };
  }, [currentUser]);

  // Tab options for the profile view
  const tabs = [
    { id: 'activity', label: 'Activity', icon: PencilIcon },
    { id: 'events', label: 'Events', icon: CalendarDaysIcon },
    { id: 'reports', label: 'Reports', icon: UserGroupIcon },
  ];

  return (
    <div className='flex w-[360px] flex-shrink-0 flex-col border-r-1 border-slate-200 bg-white/80 p-6 backdrop-blur-xl'>
      {/* User profile section */}
      <div className='mb-6 flex flex-col items-center'>
        <div className='h-24 w-24 overflow-hidden rounded-full bg-gray-200'>
          {user.profileImage && <img src={user.profileImage} alt={user.name} className='h-full w-full object-cover' />}
        </div>
        <h2 className='mt-3 text-lg font-semibold'>{user.name}</h2>
        <p className='text-sm text-slate-500'>@{user.username}</p>
        {user.biography && <p className='mt-2 text-center text-sm text-slate-600'>{user.biography}</p>}
      </div>

      <Divider className='mb-5 opacity-50' />

      {/* Profile view tabs */}
      <div className='mb-6'>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => selectTab(tab.id)}
            className={`mb-1 flex w-full items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
              viewType === tab.id ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
            }`}
          >
            <tab.icon className='mr-2 h-4 w-4' />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline controls */}
      <div className='mt-2 flex-1 overflow-y-auto'>
        <TimelineSelector />
      </div>

      {/* Action buttons */}
      <div className='mt-6'>
        <Divider className='mb-5 opacity-50' />
        <button
          onClick={() => {
            app.setMainView(AppRoute.SCHEDULE);
            router.push('/schedule');
          }}
          className='flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow'
        >
          <CalendarDaysIcon className='mr-2 h-4 w-4' />
          Schedule Event
        </button>
      </div>
    </div>
  );
}
