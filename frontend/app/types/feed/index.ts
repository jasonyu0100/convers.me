/**
 * Feed Types
 *
 * This file contains types for the social feed functionality.
 * These types build on the base schema but include UI-specific
 * extensions for media display and post interactions.
 */

import { AppColor, BaseEvent, EventColor, EventStatus, Participants, Post as BasePost, Topic as BaseTopic, User } from '../shared';
import { MediaSchema, MediaType as SchemaMediaType } from '../schema';

/**
 * Extended Post interface with feed-specific fields for UI
 */
export interface Post extends BasePost {
  media?: PostMedia;
  quote?: PostQuote;
}

/**
 * Media types allowed in posts
 */
export type MediaType = SchemaMediaType | undefined;

/**
 * Aspect ratio options for media display in UI
 */
export type AspectRatio = 'video' | 'square' | '9/16';

/**
 * Media attached to a post
 * Extended version of MediaSchema with UI-specific fields
 */
export interface PostMedia extends MediaSchema {
  // Display properties
  aspectRatio?: AspectRatio;

  // Additional content metadata
  source?: string; // For quote text
  audioSource?: string; // For audio quotes
  sourceName?: string; // Source name for quotes

  // Event information
  eventName?: string; // Name of event where content is from
  eventId?: string; // ID of event where content is from

  // Display and categorization
  category?: string; // Category label for the media
  tags?: string[]; // Tags for the media (especially events)
  publishedAt?: string; // When the media was published
  complexity?: number; // Complexity indicator (1-5) for events

  // People associated with the media
  participants?: User[];
}

/**
 * Quote content for a post
 * UI-specific structure, not directly mapped to database
 */
export interface PostQuote {
  text: string;
  isAudio?: boolean;
  sourceName?: string;
  audioSource?: string;
  eventName?: string;
  eventId?: string;
}

/**
 * Feed-specific topic interface
 */
export type Topic = BaseTopic;

/**
 * Completed event interface extending the base event
 * UI representation with additional fields
 */
export interface CompletedEvent extends BaseEvent {
  recordingUrl?: string;
  status: 'done';
}

/**
 * Feed event interface for simplified display in feed
 * UI-specific presentation of an event
 */
export interface Event {
  id: string;
  title: string;
  time?: string;
  avatarColor: string;
  participants?: string[];
  topics?: string[];
  status?: EventStatus;
}

/**
 * Helper functions to convert between media types
 */
export const mediaConverters = {
  /**
   * Converts a PostMedia object to a MediaSchema for database storage
   */
  postMediaToSchema(postMedia: PostMedia): MediaSchema {
    return {
      id: '', // To be generated when saving
      type: postMedia.type,
      title: postMedia.title,
      url: postMedia.url,
      duration: postMedia.duration,
      aspectRatio: postMedia.aspectRatio,
      postId: undefined, // To be set when associating with a post
      eventId: postMedia.eventId,
    };
  },
};
