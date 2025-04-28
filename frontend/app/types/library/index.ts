import { Topic as BaseTopic, User } from '../shared';

/**
 * Library-specific topic interface
 */
export type Topic = BaseTopic;

export interface LibraryRoom {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  complexity?: number; // Value from 1-5
  status?: string;
  colorTag?: string;
  image?: string; // Will use imageUrl from backend
  participants?: User[];
  tags?: string[]; // Free-form tags from room metadata
  topics?: string[]; // Topic IDs associated with the room/event
  publishedAt?: string; // Will be mapped from createdAt
}
