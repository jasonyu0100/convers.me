import { PostItem } from '@/app/components/ui/posts';
import { Post } from '@/app/types/feed';

interface RoomFeedPostProps {
  post: Post;
  onClick?: (postId: string) => void;
}

export function RoomFeedPost({ post, onClick }: RoomFeedPostProps) {
  return (
    <div className='rounded-md px-2 transition-colors hover:bg-slate-50'>
      <PostItem
        post={post}
        media={post.media}
        onClick={onClick}
        isInRoom={true} // Set this to true since we're in a room
        roomName={post.media?.roomName || 'Current Room'}
        roomId={post.media?.roomId || post.id}
      />
    </div>
  );
}
