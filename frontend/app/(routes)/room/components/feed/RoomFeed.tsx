import { Divider } from '@/app/components/ui';
import { UserSchema } from '@/app/types/schema';
import { useRoom } from '../../hooks';
import { RoomCard } from '../details/RoomCard';
import { RoomFeedInput } from './RoomFeedInput';
import { RoomFeedPost } from './RoomFeedPost';
import { useEffect, useRef } from 'react';

interface RoomFeedProps {
  onPostClick?: (postId: string) => void;
  onCreatePost?: (content: string) => Promise;
  onTopicClick?: (topicId: string) => void;
  onMediaUpload?: (file: File) => Promise;
}

export function RoomFeed({ onPostClick, onCreatePost, onTopicClick, onMediaUpload }: RoomFeedProps) {
  const { currentUser, posts, eventDetails, handleCreatePost } = useRoom();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when posts change
  useEffect(() => {
    if (containerRef.current && posts.length > 0) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [posts]);

  // Convert the currentUser to UserSchema format
  const userSchema: UserSchema = {
    id: currentUser.id,
    name: currentUser.name,
    profileImage: currentUser.profileImage,
    email: currentUser.handle || '',
    handle: currentUser.handle || '',
  };

  return (
    <div className='flex h-full w-full flex-col'>
      {/* Header - Room card fixed at top */}
      <div className='px-6 pt-6'>
        <RoomCard room={eventDetails} onTopicClick={onTopicClick} />
        <Divider className='my-6' />
      </div>

      {/* Body - Scrollable posts area */}
      <div className='flex-1 overflow-auto px-6' ref={containerRef}>
        <div className='mb-6 flex flex-col-reverse space-y-6 space-y-reverse'>
          {posts.map((post) => (
            <RoomFeedPost key={post.id} post={post} onClick={onPostClick} />
          ))}
        </div>
      </div>

      {/* Footer - Input fixed at bottom */}
      <div className='px-6 pt-2 pb-6'>
        <RoomFeedInput currentUser={userSchema} onSubmit={onCreatePost || handleCreatePost} onMediaUpload={onMediaUpload} />
      </div>
    </div>
  );
}
