import { AppHeader } from '@/app/components/app/AppHeader';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { ProfileSidebar, ProfileContent } from './components';
import { useProfile } from './hooks';
import { useProfileHeader } from './hooks/useProfileHeader';

/**
 * The main profile page component that renders the profile layout
 * Uses the route-specific profile hook for data and actions
 */
export function ProfileView() {
  // Get header configuration from the profile header hook
  const headerProps = useProfileHeader();
  const { isLoading, error, clearError } = useProfile();

  // Handle loading state
  if (isLoading) {
    return (
      <div className='flex h-full w-full flex-col'>
        <AppHeader title={headerProps.title} />
        <div className='flex flex-1 items-center justify-center bg-gradient-to-br from-white to-slate-50/80'>
          <PageLoading />
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className='flex h-full w-full flex-col'>
        <AppHeader title={headerProps.title} />
        <div className='flex flex-1 items-center justify-center bg-gradient-to-br from-white to-slate-50/80'>
          <ErrorDisplay error={error} title='Profile Error' onRetry={clearError} />
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full w-full flex-col'>
      {/* Header section */}
      <AppHeader
        title={headerProps.title}
        searchPlaceholder={headerProps.searchPlaceholder}
        searchValue={headerProps.searchValue}
        onSearchChange={headerProps.onSearchChange}
        onSearchSubmit={headerProps.onSearchSubmit}
        profileImageUrl={headerProps.profileImageUrl}
      />

      {/* Main content area with sidebar and profile content */}
      <div className='flex flex-1 overflow-hidden'>
        <ProfileSidebar />
        <ProfileContent />
      </div>
    </div>
  );
}
