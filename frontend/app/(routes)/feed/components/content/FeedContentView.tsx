import { Button } from '@/app/components/ui/buttons/Button';
import { EmptyStateDisplay, ErrorDisplay } from '@/app/components/ui/errors';
import { LoadingSpinner } from '@/app/components/ui/loading';
import { useEffect, useRef } from 'react';
import { useFeed } from '../../hooks';
import { FeedCreatePostBox } from './FeedCreatePost';
import { FeedPostItem } from './FeedPostItem';

export function FeedContentView() {
  const { currentUser, feedPosts, selectedPeriod, isLoadingMore, error, handleCreatePost, handleMediaUpload, handleLoadMorePosts, clearError } = useFeed();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when feed posts change
  useEffect(() => {
    if (containerRef.current && feedPosts.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [feedPosts]);

  const handleCreatePostFocus = () => {
    try {
      console.log('Create post focused');
      // In a real app, this would open a post creation modal or form
    } catch (error) {
      console.error('Error focusing post box:', error);
    }
  };

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
    <div className='flex h-full flex-1 flex-col bg-slate-50/50'>
      {/* Header */}
      <div className='px-6 pt-6'>
        <h2 className='text-lg font-semibold text-slate-800'>Recent Posts</h2>
      </div>

      {/* Scrollable content area */}
      <div className='flex-1 overflow-auto px-6' ref={containerRef}>
        {!currentUser ? (
          <div className='flex justify-center py-8'>
            <LoadingSpinner size='lg' />
          </div>
        ) : feedPosts.length === 0 ? (
          <EmptyStateDisplay title='No posts found' description='Create a post to get started' actionText='Refresh Feed' onAction={clearError} />
        ) : (
          <div className='my-6 flex flex-col-reverse space-y-6 space-y-reverse'>
            {feedPosts.map((post) => (
              <div key={post.id}>
                <FeedPostItem post={post} />
              </div>
            ))}

            <div className='flex justify-center pt-2'>
              <Button
                onClick={handleLoadMorePosts}
                variant='outlined'
                size='md'
                isLoading={isLoadingMore}
                fullWidth={false}
                className='border border-blue-200 px-6 text-blue-500 hover:bg-blue-50'
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading...' : 'Load more posts'}
              </Button>
            </div>

            {isLoadingMore && (
              <div className='flex items-center justify-center py-4'>
                <div className='h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-blue-500'></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - Input fixed at bottom */}
      <div className='px-6 pt-2 pb-6'>
        <FeedCreatePostBox currentUser={currentUser} onFocus={handleCreatePostFocus} onSubmit={handleCreatePost} onMediaUpload={handleMediaUpload} />
      </div>
    </div>
  );
}
