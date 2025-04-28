/**
 * Shared UI Types
 *
 * This file contains types that are used across UI components.
 * Many of these types are derived from database schema types but are
 * optimized for UI presentation and component usage.
 */

import { ColorType, EventStatusEnum } from '../api-types';
import { BaseEntity } from '../entities';
import { UserSchema, TopicSchema, EventSchema, StepSchema, SubStepSchema } from '../schema';

// -----------------------------------------------------
// UI Versions of Schema Types
// -----------------------------------------------------

/**
 * User interface with UI-specific properties
 * Derived from: UserSchema
 */
export interface User extends UserSchema {
  isOnline?: boolean; // UI-only state
}

/**
 * Topic interface with UI-specific properties
 * Derived from: TopicSchema
 */
export interface Topic extends TopicSchema {
  isSelected?: boolean; // UI-only state for selection
}

/**
 * Common post interface for social features
 * Extended with UI-specific properties
 */
export interface Post extends BaseEntity {
  author: User; // Expanded relationship
  content: string;
  timeAgo: string; // Computed field for UI display
}

// -----------------------------------------------------
// UI-Specific Enums and Constants
// -----------------------------------------------------

/**
 * Color options for UI elements (mapped from schema ColorType)
 */
export type AppColor = ColorType;

/**
 * Alias of AppColor specifically for events
 */
export type EventColor = AppColor;

/**
 * Event status types for UI (mapped from schema EventStatusEnum)
 */
export type EventStatus = EventStatusEnum;

/**
 * Time period types for filtering and display
 */
export type TimeFrameType = 'month' | 'quarter' | 'year';

// -----------------------------------------------------
// UI-Only Component Types (not directly from schema)
// -----------------------------------------------------

/**
 * Standard participant structure for UI display
 * This is a UI composition, not a direct schema mapping
 */
export interface Participants {
  name: string;
  count: number;
  avatars?: User[];
}

/**
 * Base event interface with common properties
 * This is an expanded version of EventSchema with UI-specific fields
 */
export interface BaseEvent {
  id: string;
  title: string;
  description?: string;
  startTime?: Date; // UI date object for start time
  endTime?: Date; // UI date object for end time
  status?: string;
  color?: string;
  location?: string;
  participants?: Participants; // UI composition
  topics?: string[] | Topic[]; // UI representation of related topics
  // Note: Event recurrence is not supported
}

/**
 * Step interface for processes and events in UI
 * Based on StepSchema but with UI-specific fields
 */
export interface Step extends StepSchema {
  subSteps?: SubStep[]; // UI representation of related sub-steps
}

/**
 * SubStep interface for UI
 * Based on SubStepSchema
 */
export interface SubStep extends SubStepSchema {}

// -----------------------------------------------------
// UI Helper Functions
// -----------------------------------------------------

/**
 * Type conversion utilities for UI components
 */
export const typeConverters = {
  /**
   * Creates a UI User object from schema user data
   */
  createUser: (id: string, name: string, handle: string, profileImage?: string, isOnline?: boolean): User => ({
    id,
    name,
    handle,
    profileImage,
    isOnline,
  }),

  /**
   * Creates a UI Post object
   */
  createPost: (id: string, author: User, content: string, timeAgo: string): Post => ({
    id,
    author,
    content,
    timeAgo,
  }),

  /**
   * Creates a topic object for UI
   */
  createTopic: (id: string, name: string, isSelected: boolean = false): Topic => ({
    id,
    name,
    isSelected,
  }),

  /**
   * Creates a participants object for UI display
   */
  createParticipants: (name: string, count: number, avatars?: User[]): Participants => ({
    name,
    count,
    avatars,
  }),
};
