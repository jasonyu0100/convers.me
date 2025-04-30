import { UserAvatar } from '../avatars/UserAvatar';
import { PostMedia } from './PostMedia';
import { PostQuote } from './PostQuote';
import { CommonPostProps } from './types';

export function PostItem({ post, media, onClick, isInRoom = false, roomName, roomId }: CommonPostProps) {
  // Handle room navigation for any post connected to a room
  const handleRoomRedirect = (e?: React.MouseEvent) => {
    // Only stop propagation if event exists
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }

    // Navigate to room if onClick handler is provided, regardless of roomId
    if (onClick) {
      onClick(roomId || post.id);
    }
  };

  // Determine if we have a quote to display
  const hasQuote = media?.type === 'quote' && media.source;

  // Determine if we have media to display
  const hasMedia = media && media.type !== 'quote';

  // Use provided roomName and roomId, or fallback to media values
  const displayRoomName = roomName || media?.roomName;
  const displayRoomId = roomId || media?.roomId;

  return (
    <div className='mb-8 py-2 last:mb-0'>
      {/* Minimalist header with user info */}
      <div className='mb-3 flex items-center'>
        <UserAvatar
          user={{
            id: post.author.id,
            name: post.author.name,
            profileImage: post.author.profileImage,
          }}
          size='sm'
          status={post.author.isOnline ? 'online' : 'offline'}
        />
        <div className='ml-2.5 min-w-0 flex-1'>
          <div className='flex items-center justify-between'>
            <p className='truncate text-sm font-medium text-slate-800'>{post.author.name}</p>
            <span className='ml-2 text-xs whitespace-nowrap text-slate-500'>{post.timeAgo}</span>
          </div>
          {!isInRoom && displayRoomName && <p className='truncate text-xs text-slate-500'>{displayRoomName}</p>}
        </div>
      </div>

      {/* Content section */}
      {post.content && (
        <div className='mb-3'>
          <p className='text-sm leading-relaxed whitespace-pre-line text-slate-700'>{post.content}</p>
        </div>
      )}

      {/* Media content */}
      {hasMedia && (
        <div className='mb-3 w-full overflow-hidden rounded-lg'>
          <PostMedia postId={post.id} media={media} onClick={displayRoomId ? () => handleRoomRedirect() : undefined} isInRoom={isInRoom} />
        </div>
      )}

      {/* Quote content */}
      {hasQuote && (
        <div className='mb-3'>
          <PostQuote
            text={media.source!}
            isAudio={media.audioSource !== undefined}
            audioSource={media.audioSource}
            sourceName={media.sourceName}
            roomName={!isInRoom ? displayRoomName : undefined}
            onClick={displayRoomId ? () => handleRoomRedirect() : undefined}
          />
        </div>
      )}

      {/* Ultra-minimal actions */}
      <div className='mt-2 flex items-center gap-4'>
        <button className='text-xs text-slate-400 hover:text-blue-600'>Reply</button>
        <button className='text-xs text-slate-400 hover:text-blue-600'>Add Note</button>
      </div>
    </div>
  );
}
