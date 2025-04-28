/**
 * User service for handling user-related operations
 * Updated to use Axios with Zustand auth store
 */

import { ApiUserPreferencesSchema, ApiUserSchema } from '@/app/types/schema';
import logger from '../lib/logger';
import { useAuthStore } from '../store/authStore';
import { apiClient } from './apiMiddleware';
import { buildParams } from './utils';

/**
 * Interface for API results
 */
export interface ApiResult<T> {
  data?: T;
  error?: string;
  status: number;
  originalError?: any;
}

/**
 * Interface for user update data
 * @see components.schemas.UserUpdate from api-types.ts
 */
export interface UserUpdateData {
  name?: string;
  email?: string;
  handle?: string;
  bio?: string;
  profileImage?: string;
  password?: string;
}

/**
 * Interface for user preferences update data
 * @see components.schemas.UserPreferencesUpdate from api-types.ts
 */
export interface UserPreferencesUpdateData {
  theme?: 'light' | 'dark' | 'system';
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  timeZone?: string;
  language?: string;
  additionalSettings?: Record;
}

/**
 * Helper to process API responses consistently
 */
function processApiResponse<T>(response: any): ApiResult {
  return {
    data: response.data,
    status: response.status,
  };
}

/**
 * Helper to handle API errors consistently
 */
function handleApiError<T>(error: any): ApiResult {
  if (error.response) {
    // Server responded with an error status
    return {
      error: error.response.data?.detail || 'Server error',
      status: error.response.status,
      originalError: error,
    };
  } else if (error.request) {
    // Request was made but no response received
    return {
      error: 'No response from server',
      status: 0,
      originalError: error,
    };
  } else {
    // Something else went wrong
    return {
      error: error.message || 'Unknown error',
      status: 0,
      originalError: error,
    };
  }
}

/**
 * Service for user-related operations using Axios with Zustand
 */
export class UserService {
  /**
   * Get current user profile
   * First tries to get from Zustand store for efficiency
   * @returns Promise with API result containing user data
   */
  static async getCurrentUser(): Promise {
    try {
      // Check if we already have user data in the store
      const currentUser = useAuthStore.getState().currentUser;

      // If we have a current user in the store and no force refresh,
      // return it without making an API call to avoid loops
      if (currentUser) {
        return {
          data: currentUser as ApiUserSchema,
          status: 200,
        };
      }

      // IMPORTANT: If no token exists, don't make the API call
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          return {
            error: 'No authentication token available',
            status: 401,
          };
        }
      }

      // If no data in store but we have a token, make API call
      // Use a direct axios call to avoid triggering interceptors that might cause loops

      // Using the API types directly
      const response = await apiClient.get<ApiUserSchema>('/users/me');

      // Log the user profile data for debugging
      logger.debug(`[Auth] /users/me API response: ${JSON.stringify(response.data, null, 2)}`);

      // Update store with user data
      if (response.data) {
        // Use setState to avoid triggering getters/methods
        useAuthStore.setState({ currentUser: response.data });
        logger.debug(`[Auth] Updated currentUser in store`);
      }

      return processApiResponse<ApiUserSchema>(response);
    } catch (error) {
      return handleApiError<ApiUserSchema>(error);
    }
  }

  /**
   * Get a user by ID
   * @param userId - User ID
   * @returns Promise with API result containing user data
   */
  static async getUserById(userId: string): Promise {
    try {
      const response = await apiClient.get<ApiUserSchema>(`/users/${userId}`);
      return processApiResponse<ApiUserSchema>(response);
    } catch (error) {
      return handleApiError<ApiUserSchema>(error);
    }
  }

  /**
   * Get a user by handle
   * @param handle - User handle
   * @returns Promise with API result containing user data
   */
  static async getUserByHandle(handle: string): Promise {
    try {
      const response = await apiClient.get<ApiUserSchema>(`/users/handle/${handle}`);
      return processApiResponse<ApiUserSchema>(response);
    } catch (error) {
      return handleApiError<ApiUserSchema>(error);
    }
  }

  /**
   * Search for users
   * @param query - Search query (optional)
   * @param limit - Maximum number of results (default: 20)
   * @param offset - Pagination offset (default: 0)
   * @returns Promise with API result containing user data array
   */
  static async searchUsers(query?: string, limit: number = 20, offset: number = 0): Promise {
    try {
      // Build query params
      const params = buildParams({ query, limit, offset });

      const response = await apiClient.get<ApiUserSchema[]>('/users', { params });
      return processApiResponse<ApiUserSchema[]>(response);
    } catch (error) {
      return handleApiError<ApiUserSchema[]>(error);
    }
  }

  /**
   * Update current user profile
   * @param userData - User data to update
   * @returns Promise with API result containing updated user data
   */
  static async updateCurrentUser(userData: UserUpdateData): Promise {
    try {
      const response = await apiClient.put<ApiUserSchema>('/users/me', userData);

      // Update user in store if update was successful
      if (response.data) {
        useAuthStore.getState().setCurrentUser(response.data);
      }

      return processApiResponse<ApiUserSchema>(response);
    } catch (error) {
      return handleApiError<ApiUserSchema>(error);
    }
  }

  /**
   * Get current user preferences
   * @returns Promise with API result containing user preferences
   */
  static async getUserPreferences(): Promise {
    try {
      const response = await apiClient.get<ApiUserPreferencesSchema>('/users/me/preferences');
      return processApiResponse<ApiUserPreferencesSchema>(response);
    } catch (error) {
      return handleApiError<ApiUserPreferencesSchema>(error);
    }
  }

  /**
   * Update user preferences
   * @param preferencesData - Preferences data to update
   * @returns Promise with API result containing updated preferences
   */
  static async updateUserPreferences(preferencesData: UserPreferencesUpdateData): Promise {
    try {
      const response = await apiClient.put<ApiUserPreferencesSchema>('/users/me/preferences', preferencesData);
      return processApiResponse<ApiUserPreferencesSchema>(response);
    } catch (error) {
      return handleApiError<ApiUserPreferencesSchema>(error);
    }
  }

  /**
   * Request password reset
   * @param email - User email
   * @returns Promise with API result
   */
  static async requestPasswordReset(email: string): Promise {
    try {
      const response = await apiClient.post('/users/reset-password/request', { email });
      return processApiResponse<{ message: string }>(response);
    } catch (error) {
      return handleApiError<{ message: string }>(error);
    }
  }

  /**
   * Confirm password reset
   * @param token - Reset token
   * @param newPassword - New password
   * @returns Promise with API result
   */
  static async confirmPasswordReset(token: string, newPassword: string): Promise {
    try {
      const response = await apiClient.post('/users/reset-password/confirm', {
        token,
        newPassword, // Using camelCase
      });
      return processApiResponse<{ message: string }>(response);
    } catch (error) {
      return handleApiError<{ message: string }>(error);
    }
  }

  /**
   * Upload profile image
   * @param file - Image file to upload
   * @returns Promise with API result containing URL of uploaded image
   */
  static async uploadProfileImage(file: File): Promise {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // For demo purposes, our backend upload URL might be at media/upload/profile
      const response = await apiClient.post('/media/upload/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Log the response for debugging
      console.log('Profile image upload response:', response.data);

      return processApiResponse<{ url: string }>(response);
    } catch (error) {
      console.error('Profile image upload error:', error);
      return handleApiError<{ url: string }>(error);
    }
  }
}
