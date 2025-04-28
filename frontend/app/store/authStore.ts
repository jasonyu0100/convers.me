/**
 * Authentication store using Zustand
 * Centralized state management for authentication to prevent circular dependencies
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import logger from '../lib/logger';
import axios from 'axios';
import { getTokenExpiry, isTokenExpired, maskToken, willExpireSoon } from '../lib/jwt';
import { UserProfile } from '../types/user';

// API environment constants
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Auth store state interface
interface AuthState {
  // Authentication state
  isAuthenticated: boolean;
  token: string | null;
  tokenExpiresAt: number | null;
  currentUser: UserProfile | null;

  // Guest credentials
  guestCredentials: { email: string; password: string } | null;

  // Auth operation states
  isRefreshing: boolean;
  refreshPromise: Promise | null;
  lastRefreshTime: number;
  failedAttempts: number;
  lastError: string | null;

  // Actions
  login: (token: string, expiresIn: number, user: UserProfile) => void;
  logout: () => void;
  setCurrentUser: (user: UserProfile | null) => void;
  refreshToken: () => Promise;
  getToken: () => Promise;

  // Guest credentials actions
  setGuestCredentials: (credentials: { email: string; password: string } | null) => void;
}

/**
 * Create auth store with persistence
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      token: null,
      tokenExpiresAt: null,
      currentUser: null,
      guestCredentials: null,

      // Auth operation states
      isRefreshing: false,
      refreshPromise: null,
      lastRefreshTime: 0,
      failedAttempts: 0,
      lastError: null,

      // Set guest credentials
      setGuestCredentials: (credentials) => {
        set({ guestCredentials: credentials });
      },

      /**
       * Login action - store token and user info
       */
      login: (token: string, expiresIn: number, user: UserProfile) => {
        // Calculate expiration timestamp
        const expiresAt = Date.now() + expiresIn * 1000;

        // Update token in localStorage for compatibility with existing code
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
        }

        set({
          token,
          tokenExpiresAt: expiresAt,
          currentUser: user,
          isAuthenticated: true,
          failedAttempts: 0,
          lastError: null,
        });

        logger.info('User logged in successfully');
      },

      /**
       * Logout action - clear all auth state
       */
      logout: () => {
        // Log that we're starting the logout process (for debugging)
        logger.info('Starting centralized logout process');

        // Cancel any in-flight requests by setting a flag in window
        if (typeof window !== 'undefined') {
          // Set a global cancellation signal that API middleware can check
          (window as any).__AUTH_LOGOUT_IN_PROGRESS = true;

          // Remove token, user ID, and other auth data from localStorage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('userId');
          localStorage.removeItem('convers_me_user');

          // Clean up any other auth-related localStorage items
          Object.keys(localStorage).forEach((key) => {
            if (key.startsWith('convers-me-') || key.startsWith('convers_me_')) {
              localStorage.removeItem(key);
            }
          });

          // Schedule removal of the cancellation flag after logout is complete
          setTimeout(() => {
            (window as any).__AUTH_LOGOUT_IN_PROGRESS = false;
          }, 500);
        }

        // Clear all state in the store
        set({
          token: null,
          tokenExpiresAt: null,
          currentUser: null,
          isAuthenticated: false,
          isRefreshing: false,
          refreshPromise: null,
          lastError: null,
        });

        logger.info('User logged out successfully');
      },

      /**
       * Set current user data
       */
      setCurrentUser: (user: UserProfile | null) => {
        set({ currentUser: user });
      },

      /**
       * Refresh the auth token
       * Returns the new token or null if refresh failed
       */
      refreshToken: async (): Promise => {
        const state = get();

        // If we're already refreshing, return the existing promise
        if (state.isRefreshing && state.refreshPromise) {
          return state.refreshPromise;
        }

        // Check if we've tried to refresh too recently (30 seconds)
        const now = Date.now();
        if (now - state.lastRefreshTime < 30000) {
          // Return current token if it exists
          return state.token;
        }

        // Start refreshing - create a refresh promise
        set({
          isRefreshing: true,
          lastRefreshTime: now,
        });

        // Create refresh promise
        const refreshPromise = new Promise<string | null>(async (resolve) => {
          try {
            // If no token exists, resolve with null
            if (!state.token) {
              set({
                isRefreshing: false,
                lastError: 'No token available for refresh',
              });
              resolve(null);
              return;
            }

            // Create standalone axios instance for token refresh
            const refreshAxios = axios.create({
              baseURL: API_BASE_URL,
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${state.token}`,
              },
              timeout: 5000,
            });

            // Call token refresh endpoint
            const response = await refreshAxios.post('/auth/refresh');

            if (response.status >= 200 && response.status < 300 && response.data?.accessToken) {
              // Get new token and expiration
              const newToken = response.data.accessToken;

              // Get expiration from token or use a default (1 hour)
              const tokenExp = getTokenExpiry(newToken) || Date.now() + 60 * 60 * 1000;

              // Update localStorage for compatibility
              if (typeof window !== 'undefined') {
                localStorage.setItem('auth_token', newToken);
              }

              // Update state
              set({
                token: newToken,
                tokenExpiresAt: tokenExp,
                isAuthenticated: true,
                failedAttempts: 0,
                lastError: null,
              });

              resolve(newToken);
            } else {
              // Failed to refresh
              set((state) => ({
                failedAttempts: state.failedAttempts + 1,
                lastError: 'Token refresh failed - invalid response',
              }));

              // If too many failed attempts, logout
              if (get().failedAttempts >= 3) {
                get().logout();
              }

              resolve(null);
            }
          } catch (error) {
            // Log error
            if (axios.isAxiosError(error)) {
              logger.error(`Token refresh failed with status ${error.response?.status || 'unknown'}:`, error.message);
              set((state) => ({
                failedAttempts: state.failedAttempts + 1,
                lastError: `Token refresh failed: ${error.message}`,
              }));
            } else {
              logger.error('Token refresh failed with unexpected error:', error);
              set((state) => ({
                failedAttempts: state.failedAttempts + 1,
                lastError: 'Unexpected error during token refresh',
              }));
            }

            // If too many failed attempts, logout
            if (get().failedAttempts >= 3) {
              get().logout();
            }

            resolve(null);
          } finally {
            // Reset refreshing state
            set({ isRefreshing: false, refreshPromise: null });
          }
        });

        // Store the promise in state
        set({ refreshPromise });

        return refreshPromise;
      },

      /**
       * Get a valid token, with special handling to avoid circular dependencies
       * This is the main method that should be used by API services
       */
      getToken: async (): Promise => {
        const state = get();

        // If no token exists, return null
        if (!state.token) {
          return null;
        }

        // IMPORTANT: Check the call stack to detect potential circular dependencies
        // This helps us avoid refresh loops that could overwhelm the API
        const callStack = new Error().stack || '';
        const isUsersMeCall = callStack.includes('/users/me');
        const isAuthRefreshCall = callStack.includes('/auth/refresh');

        // For critical paths that may cause loops, return the current token immediately
        if (isUsersMeCall || isAuthRefreshCall) {
          return state.token;
        }

        // For normal paths, handle token refresh as needed
        if (isTokenExpired(state.tokenExpiresAt)) {
          logger.info('Token expired, refreshing...');
          return await get().refreshToken();
        }

        // If token will expire soon but not for critical auth paths
        if (willExpireSoon(state.tokenExpiresAt)) {
          // Don't await - start refresh in background with setTimeout
          // This prevents blocking the current execution context
          setTimeout(() => {
            get()
              .refreshToken()
              .catch((err) => logger.error('Background token refresh failed:', err));
          }, 100);
        }

        // Return the current token
        return state.token;
      },
    }),
    {
      name: 'convers-me-auth',
      partialize: (state) => {
        // Filter which parts of the store will be persisted
        const persistedState = {
          token: state.token,
          tokenExpiresAt: state.tokenExpiresAt,
          currentUser: state.currentUser,
          isAuthenticated: state.isAuthenticated,
          guestCredentials: state.guestCredentials,
        };

        return persistedState;
      },
    },
  ),
);

// initializeAuthFromStorage has been removed - use initializeAuth from lib/authInit.ts instead
