/**
 * API Types - Manually defined types for the backend API
 *
 * This file contains manually defined types that match the backend API structure.
 * These types provide stability and control over the API interface.
 *
 * Note: All types use camelCase for consistency in the frontend codebase.
 * The API middleware handles conversion between snake_case (backend) and camelCase (frontend).
 *
 * Usage:
 * ```typescript
 * import type { components, paths } from '@/app/types/api-types';
 *
 * // Schema components
 * type User = components.schemas.UserRead;
 *
 * // API endpoints
 * type LoginRequest = paths.auth.LoginRequest;
 * ```
 */

// Common utility types
export type UUID = string;
export type DateTime = string;
export type ApiRecord<T = any> = { [key: string]: T };
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];
export type Record = { [key: string]: any };

// Planning types
export namespace plan {
  export interface PlanDirectory {
    id: UUID;
    name: string;
    description?: string;
    color: string;
    templates: PlanTemplate[];
  }

  export interface PlanTemplate {
    id: UUID;
    name: string;
    templateCount: number;
  }

  export interface PlanEvent {
    id: UUID;
    title: string;
    description: string;
    processId: UUID;
    startTime: DateTime;
    endTime: DateTime;
    effort: 'low' | 'medium' | 'high';
    status?: string;
  }

  export interface DirectoriesResponse {
    directories: PlanDirectory[];
  }
}

// Enums and basic types
export namespace enums {
  export type MediaTypeEnum = 'video' | 'image' | 'audio' | 'quote' | 'event';
  export type EventStatusEnum = 'Pending' | 'Planning' | 'Execution' | 'Review' | 'Administrative' | 'Done' | 'execution' | 'upcoming' | 'completed' | 'ready';
  export type ParticipantStatusEnum = 'invited' | 'confirmed' | 'declined' | 'attended';
  export type NotificationType = 'mention' | 'comment' | 'event_invite' | 'event_reminder' | 'event_update' | 'message' | 'system' | 'task';
  export type ColorType = 'blue' | 'purple' | 'pink' | 'yellow' | 'green' | 'orange' | 'teal' | 'indigo' | 'red' | 'emerald' | 'amber';
}

// User-related types
export namespace user {
  export interface UserRead {
    id: UUID;
    name: string;
    handle: string;
    email?: string;
    profileImage?: string;
    bio?: string;
    createdAt: DateTime;
    updatedAt?: DateTime;
    isAdmin?: boolean;
  }

  export interface UserCreate {
    name: string;
    handle: string;
    email: string;
    password: string;
    profileImage?: string;
    bio?: string;
  }

  export interface UserUpdate {
    name?: string;
    handle?: string;
    email?: string;
    profileImage?: string;
    bio?: string;
  }

  export interface UserPreferencesRead {
    id: UUID;
    userId: UUID;
    theme?: 'light' | 'dark' | 'system';
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    timeZone?: string;
    language?: string;
    additionalSettings?: Record;
    createdAt: DateTime;
    updatedAt?: DateTime;
  }

  export interface UserPreferencesUpdate {
    theme?: 'light' | 'dark' | 'system';
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    timeZone?: string;
    language?: string;
    additionalSettings?: Record;
  }
}

// Event-related types
export namespace event {
  export interface EventRead {
    id: UUID;
    title: string;
    description?: string;
    startTime: DateTime;
    endTime: DateTime;
    // Legacy fields kept for backwards compatibility
    date?: string;
    time?: string;
    duration?: string;
    status?: string;
    complexity?: number;
    color?: string;
    location?: string;
    recordingUrl?: string;
    metadata?: Record;
    createdById?: UUID;
    processId?: UUID;
    createdAt: DateTime;
    updatedAt?: DateTime;
    topics?: topic.TopicRead[];
    participants?: EventParticipantRead[];
    steps?: StepRead[];
  }

  export interface EventCreate {
    title: string;
    description?: string;
    startTime: DateTime;
    endTime: DateTime;
    // Legacy fields kept for backwards compatibility
    date?: string;
    time?: string;
    duration?: string;
    status?: string;
    complexity?: number;
    color?: string;
    location?: string;
    recordingUrl?: string;
    metadata?: Record;
    createdById?: UUID;
    processId?: UUID;
    topicIds?: UUID[];
    participantIds?: UUID[];
  }

  export interface EventParticipantRead {
    eventId: UUID;
    userId: UUID;
    role?: string;
    joinedAt: DateTime;
    status?: string;
    user?: user.UserRead;
  }

  export interface StepRead {
    id: UUID;
    content: string;
    completed: boolean;
    order: number;
    dueDate?: string;
    processId?: UUID;
    eventId?: UUID;
    createdAt: DateTime;
    updatedAt?: DateTime;
    completedAt?: DateTime;
    subSteps?: SubStepRead[];
  }

  export interface StepCreate {
    content: string;
    completed?: boolean;
    order: number;
    dueDate?: string;
    processId?: UUID;
    eventId?: UUID;
    subSteps?: SubStepCreate[];
  }

  export interface SubStepRead {
    id: UUID;
    content: string;
    completed: boolean;
    order: number;
    stepId: UUID;
    createdAt: DateTime;
    updatedAt?: DateTime;
    completedAt?: DateTime;
  }

  export interface SubStepCreate {
    content: string;
    completed?: boolean;
    order: number;
    stepId?: UUID;
  }
}

// Topic-related types
export namespace topic {
  export interface TopicRead {
    id: UUID;
    name: string;
    category?: string;
    color?: string;
    createdAt: DateTime;
    updatedAt?: DateTime;
  }

  export interface TopicCreate {
    name: string;
    category?: string;
    color?: string;
  }
}

