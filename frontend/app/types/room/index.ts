/**
 * Event Types
 *
 * This file contains event-specific types that build on the base schema
 * and shared UI types. These types are focused on event presentation and
 * functionality in the UI.
 */

import { BaseEvent, Post as BasePost, Step as SharedStep, SubStep as SharedSubStep, User } from '../shared';
import { Post as FeedPost } from '../feed';
import { EventSchema, StepSchema } from '../schema';

/**
 * Possible states for a room
 */
export type RoomStatus = 'Pending' | 'Planning' | 'Execution' | 'Review' | 'Administrative' | 'Done';

/**
 * Event-specific post interface
 * We use the Feed post type which includes media
 */
export type Post = FeedPost;

/**
 * Detailed event interface extending the base UI event interface
 * This type is used for displaying detailed event information
 */
export interface EventDetails extends BaseEvent {
  duration: string;
  title: string;
  description: string;
  complexity?: number; // Value from 1-5
  tags: string[]; // Tags/topics for the event
}

/**
 * API response for steps list endpoint (/events/{eventId}/list)
 * Matches exactly the API response format
 */
export interface EventList {
  id: string;
  title: string;
  description: string;
  process?: {
    templateId?: string;
    isTemplate?: boolean;
  };
  steps: EventListStep[];
}

/**
 * Step in an event list from API response
 * Uses camelCase for properties as returned by API
 */
export interface EventListStep {
  id: string;
  content: string;
  completed: boolean;
  completedAt?: string;
  order: number;
  dueDate?: string;
  eventId: string;
  processId?: string;
  createdAt?: string;
  updatedAt?: string;
  subSteps: EventListSubStep[];
}

/**
 * Sub-step in an event list from API response
 * Uses camelCase for properties as returned by API
 */
export interface EventListSubStep {
  id: string;
  content: string;
  completed: boolean;
  completedAt?: string;
  order: number;
  stepId: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Helper functions to convert between schema and UI types
 */
export const eventConverters = {
  /**
   * Convert a database EventSchema to a UI EventDetails object
   */
  schemaToEventDetails(eventSchema: EventSchema, tags: string[] = []): EventDetails {
    return {
      ...eventSchema,
      tags,
      duration: eventSchema.duration || '60min',
    };
  },

  /**
   * Convert UI EventDetails to a database EventSchema for saving
   */
  eventDetailsToSchema(eventDetails: EventDetails): EventSchema {
    // Extract only the fields that belong in the database
    const { id, title, description, date, time, duration, status, complexity, color, createdAt, updatedAt, createdById, processId } = eventDetails;

    return {
      id,
      title,
      description,
      date,
      time,
      duration,
      status,
      complexity,
      color,
      createdAt,
      updatedAt,
      createdById,
      processId,
    };
  },
};
