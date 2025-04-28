/**
 * API Middleware for Axios using Zustand auth store
 * Handles authentication, token refresh, and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { camelizeKeys, decamelizeKeys } from 'humps';
import logger from '../lib/logger';
import { useAuthStore } from '../store/authStore';
import { processSpecialDataTypes } from './utils';

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Create an API client with authentication handling
 */
export function createApiClient(): AxiosInstance {
  // Track 401 errors to prevent infinite loops
  let consecutive401Count = 0;
  let last401Timestamp = 0;
  const MAX_CONSECUTIVE_401 = 3;
  const RESET_401_TIMEOUT = 30000; // 30 seconds

  // Create axios instance
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor for authentication
  instance.interceptors.request.use(
    async (config) => {
      // Check for logout in progress and cancel request if needed
      if (typeof window !== 'undefined' && (window as any).__AUTH_LOGOUT_IN_PROGRESS) {
        // Cancel the request - create a cancelled request error
        const cancelError = new Error('Request cancelled - logout in progress');
        (cancelError as any).isCancelled = true;
        return Promise.reject(cancelError);
      }

      // Skip auth for login/token/refresh requests based on URL
      const isAuthEndpoint = config.url?.includes('/auth/token') || config.url?.includes('/auth/login') || config.url?.includes('/auth/refresh');

      if (isAuthEndpoint) {
        return config;
      }

      if (config.headers) {
        try {
          // BREAKING THE CIRCULAR DEPENDENCY:
          // We will NOT access the auth store methods directly, only its state
          // This prevents triggering computations that might cause more API calls

          // Direct access to localStorage for critical /users/me endpoint
          if (config.url?.includes('/users/me')) {
            const token = localStorage.getItem('auth_token');
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          }
          // For token refresh endpoint, use localStorage directly
          else if (config.url?.includes('/auth/refresh')) {
            const token = localStorage.getItem('auth_token');
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          }
          // For regular endpoints, use the current token from store state
          else {
            const token = useAuthStore.getState().token;
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          }
        } catch (error) {
          logger.error('Error in request interceptor:', error);
        }
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // Response interceptor for error handling and data processing
  instance.interceptors.response.use(
    (response) => {
      // Process special data types in all responses
      if (response.data) {
        // First convert from snake_case to camelCase if it's an object
        if (typeof response.data === 'object') {
          response.data = camelizeKeys(response.data);
        }

        // Then process special data types (UUID, MetaData)
        response.data = processSpecialDataTypes(response.data);
      }

      // Reset 401 counter on successful responses
      if (consecutive401Count > 0) {
        consecutive401Count = 0;
      }

      return response;
    },
    async (error) => {
      // Process special data types in error responses too
      if (error.response?.data) {
        // First convert from snake_case to camelCase if it's an object
        if (typeof error.response.data === 'object') {
          error.response.data = camelizeKeys(error.response.data);
        }

        // Then process special data types (UUID, MetaData)
        error.response.data = processSpecialDataTypes(error.response.data);
      }

      // Handle authentication errors with improved loop detection
      if (error.response?.status === 401) {
        const currentTime = Date.now();
        const url = error.config?.url || '';
        const isAuthEndpoint = url.includes('/auth/token') || url.includes('/auth/login') || url.includes('/auth/refresh');

        // Don't count auth endpoint 401s toward our loop detection
        if (!isAuthEndpoint) {
          // Reset counter if it's been a while since the last 401
          if (currentTime - last401Timestamp > RESET_401_TIMEOUT) {
            consecutive401Count = 0;
          }

          // Update count and timestamp
          consecutive401Count++;
          last401Timestamp = currentTime;

          // Log with more context
          logger.warn(`Authentication error (${consecutive401Count}/${MAX_CONSECUTIVE_401}) for ${url} - token might be invalid`);

          // If we have too many consecutive 401s, trigger a centralized logout to prevent infinite loops
          if (consecutive401Count >= MAX_CONSECUTIVE_401) {
            logger.error('Too many consecutive auth errors detected - triggering centralized logout');
            useAuthStore.getState().logout();
            consecutive401Count = 0; // Reset after clearing

            // If this is a loop with /users/me endpoint, log a special warning
            if (url.includes('/users/me')) {
              logger.error('Detected auth loop with /users/me endpoint - this might indicate a deeper authentication issue');
            }
          }
          // Don't log out on every 401 anymore, only after multiple consecutive 401s
          // This prevents logout being called multiple times when multiple requests fail at once
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
}

// Simple queue for managing requests (without rate limiting)
export const requestQueue = {
  // Handle request immediately
  enqueue(request: () => void, highPriority: boolean = false): void {
    request();
  },
  
  // No-op for dequeue since we're not tracking active requests
  dequeue(): void {
    // Empty implementation
  },
  
  // No-op for rate limit tracking
  recordRateLimitHit(resetTimeSeconds?: number): void {
    // Empty implementation
  }
};

// Create and export a singleton instance
export const apiClient = createApiClient();