// Process-related types
export namespace process {
  export interface ProcessRead {
    id: UUID;
    title: string;
    description?: string;
    color?: string;
    lastUpdated?: DateTime;
    favorite?: boolean;
    category?: string;
    metadata?: Record;
    isTemplate?: boolean;
    templateId?: UUID;
    createdById?: UUID;
    directoryId?: UUID;
    createdAt: DateTime;
    updatedAt?: DateTime;
    steps?: event.StepRead[];
    events?: event.EventRead[];
  }

  export interface ProcessCreate {
    title: string;
    description?: string;
    color?: string;
    favorite?: boolean;
    category?: string;
    metadata?: Record;
    isTemplate?: boolean;
    templateId?: UUID;
    directoryId?: UUID;
    steps?: event.StepCreate[];
  }
}

// Post-related types
export namespace post {
  export interface PostRead {
    id: UUID;
    content: string;
    visibility?: 'public' | 'private' | 'team';
    authorId: UUID;
    eventId?: UUID;
    createdAt: DateTime;
    updatedAt?: DateTime;
    author?: user.UserRead;
    media?: media.MediaRead[];
  }

  export interface PostCreate {
    content: string;
    visibility?: 'public' | 'private' | 'team';
    eventId?: UUID;
    mediaIds?: UUID[];
  }
}

// Media-related types
export namespace media {
  export interface MediaRead {
    id: UUID;
    type: string;
    title?: string;
    url: string;
    duration?: string;
    aspectRatio?: string;
    fileSize?: number;
    mimeType?: string;
    thumbnailUrl?: string;
    metadata?: Record;
    postId?: UUID;
    eventId?: UUID;
    createdById?: UUID;
    createdAt: DateTime;
    updatedAt?: DateTime;
  }

  export interface MediaCreate {
    type: string;
    title?: string;
    url: string;
    duration?: string;
    aspectRatio?: string;
    fileSize?: number;
    mimeType?: string;
    thumbnailUrl?: string;
    metadata?: Record;
    postId?: UUID;
    eventId?: UUID;
  }
}

// Notification-related types
export namespace notification {
  export interface NotificationRead {
    id: UUID;
    type: string;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    referenceId?: UUID;
    referenceType?: string;
    metadata?: Record;
    userId: UUID;
    senderId?: UUID;
    createdAt: DateTime;
    updatedAt?: DateTime;
    sender?: user.UserRead;
  }

  export interface NotificationCreate {
    type: string;
    title: string;
    message: string;
    link?: string;
    referenceId?: UUID;
    referenceType?: string;
    metadata?: Record;
    userId: UUID;
    senderId?: UUID;
  }
}

// Directory-related types
export namespace directory {
  export interface DirectoryRead {
    id: UUID;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    metadata?: Record;
    createdById?: UUID;
    parentId?: UUID;
    createdAt: DateTime;
    updatedAt?: DateTime;
    processes?: process.ProcessRead[];
    subdirectories?: DirectoryRead[];
  }

  export interface DirectoryCreate {
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    metadata?: Record;
    parentId?: UUID;
  }
}

// Status Log types
export namespace status {
  export interface StatusLogRead {
    id: UUID;
    previousStatus?: string;
    newStatus: string;
    eventId: UUID;
    userId?: UUID;
    createdAt: DateTime;
    updatedAt?: DateTime;
    user?: user.UserRead;
  }

  export interface StatusLogCreate {
    previousStatus?: string;
    newStatus: string;
    eventId: UUID;
  }
}

// Auth-related types
export namespace auth {
  export interface Token {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    user: user.UserRead;
  }

  export interface LoginRequest {
    email: string;
    password: string;
  }

  export interface SignupRequest {
    name: string;
    handle: string;
    email: string;
    password: string;
  }

  export interface LoginResponse {
    accessToken: string;
    tokenType: string;
    expiresIn: number;
    user: user.UserRead;
  }
}

// API Endpoint Response Types
export namespace endpoints {
  // User endpoints
  export namespace users {
    export interface GetUserResponse {
      user: user.UserRead;
    }

    export interface UpdateUserResponse {
      user: user.UserRead;
    }

    export interface GetUsersResponse {
      users: user.UserRead[];
      total: number;
      page: number;
      size: number;
    }
  }

  // Process endpoints
  export namespace processes {
    export interface GetProcessResponse {
      process: process.ProcessRead;
    }

    export interface CreateProcessResponse {
      process: process.ProcessRead;
    }

    export interface GetProcessesResponse {
      processes: process.ProcessRead[];
      total: number;
      page: number;
      size: number;
    }
  }

  // Event endpoints
  export namespace events {
    export interface GetEventResponse {
      event: event.EventRead;
    }

    export interface CreateEventResponse {
      event: event.EventRead;
    }

    export interface GetEventsResponse {
      events: event.EventRead[];
      total: number;
      page: number;
      size: number;
    }
  }

  // Directory endpoints
  export namespace directories {
    export interface GetDirectoryResponse {
      directory: directory.DirectoryRead;
    }

    export interface GetDirectoriesResponse {
      directories: directory.DirectoryRead[];
      total: number;
      page: number;
      size: number;
    }
  }

  // Notification endpoints
  export namespace notifications {
    export interface GetNotificationsResponse {
      notifications: notification.NotificationRead[];
      total: number;
      page: number;
      size: number;
    }
  }

  // Post endpoints
  export namespace posts {
    export interface GetPostsResponse {
      posts: post.PostRead[];
      total: number;
      page: number;
      size: number;
    }
  }

  // Plan endpoints
  export namespace plan {
    export interface GeneratePlanResponse {
      events: plan.PlanEvent[];
      summary?: string;
    }

    export interface SavePlanResponse {
      success: boolean;
      savedEvents: UUID[];
    }

    export interface GetDirectoriesResponse {
      directories: plan.PlanDirectory[];
    }
  }
}
