import { AppHeader } from '@/app/components/app/AppHeader';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { RoomBody } from './components/RoomBody';
import { useRoom } from './hooks/useRoom';
import { useRoomHeader } from './hooks/useRoomHeader';

/**
 * Room content component
 */
export function RoomView() {
  const { handlePostClick, handleCreatePost, handleTopicClick, handlePlayQuote, handleStartConversation, isLoading, error, clearError } = useRoom();

  const headerProps = useRoomHeader();

  // Handle loading state
  if (isLoading) {
    return (
      <div className='flex h-full w-full flex-col'>
        <AppHeader title={headerProps.title} isSearchVisible={headerProps.isSearchVisible} />
        <PageLoading />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className='flex h-full w-full flex-col'>
        <AppHeader title={headerProps.title} isSearchVisible={headerProps.isSearchVisible} />
        <ErrorDisplay error={error} title='Room Error' onRetry={clearError} />
      </div>
    );
  }

  return (
    <>
      <AppHeader title={headerProps.title} isSearchVisible={headerProps.isSearchVisible} />

      <RoomBody
        onPostClick={handlePostClick}
        onCreatePost={handleCreatePost}
        onTopicClick={handleTopicClick}
        onPlayQuote={handlePlayQuote}
        onStartConversation={handleStartConversation}
      />
    </>
  );
}
