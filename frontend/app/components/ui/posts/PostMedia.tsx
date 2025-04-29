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
    <div className='relative w-full'>
      {RoomIndicator}

      {/* Common wrapper for all media types - Instagram style */}
      <div className='relative w-full flex-col overflow-hidden'>
        {/* Media content - different for each type */}
        {media.type === 'video' && (
          <div className={`relative ${aspectRatioClass} overflow-hidden border-t border-b border-gray-100`}>
            {!isPlaying ? (
              // Video thumbnail with play button
              <div onClick={handleMediaClick}>
                <Image src={thumbnailPath} alt={media.title || 'Video thumbnail'} fill sizes='100vw' style={{ objectFit: 'cover' }} />
                <div className='absolute inset-0 flex items-center justify-center bg-black/10'>
                  <div className='rounded-full bg-white/80 p-3 shadow-sm'>
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

                {/* Type badge - Instagram style */}
                <div className='absolute top-3 right-3 z-10 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white'>
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
          <div className='border-t border-b border-gray-100 p-4' onClick={handleMediaClick}>
            {!isPlaying ? (
              <div className='flex items-center'>
                <div className='mr-3 rounded-full bg-gradient-to-r from-purple-400 to-pink-500 p-2.5'>
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    fill='none'
                    viewBox='0 0 24 24'
                    strokeWidth={1.5}
                    stroke='currentColor'
                    className='h-5 w-5 text-white'
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
          <div className={`relative ${aspectRatioClass} overflow-hidden border-t border-b border-gray-100`}>
            <Image
              src={thumbnailPath}
              alt={media.title || 'Image'}
              fill
              sizes='100vw'
              style={{ objectFit: 'cover' }}
              className='transition-opacity hover:opacity-95'
            />
          </div>
        )}

        {/* Content title bar - simplified, no Instagram buttons */}
        <div className='flex items-center px-4 py-2'>
          {/* Only show title if it exists and isn't in audio (already shown there) */}
          {media.title && media.type !== 'audio' && (
            <div>
              <span className='text-sm font-medium text-gray-700'>{media.title}</span>
            </div>
          )}
        </div>

        {/* Category and date in compact format - Instagram style */}
        {(media.category || media.publishedAt) && (
          <div className='px-4 pb-1 text-xs text-gray-500'>
            {media.category && <span className='font-medium'>{media.category}</span>}
            {media.publishedAt && media.category && <span className='mx-1'>•</span>}
            {media.publishedAt && <span>{media.publishedAt}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
