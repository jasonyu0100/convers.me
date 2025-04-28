import { Post } from '@/app/types/shared';
import { User } from '@/app/types/shared';

/**
 * Types for UI post components
 */

export type MediaType = 'video' | 'image' | 'audio' | 'quote' | 'event' | undefined;

export interface PostMediaContent {
  // Media type determines how content is rendered
  type: MediaType;

  // Media source info based on type
  url?: string; // For direct media URLs (videos, images, audio)
  source?: string; // For quote text or other content
  eventId?: string; // For event references
  audioSource?: string; // For audio quotes
  sourceName?: string; // Source name for quotes

  // Room and location info
  roomName?: string; // Name of room where content is from
  roomId?: string; // ID of room where content is from

  // Display properties
  aspectRatio?: 'video' | 'square' | '9/16';
  title?: string;
  duration?: string;
  complexity?: number;
  publishedAt?: string;
  category?: string;
  tags?: string[];

  // People associated with the media
  participants?: {
    id: string;
    name: string;
    profileImage?: string;
  }[];
}

export interface CommonPostProps {
  post: Post;
  media?: PostMediaContent;
  onClick?: (id: string) => void;
  isInRoom?: boolean;
  roomName?: string;
  roomId?: string;
}

export interface PostMediaProps {
  postId: string;
  media: PostMediaContent;
  onClick?: () => void;
  isInRoom?: boolean;
}

export interface PostQuoteProps {
  text: string;
  isAudio?: boolean;
  sourceName?: string;
  roomName?: string;
  audioSource?: string;
  onClick?: () => void;
}

export interface EventCardProps {
  eventId: string;
  title: string;
  participants: {
    id: string;
    name: string;
    profileImage?: string;
  }[];
  tags?: string[];
  duration?: string;
  complexity?: number;
  publishedAt?: string;
  roomName?: string;
  onClick?: () => void;
  onTagClick?: (tag: string) => void;
}
