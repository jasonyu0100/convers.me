import { AppHeader } from '@/app/components/app/AppHeader';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { FeedContentView } from './components/content/FeedContentView';
import { FeedWeeklySchedule } from './components/sidebar';
import { useFeed } from './hooks/useFeed';
import { useFeedHeader } from './hooks/useFeedHeader';

/**
 * Feed body component that displays content and weekly schedule
 */
function FeedBody() {
  const { isLoadingMore, error, clearError } = useFeed();

  // Handle loading state
  if (isLoadingMore) {
    return <PageLoading />;
  }

  // Handle error state
  if (error) {
    return <ErrorDisplay error={error} title='Feed Error' onRetry={clearError} />;
  }

  return (
    <div className='flex h-full w-full flex-row overflow-hidden'>
      <FeedContentView />
      <FeedWeeklySchedule />
    </div>
  );
}

/**
 * Main feed view component with provider
 */
export function FeedView() {
  const headerProps = useFeedHeader();

  return (
    <>
      <AppHeader
        title='Feed'
        searchPlaceholder={headerProps.searchPlaceholder}
        searchValue={headerProps.searchValue}
        onSearchChange={headerProps.onSearchChange}
        onSearchSubmit={headerProps.onSearchSubmit}
      />
      <FeedBody />
    </>
  );
}
