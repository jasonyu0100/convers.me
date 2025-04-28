/**
 * Schema Types - Types used throughout the application
 *
 * This file serves as a primary source of type definitions for the application.
 *
 * USAGE GUIDANCE:
 * - For new code, always use ApiXxxSchema types (e.g., ApiUserSchema)
 * - The legacy XxxSchema types (e.g., UserSchema) are maintained only for backward compatibility
 *
 * All types use camelCase for consistency in the frontend codebase.
 */

import { components, UUID, DateTime, MediaTypeEnum, EventStatusEnum, ParticipantStatusEnum, NotificationType, ColorType } from '../api-types';

import {
  BaseEntity,
  UserEntity,
  TopicEntity,
  EventEntity,
  ProcessEntity,
  StepEntity,
  SubStepEntity,
  PostEntity,
  MediaEntity,
  EventTopicEntity,
  EventParticipantEntity,
  UserPreferencesEntity,
  NotificationEntity,
  StatusLogEntity,
  DirectoryEntity,
} from '../entities';

// Basic utility types
export type { UUID, DateTime };

// DEPRECATED: These types are maintained for backward compatibility only
// For new code, use ApiXxxSchema types below
export type UserSchema = UserEntity; // DEPRECATED - use ApiUserSchema instead
export type TopicSchema = TopicEntity; // DEPRECATED - use ApiTopicSchema instead
export type EventSchema = EventEntity; // DEPRECATED - use ApiEventSchema instead
export type ProcessSchema = ProcessEntity; // DEPRECATED - use ApiProcessSchema instead
export type StepSchema = StepEntity; // DEPRECATED - use ApiStepSchema instead
export type SubStepSchema = SubStepEntity; // DEPRECATED - use ApiSubStepSchema instead
export type PostSchema = PostEntity; // DEPRECATED - use ApiPostSchema instead
export type MediaSchema = MediaEntity; // DEPRECATED - use ApiMediaSchema instead
export type EventTopicSchema = EventTopicEntity; // DEPRECATED - use direct API types instead
export type EventParticipantSchema = EventParticipantEntity; // DEPRECATED - use direct API types instead
export type UserPreferencesSchema = UserPreferencesEntity; // DEPRECATED - use direct API types instead
export type NotificationSchema = NotificationEntity; // DEPRECATED - use ApiNotificationSchema instead
export type StatusLogSchema = StatusLogEntity; // DEPRECATED - use ApiStatusLogSchema instead
export type DirectorySchema = DirectoryEntity; // DEPRECATED - use ApiDirectorySchema instead

/**
 * Modern Schema Types - These are the preferred types to use for all new code
 * Direct exports from api-types.ts using explicit naming to avoid conflicts
 */

// Re-export API types with ApiXxxSchema naming convention
export type ApiUserSchema = components.schemas.UserRead;
export type ApiTopicSchema = components.schemas.TopicRead;
export type ApiEventSchema = components.schemas.EventRead;
export type ApiProcessSchema = components.schemas.ProcessRead;
export type ApiStepSchema = components.schemas.StepRead;
export type ApiSubStepSchema = components.schemas.SubStepRead;
export type ApiPostSchema = components.schemas.PostRead;
export type ApiMediaSchema = components.schemas.MediaRead;
export type ApiNotificationSchema = components.schemas.NotificationRead;
export type ApiDirectorySchema = components.schemas.DirectoryRead;
export type ApiStatusLogSchema = components.schemas.StatusLogRead;
export type ApiTokenSchema = components.schemas.Token;
export type ApiUserPreferencesSchema = components.schemas.UserPreferencesRead;

// -------------------------------------------------------
// Enum Types - These define valid values for certain fields
// -------------------------------------------------------

export type MediaType = MediaTypeEnum;
export type EventStatusType = EventStatusEnum;
export type ParticipantStatusType = ParticipantStatusEnum;
export type { NotificationType, ColorType };

// -------------------------------------------------------
// Validation utilities
// -------------------------------------------------------

/**
 * Type guard to check if a value is a valid UUID
 * @param value - Value to check
 * @returns True if the value is a valid UUID string
 */
export function isUUID(value: any): value is UUID {
  if (typeof value !== 'string') return false;

  // Basic UUID format validation (8-4-4-4-12 hex digits)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Type guard to check if a value is a valid DateTime string
 * @param value - Value to check
 * @returns True if the value is a valid DateTime string
 */
export function isDateTime(value: any): value is DateTime {
  if (typeof value !== 'string') return false;

  // Check if the string can be parsed into a valid date
  const date = new Date(value);
  return !isNaN(date.getTime());
}

/**
 * Type guard to check if an object conforms to ApiUserSchema
 * @param obj - Object to check
 * @returns True if the object conforms to ApiUserSchema
 */
export function isApiUserSchema(obj: any): obj is ApiUserSchema {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUUID(obj.id) &&
    typeof obj.name === 'string' &&
    typeof obj.handle === 'string' &&
    (obj.email === undefined || typeof obj.email === 'string') &&
    (obj.profileImage === undefined || typeof obj.profileImage === 'string') &&
    (obj.bio === undefined || typeof obj.bio === 'string') &&
    isDateTime(obj.createdAt) &&
    (obj.updatedAt === undefined || isDateTime(obj.updatedAt)) &&
    (obj.isAdmin === undefined || typeof obj.isAdmin === 'boolean')
  );
}

/**
 * Type guard to check if an object conforms to ApiEventSchema
 * @param obj - Object to check
 * @returns True if the object conforms to ApiEventSchema
 */
export function isApiEventSchema(obj: any): obj is ApiEventSchema {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUUID(obj.id) &&
    typeof obj.title === 'string' &&
    isDateTime(obj.startTime) && // Check for startTime
    isDateTime(obj.endTime) && // Check for endTime
    isDateTime(obj.createdAt) &&
    (obj.processId === undefined || isUUID(obj.processId))
  );
}

/**
 * Type guard to check if an object conforms to ApiProcessSchema
 * @param obj - Object to check
 * @returns True if the object conforms to ApiProcessSchema
 */
export function isApiProcessSchema(obj: any): obj is ApiProcessSchema {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    isUUID(obj.id) &&
    typeof obj.title === 'string' &&
    isDateTime(obj.createdAt) &&
    (obj.directoryId === undefined || isUUID(obj.directoryId))
  );
}
