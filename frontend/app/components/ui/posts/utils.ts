import { PostMediaProps } from './types';

/**
 * Utility functions for Posts components
 */

/**
 * Get the appropriate media path based on media type and ID
 */
export function getMediaPath(media: PostMediaProps['media'], postId: string): string {
  // If there's a specific URL provided, use that
  if (media.url) {
    return media.url;
  }

  // Otherwise generate a path based on media type
  const numericId = parseInt(postId.replace(/\D/g, '')) || 1;
  const fileIndex = (numericId % 4) + 1; // Use 4 files of each type (1-4)

  switch (media.type) {
    case 'video':
      return `/video/stock-video-${fileIndex}.mp4`;
    case 'audio':
      return `/audio/stock-audio-${fileIndex}.mp3`;
    case 'image':
    default:
      return `/image/stock-image-${fileIndex}.jpg`;
  }
}

/**
 * Get thumbnail image for videos (separate from the video file)
 */
export function getThumbnailPath(media: PostMediaProps['media'], postId: string): string {
  // Always use image for thumbnail, even for videos
  const numericId = parseInt(postId.replace(/\D/g, '')) || 1;
  const fileIndex = (numericId % 4) + 1;
  return `/image/stock-image-${fileIndex}.jpg`;
}
