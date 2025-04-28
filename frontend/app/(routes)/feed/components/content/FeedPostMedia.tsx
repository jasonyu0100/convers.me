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
      className='flex w-full max-w-[360px] cursor-pointer flex-col overflow-hidden rounded-xl shadow-sm transition-all hover:translate-y-[-2px] hover:shadow-md'
      onClick={onClick}
    >
      <div className={`${aspectRatioClass} relative w-full overflow-hidden`}>
        <Image src={mediaPath} alt={media.title || 'Media content'} fill style={{ objectFit: 'cover' }} className='transition-transform hover:scale-105' />

        {/* Overlay for video content */}
        {media.type === 'video' && (
          <div className='bg-opacity-20 absolute inset-0 flex items-center justify-center bg-black'>
            <div className='bg-opacity-80 rounded-full bg-white/80 p-3 shadow-lg'>
              <svg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' strokeWidth={1.5} stroke='currentColor' className='h-6 w-6 text-blue-600'>
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
        <div className='bg-opacity-60 absolute top-2 left-2 rounded-full bg-black px-2 py-0.5 text-xs font-medium text-white'>
          {typeLabel}
          {durationLabel && <span className='ml-1'>• {durationLabel}</span>}
        </div>
      </div>

      <div className='flex w-full flex-1 flex-col justify-center p-4'>
        {media.title && <h3 className='mb-2 text-base leading-tight font-bold text-gray-800'>{media.title}</h3>}

        {media.participants && media.participants.length > 0 && (
          <div className='mt-2 flex flex-row items-center space-x-2'>
            <div className='flex -space-x-2'>
              {media.participants.slice(0, 3).map((participant, index) => (
                <UserAvatar
                  key={participant.id}
                  user={{
                    id: participant.id,
                    name: participant.name,
                    profileImage: participant.profileImage,
                  }}
                  size='sm'
                />
              ))}
            </div>
            <p className='text-xs font-medium text-gray-600'>
              {media.participants[0].name}
              {media.participants.length > 1 && ` + ${media.participants.length - 1} more`}
            </p>
          </div>
        )}

        {/* Additional metadata for developer context - only shown for videos/technical demos */}
        {media.type && (
          <div className='mt-3 flex items-center justify-between text-xs text-gray-500'>
            <div className='flex items-center space-x-2'>
              <span className='rounded-full bg-blue-100 px-2 py-0.5 text-blue-700'>{media.type === 'video' ? 'Code Walkthrough' : 'Technical Demo'}</span>
            </div>
            {/* Time indicator only shown for media with date info */}
            {media.date && <span>{media.date}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
