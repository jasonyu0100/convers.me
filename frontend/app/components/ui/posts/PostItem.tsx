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

  // Determine if this is a plain text post (no media and no quotes)
  const isPlainTextPost = !hasMedia && !hasQuote;

  return (
    <div className='overflow-hidden rounded-xl border-1 border-slate-200 bg-white/80'>
      {/* Minimalist header with user info */}
      <div className='flex items-center p-3'>
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
            <p className='truncate text-sm font-medium text-gray-900'>{post.author.name}</p>
            <span className='ml-2 text-xs whitespace-nowrap text-gray-500'>{post.timeAgo}</span>
          </div>
          {!isInRoom && displayRoomName && <p className='truncate text-xs text-gray-500'>{displayRoomName}</p>}
        </div>
        {!isInRoom && displayRoomName && (
          <button
            className='ml-2 rounded-full p-1.5 text-gray-400 hover:bg-gray-50 hover:text-blue-500'
            onClick={(e) => handleRoomRedirect(e)}
            aria-label='Open post'
            title='Open post'
          >
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='h-4 w-4'>
              <path
                fillRule='evenodd'
                d='M5.22 14.78a.75.75 0 001.06 0l7.22-7.22v5.69a.75.75 0 001.5 0v-7.5a.75.75 0 00-.75-.75h-7.5a.75.75 0 000 1.5h5.69l-7.22 7.22a.75.75 0 000 1.06z'
                clipRule='evenodd'
              />
            </svg>
          </button>
        )}
      </div>

      {/* Content section - cleaner spacing */}
      {post.content && (
        <div className='px-3 pb-3'>
          <p className='text-sm leading-relaxed whitespace-pre-line text-gray-800'>{post.content}</p>
        </div>
      )}

      {/* Media content */}
      {hasMedia && (
        <div className='w-full'>
          <PostMedia postId={post.id} media={media} onClick={displayRoomId ? () => handleRoomRedirect() : undefined} isInRoom={isInRoom} />
        </div>
      )}

      {/* Quote content */}
      {hasQuote && (
        <div className='px-3 py-2'>
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

      {/* Minimal footer with subtle divider and action buttons */}
      <div className='flex items-center justify-between border-t border-gray-100 px-3 py-2.5'>
        <div className='flex space-x-2'>
          <button className='rounded px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-blue-600'>Add Note</button>
          <button className='rounded px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-blue-600'>Thread</button>
          <button className='rounded px-2.5 py-1 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:text-blue-600'>Archive</button>
        </div>
        <button className='rounded-full p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600'>
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='h-4 w-4'>
            <path d='M3 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8.5 10a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM15.5 8.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z' />
          </svg>
        </button>
      </div>
    </div>
  );
}
