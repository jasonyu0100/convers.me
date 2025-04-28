'use client';

import { useAuthStore } from '../store/authStore';
import { UserService } from '../services/userService';
import { useCallback, useEffect } from 'react';
import logger from '../lib/logger';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthResult {
  success: boolean;
  error?: string;
}

/**
 * Hook for authentication using Zustand auth store
 */
export function useAuth() {
  const { isAuthenticated, currentUser, token, login: storeLogin, logout: storeLogout, refreshToken } = useAuthStore();

  /**
   * Parse JWT token to get expiration time in seconds
   */
  const getTokenExpiration = useCallback((token: string): number => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      return payload.exp ? payload.exp - Math.floor(Date.now() / 1000) : 3600; // Default 1 hour
    } catch (error) {
      logger.error('Error parsing JWT token:', error);
      return 3600; // Default to 1 hour if parsing fails
    }
  }, []);

  /**
   * Login with email and password
   */
  const login = useCallback(
    async (credentials: LoginCredentials): Promise => {
      try {
        // Create form data for token request
        const formData = new URLSearchParams();
        formData.append('username', credentials.email);
        formData.append('password', credentials.password);

        // Request token
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        if (!response.ok) {
          return {
            success: false,
            error: response.status === 401 ? 'Invalid email or password' : 'Authentication failed',
          };
        }

        // Get token
        const data = await response.json();
        const token = data.accessToken || data.access_token;

        if (!token) {
          return { success: false, error: 'Invalid token response' };
        }

        // Get expiration time
        const expiresIn = getTokenExpiration(token);

        // Get user data
        const userResult = await UserService.getCurrentUser();

        if (userResult.error || !userResult.data) {
          return { success: false, error: 'Failed to fetch user profile' };
        }

        // Store in Zustand
        storeLogin(token, expiresIn, userResult.data);

        return { success: true };
      } catch (error) {
        logger.error('Login error:', error);
        return { success: false, error: 'An error occurred during login' };
      }
    },
    [getTokenExpiration, storeLogin],
  );

  /**
   * Logout the current user
   */
  const logout = useCallback(() => {
    // Set cancellation flag to cancel any in-flight API requests
    if (typeof window !== 'undefined') {
      (window as any).__AUTH_LOGOUT_IN_PROGRESS = true;
    }

    // Call the centralized logout function
    storeLogout();

    // Clear cancellation flag after a short delay
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        (window as any).__AUTH_LOGOUT_IN_PROGRESS = false;
      }, 500);
    }
  }, [storeLogout]);

  /**
   * Initialize auth on component mount
   */
  useEffect(() => {
    // If not authenticated but token exists in localStorage, try to restore
    if (!isAuthenticated && typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('auth_token');

      if (storedToken && !currentUser) {
        // Get user data
        UserService.getCurrentUser()
          .then((result) => {
            if (result.data) {
              // Calculate expiration
              const expiresIn = getTokenExpiration(storedToken);
              // Store in Zustand
              storeLogin(storedToken, expiresIn, result.data);
            }
          })
          .catch((error) => {
            logger.error('Error restoring auth from token:', error);
            // Clear invalid token
            localStorage.removeItem('auth_token');
          });
      }
    }
  }, [isAuthenticated, currentUser, getTokenExpiration, storeLogin]);

  return {
    isAuthenticated,
    currentUser,
    token,
    login,
    logout,
    refreshToken,
  };
}
