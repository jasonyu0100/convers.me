import { useProfile } from '../../hooks/useProfile';
import { ProfileFeed } from '../activity/ProfileFeed';
import { ProfileEvents } from '../events/ProfileEvents';
import { ProfileReports } from '../reports/ProfileReports';
import { TimelineSelector } from '../timeline/TimelineSelector';
import { ProfileAboutHeader } from './ProfileAboutHeader';
import { ProfileTabs } from './ProfileAboutTabs';

export function ProfileAbout() {
  const { user, activities, viewType } = useProfile();

  // Render the appropriate content based on the current viewType
  const renderTabContent = () => {
    switch (viewType) {
      case 'activity':
        return <ProfileFeed posts={activities} />;
      case 'events':
        return <ProfileEvents />;
      case 'reports':
        return <ProfileReports />;
      default:
        return <ProfileFeed posts={activities} />;
    }
  };

  return (
    <div className='flex h-full w-full flex-row'>
      {/* Main content area */}
      <div className='flex flex-1 flex-col overflow-auto p-12'>
        {/* Profile header */}
        <div className='w-full'>
          <ProfileAboutHeader user={user} />
        </div>

        {/* Navigation tabs */}
        <ProfileTabs />

        {/* Content area */}
        <div className='flex w-full flex-grow flex-col space-y-6 p-6' role='tabpanel' aria-label={`${viewType} content`}>
          {renderTabContent()}
        </div>
      </div>
      {/* GitHub-style sidebar timeline */}
      <TimelineSelector />
    </div>
  );
}
