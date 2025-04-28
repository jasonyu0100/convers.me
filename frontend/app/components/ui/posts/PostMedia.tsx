import Image from 'next/image';
import { useRef, useState } from 'react';
import { EventCard } from './EventCard';
import { PostMediaProps } from './types';
import { getMediaPath, getThumbnailPath } from './utils';

export function PostMedia({ postId, media, onClick, isInRoom = false }: PostMediaProps) {
  // State for video/audio playback
  const [isPlaying, setIsPlaying] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  // Skip rendering for quote type - should use PostQuote instead
  if (media.type === 'quote') return null;

  // Always use EventCard for event-type media
  if (media.type === 'event') {
    return (
      <EventCard
        eventId={media.eventId || `event-${postId}`}
        title={media.title || 'Event'}
        participants={[]} // Removed participants as requested
        tags={media.tags || ['Meeting', 'Discussion']} // Default tags if none provided
        duration={media.duration || '60min'}
        complexity={media.complexity || 3} // Default complexity
        publishedAt={media.publishedAt || 'Today'} // Default date
        roomName={!isInRoom ? media.roomName : undefined} // Only show room name if not in the room itself
        onClick={onClick}
      />
    );
  }

  const aspectRatioClass = media.aspectRatio === 'video' ? 'aspect-video' : media.aspectRatio === '9/16' ? 'aspect-9/16' : 'aspect-square';

  // Determine media type label and other display properties
  const typeLabel = media.type === 'video' ? 'Video' : media.type === 'audio' ? 'Audio' : 'Image';

  const durationLabel = media.duration || (media.type === 'video' ? '4:32' : media.type === 'audio' ? '2:18' : null);

  // Get appropriate paths for media and thumbnails
  const mediaPath = getMediaPath(media, postId);
  const thumbnailPath = media.type === 'video' || media.type === 'audio' ? getThumbnailPath(media, postId) : mediaPath;

  // Handle media click
  const handleMediaClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // No redirection on media content clicks
    if (media.type === 'video' || media.type === 'audio') {
      // For audio/video, toggle play state
      setIsPlaying(true);
    }
    // For images and events, do nothing (just display the content)
  };

  // Handle pause/stop
  const handlePause = () => {
    setIsPlaying(false);
  };

  // We don't need a RoomIndicator here since it's handled in PostItem
  const RoomIndicator = null;

  return (
    <div className='relative mb-2 w-full max-w-[360px]'>
      {RoomIndicator}

      {/* Common wrapper for all media types - only applied to media content */}
      <div className='relative flex w-full flex-col overflow-hidden rounded-md'>
        {/* Media content - different for each type */}
        {media.type === 'video' && (
          <div className={`relative ${aspectRatioClass} overflow-hidden`}>
            {!isPlaying ? (
              // Video thumbnail with play button
              <div onClick={handleMediaClick}>
                <Image src={thumbnailPath} alt={media.title || 'Video thumbnail'} fill sizes='(max-width: 400px) 100vw, 400px' style={{ objectFit: 'cover' }} />
                <div className='absolute inset-0 flex items-center justify-center bg-black/20'>
                  <div className='bg-white/80/90 rounded-full p-3'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      fill='none'
                      viewBox='0 0 24 24'
                      strokeWidth={1.5}
                      stroke='currentColor'
                      className='h-6 w-6 text-blue-600'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        d='M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z'
                      />
                    </svg>
                  </div>
                </div>

                {/* Type badge */}
                <div className='bg-opacity-60 absolute top-2 left-2 z-10 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white'>
                  {typeLabel}
                  {durationLabel && <span className='ml-1'>• {durationLabel}</span>}
                </div>
              </div>
            ) : (
              // Actual video player
              <video
                ref={mediaRef as React.RefObject}
                src={mediaPath}
                className='h-full w-full'
                controls
                autoPlay
                onEnded={handlePause}
                onPause={handlePause}
              />
            )}
          </div>
        )}

        {media.type === 'audio' && (
          <div className='p-3' onClick={handleMediaClick}>
            {!isPlaying ? (
              <div className='flex items-center'>
                <div className='mr-3 rounded-full bg-blue-100 p-2'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='h-6 w-6 text-blue-600'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z'
                    />
                  </svg>
                </div>
                <div>
                  <div className='text-sm font-medium text-gray-800'>{media.title || 'Audio recording'}</div>
                  <div className='text-xs text-gray-500'>
                    {durationLabel || '0:00'} • {typeLabel}
                  </div>
                </div>
              </div>
            ) : (
              <audio ref={mediaRef as React.RefObject} src={mediaPath} className='w-full' controls autoPlay onEnded={handlePause} onPause={handlePause} />
            )}
          </div>
        )}

        {media.type === 'image' && (
          <div className={`relative ${aspectRatioClass} overflow-hidden`}>
            <Image src={thumbnailPath} alt={media.title || 'Image'} fill sizes='(max-width: 400px) 100vw, 400px' style={{ objectFit: 'cover' }} />
          </div>
        )}

        {/* Content metadata - simplified and minimalist */}
        {media.title && media.type !== 'audio' && (
          <div className='px-3 py-2'>
            <h3 className='truncate text-sm font-medium text-gray-800'>{media.title}</h3>
          </div>
        )}

        {/* Category and date in compact format - only shown if there's a category or publishedAt date */}
        {(media.category || media.publishedAt) && (
          <div className='flex items-center justify-between border-t border-slate-100 px-3 py-2 text-xs text-gray-500'>
            {media.category && <span className='text-blue-700'>{media.category}</span>}
            {media.publishedAt && <span>{media.publishedAt}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
