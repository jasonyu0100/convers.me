/**
 * Profile-specific types for the personal profile route
 */

import { Post, TimeFrameType, User } from '../shared';

// Report types
export interface ProfileReport {
  id: string;
  title: string;
  period: string;
  periodType: TimeFrameType;
  dateGenerated: string;
  fileSize: string;
  downloadUrl: string;
  year: number;
  quarter: number;
  month?: number;
  metrics?: {
    eventCount: number;
    processesDone: number;
    hoursSpent: number;
    efficiency: number;
  };
}

// Core profile data types
/**
 * Extended user interface with profile-specific fields
 * Extends the shared User type with additional profile information
 */
export interface ProfileUser extends User {
  username: string; // Profile-specific (equivalent to handle in User)
  profileUrl: string; // Profile-specific
  biography: string; // Profile-specific
  profileImage: string; // From shared User but required here
}

// Media types for profile activities
export type ProfileMediaType = 'video' | 'image' | 'audio' | 'quote' | 'event';

/**
 * Extended post interface with profile-specific fields
 * Based on the shared Post type but with additional media and participant information
 */
export interface ProfileActivity {
  id: string;
  userId: string; // Maps to author.id in shared Post
  userName: string; // Maps to author.name in shared Post
  userImage: string; // Maps to author.profileImage in shared Post
  timestamp: string; // ISO date string
  timeAgo: string; // Human-readable relative time
  content: string; // From shared Post

  // Media attributes
  mediaType?: ProfileMediaType;
  mediaSource?: string; // Content source for quotes or explicit URL for media
  mediaUrl?: string; // Direct URL to media file
  eventId?: string; // ID of related event for event media
  duration?: string; // Duration for audio/video

  // Display properties
  aspectRatio?: 'video' | 'square' | '9/16';
  title?: string;

  // People associated with the activity
  participants?: {
    id: string;
    name: string;
    image: string;
  }[];

  isBlurred?: boolean;
}

/**
 * Connection type based on the shared User type
 * Represents network connections in the profile view
 */
export interface ProfileConnection extends User {
  username: string; // Equivalent to handle in shared User
}

export interface ProfileHighlight {
  id: string;
  quote: string;
  conversationId: string;
}

export type ProfileViewType = 'activity' | 'events' | 'reports';

/**
 * Profile-specific event type with additional metadata
 * This could potentially be shared or extended from a common Event type
 * in the future if there's alignment with other event types in the app
 */
export interface ProfileEvent {
  id: string;
  title: string;
  date: string; // Formatted date string
  timestamp: string; // ISO date string for sorting and filtering
  duration: string; // Human-readable duration
  tags: string[]; // Event tags/categories
  description?: string; // Optional event description
  participants?: number; // Number of participants (not the actual users)
  complexity?: number; // Event complexity rating (1-5)
  mediaUrl?: string; // URL to event recording or other media
}

/**
 * Timeline-related types for profile history visualization
 */
export type TimelinePeriod = 'month' | 'quarter' | 'year';

export interface TimelineYear {
  year: number;
  quarters: TimelineQuarter[];
  activityCount: number;
  eventCount: number;
}

export interface TimelineMonth {
  monthNumber: number;
  year: number;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  label: string; // e.g., "January"
  activityCount: number;
  eventCount: number;
}

export interface TimelineQuarter {
  quarter: 1 | 2 | 3 | 4;
  year: number;
  label: string; // e.g., "Q1 2024"
  activityCount: number;
  eventCount: number;
  months?: TimelineMonth[]; // Months in this quarter
}

/**
 * NOTE: Component-specific and context types have been moved to:
 * frontend/app/(routes)/profile/types/index.ts
 */
