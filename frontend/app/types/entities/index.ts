/**
 * Entity Types - Core data models
 *
 * This file contains the entity interfaces that represent core data types in the application.
 * These are used as the foundation for both API schemas and UI components.
 *
 * USAGE GUIDANCE:
 * - These types represent the internal data models
 * - For API data structures, use the types from api-types.ts
 * - For UI-specific types, use the derived types in shared/index.ts
 *
 * All types use camelCase for consistency in the frontend codebase.
 */

// Define Record type for maps/dictionaries
type Record<K extends string | number | symbol, T> = { [P in K]: T };

// Base entity interface that other entities extend
export interface BaseEntity {
  id: string;
  createdAt?: string;
  updatedAt?: string;
}

// User entity representing a user in the system
export interface UserEntity extends BaseEntity {
  name: string;
  handle: string;
  email?: string;
  profileImage?: string;
  bio?: string;
  isAdmin?: boolean;
}

// Topic entity representing a categorization tag
export interface TopicEntity extends BaseEntity {
  name: string;
  category?: string;
  color?: string;
}

// Event entity representing a scheduled activity
export interface EventEntity extends BaseEntity {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  // Legacy fields kept for backwards compatibility
  date?: string;
  time?: string;
  duration?: string;
  status?: string;
  complexity?: number;
  color?: string;
  location?: string;
  recordingUrl?: string;
  createdById?: string;
  processId?: string;
  topics?: TopicEntity[];
  participants?: EventParticipantEntity[];
}

// Process entity representing a workflow or project
export interface ProcessEntity extends BaseEntity {
  title: string;
  description?: string;
  color?: string;
  lastUpdated?: string;
  favorite?: boolean;
  category?: string;
  createdById: string;
  directoryId?: string;
  isTemplate?: boolean;
  templateId?: string;
  template?: ProcessEntity;
  instanceIds?: string[];
  steps?: StepEntity[];
}

// Step entity representing a task in a process
export interface StepEntity extends BaseEntity {
  content: string;
  completed: boolean;
  order: number;
  dueDate?: string;
  processId?: string;
  eventId?: string;
  completedAt?: string;
  subSteps?: SubStepEntity[];
}

// SubStep entity representing a sub-task within a step
export interface SubStepEntity extends BaseEntity {
  content: string;
  completed: boolean;
  order: number;
  stepId: string;
  completedAt?: string;
}

// Post entity representing a social media post
export interface PostEntity extends BaseEntity {
  content: string;
  visibility?: 'public' | 'private' | 'team';
  authorId: string;
  eventId?: string;
}

// Media entity representing uploaded media files
export interface MediaEntity extends BaseEntity {
  type: string;
  title?: string;
  url: string;
  duration?: string;
  aspectRatio?: string;
  fileSize?: number;
  mimeType?: string;
  thumbnailUrl?: string;
  postId?: string;
  eventId?: string;
  createdById?: string;
}

// Mapping between events and topics
export interface EventTopicEntity {
  eventId: string;
  topicId: string;
}

// Participant in an event
export interface EventParticipantEntity {
  eventId: string;
  userId: string;
  role?: string;
  joinedAt: string;
  status?: string;
  user?: UserEntity;
}

// User preferences for application settings
export interface UserPreferencesEntity extends BaseEntity {
  userId: string;
  theme?: 'light' | 'dark' | 'system';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  timeZone?: string;
  language?: string;
  additionalSettings?: Record;
}

// Notification entity for user notifications
export interface NotificationEntity extends BaseEntity {
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  referenceId?: string;
  referenceType?: string;
  metadata?: Record;
  userId: string;
  senderId?: string;
  sender?: UserEntity;
}

// Status log entity for tracking event status changes
export interface StatusLogEntity extends BaseEntity {
  previousStatus?: string;
  newStatus: string;
  eventId: string;
  userId?: string;
  user?: UserEntity;
}

// Directory entity for organizing processes
export interface DirectoryEntity extends BaseEntity {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  metadata?: Record;
  createdById?: string;
  parentId?: string;
  processes?: ProcessEntity[];
  subdirectories?: DirectoryEntity[];
}
