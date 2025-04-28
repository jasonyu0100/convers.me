import { AppHeader } from '@/app/components/app/AppHeader';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { ProfileAbout } from './components/about/ProfileAbout';
import { useProfile, useProfileHeader } from './hooks';

/**
 * The main profile page component that renders the profile layout
 * Uses the route-specific profile hook for data and actions
 */
export function ProfileView() {
  const headerProps = useProfileHeader();
  const { isLoading, error, clearError } = useProfile();

  // Handle loading state
  if (isLoading) {
    return (
      <>
        <AppHeader title={headerProps.title} />
        <PageLoading />
      </>
    );
  }

  // Handle error state
  if (error) {
    return (
      <>
        <AppHeader title={headerProps.title} />
        <ErrorDisplay error={error} title='Profile Error' onRetry={clearError} />
      </>
    );
  }

  return (
    <>
      <AppHeader
        title={headerProps.title}
        searchPlaceholder={headerProps.searchPlaceholder}
        searchValue={headerProps.searchValue}
        onSearchChange={headerProps.onSearchChange}
        onSearchSubmit={headerProps.onSearchSubmit}
        profileImageUrl={headerProps.profileImageUrl}
      />
      <ProfileAbout />
    </>
  );
}
