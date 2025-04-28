/**
 * Settings Service for managing user settings
 * Provides methods for fetching and updating user profile, preferences, and security settings
 * This service uses Axios for API requests
 */

import { ApiClient, ApiResult } from './api';

/**
 * User profile type that matches the backend UserOut schema
 */
export interface UserProfileSettings {
  id?: string;
  name: string;
  email: string;
  handle: string;
  bio?: string;
  profileImage?: string;
  user_metadata?: Record; // Backend field for additional user data
  metadata?: Record; // Alias for user_metadata in API responses
  isGuest?: boolean;
  guestRole?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * User preferences type that matches the backend UserPreferencesOut schema
 */
export interface UserPreferences {
  id?: string;
  userId?: string;
  theme: string;
  emailNotifications: boolean;
  pushNotifications?: boolean;
  timeZone: string;
  language: string;
  additionalSettings?: {
    sidebar_collapsed?: boolean;
    default_view?: string;
    notification_settings?: {
      event_reminders?: boolean;
      mention_alerts?: boolean;
      team_updates?: boolean;
    };
    twoFactorEnabled?: boolean;
    privacyMode?: boolean;
    sessionTimeout?: string;
    display_preferences?: {
      dense_mode?: boolean;
      show_avatars?: boolean;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Combined settings type for the frontend
 */
export interface UserSettings {
  profile: UserProfileSettings;
  preferences: UserPreferences;
}

/**
 * User update data type that matches the backend UserUpdate schema
 */
export interface UserUpdateData {
  name?: string;
  email?: string;
  handle?: string;
  bio?: string;
  profile_image?: string;
  user_metadata?: Record;
}

/**
 * Preferences update data type that matches the backend UserPreferencesUpdate schema
 */
export interface PreferencesUpdateData {
  theme?: string;
  email_notifications?: boolean;
  time_zone?: string;
  language?: string;
  additional_settings?: Record;
}

/**
 * Password change request type that matches the backend PasswordChangeRequest schema
 */
export interface PasswordChangeRequest {
  current_password: string;
  new_password: string;
}

/**
 * Settings Service class for handling all settings-related API calls
 */
export class SettingsService {
  /**
   * Get all user settings including profile and preferences
   */
  static async getAllSettings(): Promise {
    return ApiClient.get<UserSettings>('/settings');
  }

  /**
   * Get user profile settings
   */
  static async getProfileSettings(): Promise {
    // Use /users/me endpoint to get profile
    return ApiClient.get<UserProfileSettings>('/users/me');
  }

  /**
   * Update user profile settings
   */
  static async updateProfileSettings(profile: Partial): Promise {
    return ApiClient.put<UserProfileSettings>('/users/me', profile);
  }

  /**
   * Get user preferences
   */
  static async getPreferences(): Promise {
    return ApiClient.get<UserPreferences>('/users/me/preferences');
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(preferences: Partial): Promise {
    return ApiClient.put<UserPreferences>('/users/me/preferences', preferences);
  }

  /**
   * Change user password
   */
  static async changePassword(passwordData: PasswordChangeRequest): Promise {
    return ApiClient.post<{ message: string }>('/settings/change-password', {
      current_password: passwordData.current_password,
      new_password: passwordData.new_password,
    });
  }

  /**
   * Upload profile picture
   */
  static async uploadProfilePicture(file: File): Promise {
    const formData = new FormData();
    formData.append('file', file);

    return ApiClient.uploadFile<{ profileImage: string }>('/media/upload/profile', formData);
  }
}
