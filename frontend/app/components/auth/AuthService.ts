'use client';

import { UserProfile } from '@/app/types/user';
import { getAuthToken, isAuthenticated, logoutUser } from '@/app/services/authService';
import { IAuthService } from './types';

// Prefix all keys to avoid collisions with other apps
const KEY_PREFIX = 'convers_me_';

// Keys for localStorage (using localStorage instead of cookies for simplicity)
const USER_KEY = `${KEY_PREFIX}user`;

/**
 * Authentication service using localStorage for persistent auth state
 * In a production app, this would use secure HTTP-only cookies and a proper backend
 */
export const AuthService: IAuthService = {
  /**
   * Login the user - store auth data in localStorage
   * @param user - User profile to store
   */
  login: (user: UserProfile): void => {
    if (typeof window === 'undefined') return;

    try {
      // Remove sensitive data if present
      const safeUserData = { ...user };
      delete (safeUserData as any).password;
      delete (safeUserData as any).token;

      // Store user data
      localStorage.setItem(USER_KEY, JSON.stringify(safeUserData));

      // Store email for mock auth fallback
      localStorage.setItem('last_login_email', user.email);
    } catch (error) {
      // Handle storage errors silently but securely
      console.error('Error saving authentication data');
    }
  },

  /**
   * Log out the user - clear auth data from localStorage
   */
  logout: (): void => {
    if (typeof window === 'undefined') return;

    try {
      // Call the centralized auth store logout function via logoutUser
      // which will handle all token and localStorage clearing
      logoutUser();
    } catch (error) {
      // Handle errors silently
      console.error('Error during logout', error);
    }
  },

  /**
   * Check if user is authenticated
   * @returns Boolean indicating authentication status
   */
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;

    try {
      return isAuthenticated();
    } catch (error) {
      // If we can't access localStorage, the user isn't authenticated
      return false;
    }
  },

  /**
   * Get current user from localStorage
   * @returns User profile or null if not found/invalid
   */
  getUser: (): UserProfile | null => {
    if (typeof window === 'undefined') return null;

    // First check if user is authenticated
    if (!isAuthenticated()) return null;

    try {
      const userData = localStorage.getItem(USER_KEY);
      if (!userData) return null;

      const user = JSON.parse(userData) as UserProfile;

      // Validate user data structure
      if (!user.id || !user.email) {
        // Invalid user data, clear it
        localStorage.removeItem(USER_KEY);
        return null;
      }

      return user;
    } catch (error) {
      // Clear invalid data
      localStorage.removeItem(USER_KEY);
      return null;
    }
  },

  /**
   * Get the current authentication token
   * @returns The current token or null if not authenticated
   */
  getToken: (): string | null => {
    return getAuthToken();
  },
};
