import { UserAvatar } from '@/app/components/ui/avatars/UserAvatar';
import Image from 'next/image';
import { Post } from '../../../../types/feed';

interface FeedPostMediaProps {
  post: Post;
  onClick?: () => void;
}

// Maps post ID to specific media for consistent rendering
const getMediaPath = (postId: string): string => {
  // Use modulo to cycle through available media
  const mediaNumber = (parseInt(postId.replace(/\D/g, '')) % 6) + 1;
  return `/image/stock-image-${mediaNumber}.jpg`;
};

export function FeedPostMedia({ post, onClick }: FeedPostMediaProps) {
  if (!post.media) return null;

  const { media } = post;
  const aspectRatioClass = media.aspectRatio === 'video' ? 'aspect-video' : media.aspectRatio === '9/16' ? 'aspect-9/16' : 'aspect-square';

  // Get media path based on post ID
  const mediaPath = getMediaPath(post.id);

  // Labels for technical content
  const typeLabel = media.type === 'video' ? 'Video' : 'Screenshot';
  const durationLabel = media.type === 'video' ? '4:32' : null;

  return (
    <div
      className='flex w-full cursor-pointer flex-col overflow-hidden rounded border border-slate-100 transition-all hover:border-slate-200'
      onClick={onClick}
    >
      <div className={`${aspectRatioClass} relative w-full overflow-hidden`}>
        <Image src={mediaPath} alt={media.title || 'Media content'} fill style={{ objectFit: 'cover' }} className='transition-transform hover:scale-105' />

        {/* Overlay for video content */}
        {media.type === 'video' && (
          <div className='absolute inset-0 flex items-center justify-center bg-black/10'>
            <div className='rounded-full bg-white/70 p-2'>
              <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='h-5 w-5 text-blue-500'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z'
                />
              </svg>
            </div>
          </div>
        )}

        {/* Type badge */}
        <div className='absolute top-2 left-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white'>
          {typeLabel}
          {durationLabel && <span className='ml-1'>• {durationLabel}</span>}
        </div>
      </div>

      <div className='flex w-full flex-1 flex-col justify-center p-3'>
        {media.title && <h3 className='mb-1 text-xs leading-tight font-medium text-slate-700'>{media.title}</h3>}

        {media.participants && media.participants.length > 0 && (
          <div className='mt-1 flex flex-row items-center space-x-1.5'>
            <div className='flex -space-x-1.5'>
              {media.participants.slice(0, 3).map((participant, index) => (
                <UserAvatar
                  key={participant.id}
                  user={{
                    id: participant.id,
                    name: participant.name,
                    profileImage: participant.profileImage,
                  }}
                  size='xs'
                />
              ))}
            </div>
            <p className='text-[10px] text-slate-500'>
              {media.participants[0].name}
              {media.participants.length > 1 && ` + ${media.participants.length - 1}`}
            </p>
          </div>
        )}

        {/* Additional metadata for developer context - only shown for videos/technical demos */}
        {media.type && (
          <div className='mt-2 flex items-center justify-between text-[10px] text-slate-400'>
            <div className='flex items-center'>
              <span className='rounded-full bg-blue-50 px-1.5 py-0.5 text-blue-500'>{media.type === 'video' ? 'Code Demo' : 'Tech Demo'}</span>
            </div>
            {/* Time indicator only shown for media with date info */}
            {media.date && <span>{media.date}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
