/**
 * User type definitions
 * Centralized user-related types
 */
import { components } from '../types/api-types';
import { ApiUserSchema, isApiUserSchema } from '../types/schema';

/**
 * User profile information
 * @see ApiUserSchema from schema/index.ts for the schema version
 * @see components.schemas.UserRead from api-types.ts for the API version
 */
export interface UserProfile {
  id: string;
  email: string;
  handle: string;
  name: string;
  profileImage?: string;
  bio?: string;
  isAdmin: boolean; // No longer optional - always set to true or false
}

/**
 * User credentials for login/signup
 */
export interface UserCredentials {
  email: string;
  password: string;
}

/**
 * Guest credentials with additional metadata
 */
export interface GuestCredentials extends UserCredentials {
  role?: string;
}

/**
 * User preferences
 * @see ApiUserPreferencesSchema from schema/index.ts
 */
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  timeZone?: string;
  language?: string;
}

/**
 * Transform a backend user to frontend user profile format
 *
 * @param user - Backend user data (components.schemas.UserRead or ApiUserSchema)
 * @returns Formatted frontend user profile
 */
export function transformUserData(user: any): UserProfile | null {
  if (!user) return null;

  // First, handle snake_case keys for consistency
  const normalizedUser = {
    id: user.id,
    name: user.name,
    handle: user.handle || user.username,
    email: user.email,
    profileImage: user.profileImage || user.profile_image,
    bio: user.bio,
    createdAt: user.createdAt || user.created_at,
    updatedAt: user.updatedAt || user.updated_at,
    isAdmin: user.isAdmin || user.is_admin,
  };

  // Validate required fields for UserProfile
  if (!normalizedUser.id || !normalizedUser.name || !normalizedUser.handle) {
    console.error('Invalid user data, missing required fields:', user);
    return null;
  }

  return {
    id: normalizedUser.id,
    email: normalizedUser.email || '',
    name: normalizedUser.name,
    handle: normalizedUser.handle,
    profileImage: normalizedUser.profileImage,
    bio: normalizedUser.bio || '',
    isAdmin: Boolean(normalizedUser.isAdmin || false),
  };
}
