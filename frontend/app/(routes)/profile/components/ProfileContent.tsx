'use client';

import { useProfile } from '../hooks';
import { ProfileViewType } from '../types';
import { ProfileActivity } from './activity/ProfileActivity';
import { ProfileEvents } from './events/ProfileEvents';
import { ProfileReports } from './reports/ProfileReports';

/**
 * Header component for the profile content view
 */
function ProfileContentHeader({ viewType, dateRange }) {
  // Map view types to display names
  const viewTitles: Record = {
    activity: 'Activity Feed',
    events: 'My Events',
    reports: 'Reports',
  };

  return (
    <div className='sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-8 py-5 backdrop-blur-sm'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center'>
          <span className='text-lg font-medium text-slate-900'>{viewTitles[viewType] || 'Profile'}</span>
        </div>
        {dateRange && (
          <div className='text-sm text-slate-500'>
            <span>
              {dateRange.startDate} to {dateRange.endDate}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main content component for the profile view
 * Displays the appropriate tab content based on the selected view type
 */
export function ProfileContent() {
  const { viewType, dateRange } = useProfile();

  // Render the appropriate content based on the current viewType
  const renderContent = () => {
    switch (viewType) {
      case 'activity':
        return <ProfileActivity />;
      case 'events':
        return <ProfileEvents />;
      case 'reports':
        return <ProfileReports />;
      default:
        return <ProfileActivity />;
    }
  };

  return (
    <div className='flex h-full w-full flex-col overflow-hidden'>
      <ProfileContentHeader viewType={viewType} dateRange={dateRange} />
      <div className='flex-1 overflow-auto'>{renderContent()}</div>
    </div>
  );
}
