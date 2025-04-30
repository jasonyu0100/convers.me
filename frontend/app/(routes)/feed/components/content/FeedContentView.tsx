import { EmptyStateDisplay, ErrorDisplay } from '@/app/components/ui/errors';
import { LoadingSpinner } from '@/app/components/ui/loading';
import { useRef } from 'react';
import { useFeed } from '../../hooks';
import { FeedPostItem } from './FeedPostItem';
import { RoomTrackSelector } from './RoomTrackSelector';

export function FeedContentView() {
  const { currentUser, feedPosts, selectedPeriod, selectedRoomId, roomEvents, isLoadingMore, error, handleLoadMorePosts, clearError, setSelectedRoomId } =
    useFeed();
  const containerRef = useRef<HTMLDivElement>(null);

  // Removed auto-scroll functionality

  // Handle error state
  if (error) {
    return <ErrorDisplay error={error} title='Error Loading Feed' onRetry={clearError} />;
  }

  // Format the period date for display
  const formatPeriodTitle = () => {
    if (!selectedPeriod) return '';

    // Check if we have a quarter selection
    if (selectedPeriod.quarter) {
      return `Q${selectedPeriod.quarter} ${selectedPeriod.year}`;
    }

    // Check if we have a week selection
    if (selectedPeriod.week) {
      return `Week ${selectedPeriod.week}, ${selectedPeriod.year}`;
    }

    // Default to just the year
    return `${selectedPeriod.year}`;
  };

  return (
    <div className='flex h-full flex-1 flex-col bg-white'>
      {/* Room Track Selector - Now at the top with arrow navigation */}
      <RoomTrackSelector />

      <div className='flex-1 overflow-auto' ref={containerRef}>
        {!currentUser ? (
          <div className='flex justify-center py-6'>
            <LoadingSpinner size='lg' />
          </div>
        ) : feedPosts.length === 0 ? (
          <EmptyStateDisplay
            title='No posts found'
            description={selectedRoomId ? `No posts available for this room` : 'No posts available in your feed'}
            actionText='Refresh'
            onAction={clearError}
          />
        ) : (
          <div className='flex w-full justify-center p-4'>
            <div className='flex w-full max-w-2xl flex-col space-y-4'>
              {/* Loading indicator */}
              {isLoadingMore && (
                <div className='absolute -bottom-3 left-1/2 -translate-x-1/2 transform'>
                  <div className='h-3 w-3 animate-spin rounded-full border-t-2 border-b-2 border-blue-400'></div>
                </div>
              )}

              {/* Posts are already filtered by the backend based on selectedRoomId */}
              {[...feedPosts].map((post) => (
                <div key={post.id}>
                  <FeedPostItem post={post} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
