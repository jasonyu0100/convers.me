import { UserAvatar } from '../avatars/UserAvatar';
import { PostMedia } from './PostMedia';
import { PostQuote } from './PostQuote';
import { RoomNavigation } from './RoomNavigation';
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
    <div className={`relative flex w-full flex-row space-x-[1rem] ${isPlainTextPost ? '' : 'border-b border-slate-200'} pb-[2rem]`}>
      {/* Room redirect button - show for any post connected to a room */}
      {!isInRoom && displayRoomName && <RoomNavigation roomName={displayRoomName} onClick={(e) => handleRoomRedirect(e)} />}

      <UserAvatar
        user={{
          id: post.author.id,
          name: post.author.name,
          profileImage: post.author.profileImage,
        }}
        size='md'
        status={post.author.isOnline ? 'online' : 'offline'}
      />

      <div className='flex flex-grow flex-col space-y-[0.5rem]'>
        <p className='text-lg font-medium'>
          {post.author.name} · {post.timeAgo}
        </p>

        {/* Post content */}
        <p className='text-md font-medium'>{post.content}</p>

        {/* Quote content */}
        {hasQuote && (
          <PostQuote
            text={media.source!}
            isAudio={media.audioSource !== undefined}
            audioSource={media.audioSource}
            sourceName={media.sourceName}
            roomName={!isInRoom ? displayRoomName : undefined}
            onClick={displayRoomId ? () => handleRoomRedirect() : undefined}
          />
        )}

        {/* Media content - handle different media types differently */}
        {hasMedia && <PostMedia postId={post.id} media={media} onClick={displayRoomId ? () => handleRoomRedirect() : undefined} isInRoom={isInRoom} />}
      </div>
    </div>
  );
}
