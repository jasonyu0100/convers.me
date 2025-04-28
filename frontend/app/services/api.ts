/**
 * API Client for interacting with the backend
 * This service handles all API calls to the backend server using Axios
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { camelizeKeys, decamelizeKeys } from 'humps';
import logger from '../lib/logger';
import { createAppError, ErrorType, statusCodeToErrorType, AppError } from '../lib/errorHandler';
import { ApiRecord } from '../types/schema';

// API endpoint base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Result type for API operations
 */
export interface ApiResult<T> {
  data?: T;
  error?: string;
  status: number;
  originalError?: any;
}

/**
 * Simplified API response used in service layers
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Configuration for API requests
 */
export interface ApiRequestConfig {
  headers?: Record;
  useAuth?: boolean;
  formData?: boolean;
  params?: Record;
  skipConversion?: boolean; // Skip automatic camelCase to snake_case conversion
}

/**
 * Common pagination parameters
 */
export interface PaginationParams {
  skip?: number;
  limit?: number;
}

/**
 * Common filtering parameters
 */
export interface FilterParams {
  [key: string]: any;
}

/**
 * Build clean params object, filtering out undefined values
 * @param params - Object with parameters
 * @returns Clean params object with all undefined values removed
 */
export function buildParams<T extends Record>(params: T): Partial {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial);
}

/**
 * Get authentication token from localStorage
 * Includes basic token validation to avoid using expired tokens
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem('auth_token');

  // If no token found, return null
  if (!token) {
    return null;
  }

  try {
    // Basic check for JWT token expiration
    // JWT tokens have three parts separated by dots
    const parts = token.split('.');
    if (parts.length === 3) {
      // The middle part contains the payload, which includes the expiration time
      const payload = JSON.parse(atob(parts[1]));

      // Check if token has an expiration time and if it's expired
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        logger.warn('Auth token has expired, clearing from localStorage');
        localStorage.removeItem('auth_token');
        return null;
      }
    }

    return token;
  } catch (error) {
    logger.error('Error validating JWT token:', error);
    return token; // Return the token anyway, let the server decide if it's valid
  }
};

/**
 * Token refresh state to prevent multiple simultaneous refresh attempts
 */
interface TokenRefreshState {
  isRefreshing: boolean;
  refreshPromise: Promise | null;
  lastRefreshTime: number;
  failedAttempts: number;
}

// Global state for token refresh
const tokenState: TokenRefreshState = {
  isRefreshing: false,
  refreshPromise: null,
  lastRefreshTime: 0,
  failedAttempts: 0,
};

/**
 * Check if a JWT token is expired
 * @param token JWT token to check
 * @returns boolean indicating if token is expired or about to expire
 */
const isTokenExpired = (token: string): boolean => {
  try {
    // Check if token is a valid JWT format (has 3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      logger.warn('Invalid token format - not a proper JWT');
      return true; // Consider invalid tokens as expired
    }

    // For JWT tokens - decode and check exp claim
    const base64Url = parts[1]; // Get the payload part
    if (!base64Url) {
      logger.warn('Invalid token format - missing payload');
      return true;
    }

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const { exp } = JSON.parse(jsonPayload);

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    return !exp || exp <= now;
  } catch (e) {
    logger.error('Error checking token expiration:', e);
    return true; // If we can't parse the token, consider it expired
  }
};

/**
 * Check if a token will expire soon (within the next 2 minutes)
 * This is used to determine if we should proactively refresh
 */
const willExpireSoon = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const base64Url = parts[1];
    if (!base64Url) return false;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const { exp } = JSON.parse(jsonPayload);

    // Will expire in next 2 minutes
    const now = Math.floor(Date.now() / 1000);
    return exp && exp > now && exp < now + 120; // 120 seconds = 2 minutes
  } catch (e) {
    return false; // Error checking - don't trigger refresh
  }
};

/**
 * Refresh the authentication token
 * @returns Promise resolving to the new token or null if refresh failed
 */
const refreshAuthToken = async (currentToken: string): Promise => {
  try {
    // Use a standalone axios instance for refresh to avoid interceptors
    const refreshAxios = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${currentToken}`,
      },
      // Short timeout to avoid hanging
      timeout: 5000,
    });

    const response = await refreshAxios.post('/auth/refresh');

    if (response.status >= 200 && response.status < 300 && response.data?.accessToken) {
      // Reset failed attempts on success
      tokenState.failedAttempts = 0;

      // Store new token
      const newToken = response.data.accessToken;
      localStorage.setItem('auth_token', newToken);
      return newToken;
    } else {
      // If refresh returned an unexpected response
      logger.error('Token refresh received invalid response', response.status);
      tokenState.failedAttempts++;
      return null;
    }
  } catch (error) {
    // Increment failed attempts
    tokenState.failedAttempts++;

    // Log the error without exposing too much data
    if (axios.isAxiosError(error)) {
      logger.error(`Token refresh failed with status ${error.response?.status || 'unknown'}:`, error.message);
    } else {
      logger.error('Token refresh failed:', error);
    }

    // Clear tokens on too many failures
    if (tokenState.failedAttempts >= 3) {
      localStorage.removeItem('auth_token');
      return null;
    }

    return currentToken; // Return original token as fallback
  }
};

/**
 * Check token expiration and refresh if needed
 * Implements debouncing and prevents concurrent refresh attempts
 */
const checkAndRefreshToken = async (): Promise => {
  if (typeof window === 'undefined') {
    return null;
  }

  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  // Check if token is expired
  const expired = isTokenExpired(token);
  const expiringSoon = willExpireSoon(token);

  // Don't refresh if not expired or expiring soon
  if (!expired && !expiringSoon) {
    return token;
  }

  // If already expired (not just expiring soon), clear it
  if (expired) {
    logger.warn('Token is expired, clearing');
    localStorage.removeItem('auth_token');
    return null;
  }

  // Check for active refresh
  if (tokenState.isRefreshing) {
    // Use the existing refresh promise
    return tokenState.refreshPromise;
  }

  // Check for minimum interval between refreshes (30 seconds)
  const now = Date.now();
  if (now - tokenState.lastRefreshTime < 30000) {
    // Too soon to refresh again, use current token
    return token;
  }

  // Set up refresh state
  tokenState.isRefreshing = true;
  tokenState.lastRefreshTime = now;

  // Create a new refresh promise
  tokenState.refreshPromise = refreshAuthToken(token).finally(() => {
    // Reset refresh state when done
    tokenState.isRefreshing = false;
    tokenState.refreshPromise = null;
  });

  // Return the refresh promise
  return tokenState.refreshPromise;
};

/**
 * Process special data types in API responses (UUID and MetaData)
 * @param data - The data to process
 * @returns The processed data with UUIDs and MetaData converted to strings
 */
export function processSpecialDataTypes(data: any): any {
  if (!data) return data;

  // If it's a UUID object directly, convert to string
  if (data && typeof data === 'object' && data.constructor && data.constructor.name === 'UUID') {
    return data.toString();
  }

  // If it's a UUID object representation, extract the hex value
  if (data && typeof data === 'object' && data.__class__ === 'UUID' && data.hex) {
    return data.hex;
  }

  // If it's a MetaData object directly, convert to plain object
  if (data && typeof data === 'object' && data.constructor && data.constructor.name === 'MetaData') {
    return { ...data };
  }

  // If it's a MetaData object representation, convert to empty object
  if (data && typeof data === 'object' && data.__class__ === 'MetaData') {
    return {};
  }

  // Special handling for common fields that should be strings
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const idFields = [
      'id',
      'userId',
      'createdById',
      'directoryId',
      'senderId',
      'referenceId',
      'eventId',
      'processId',
      'stepId',
      'parentId',
      'templateId',
      'roomId',
      'topicId',
      'postId',
      'mediaId',
    ];

    // Ensure IDs are properly converted to strings
    for (const field of idFields) {
      if (field in data) {
        const value = data[field];
        // Convert UUID objects to strings
        if (value && typeof value === 'object') {
          if (value.__class__ === 'UUID' && value.hex) {
            data[field] = value.hex;
          } else if (value.constructor && value.constructor.name === 'UUID') {
            data[field] = value.toString();
          }
        }
        // Convert "null" and "undefined" string values to null
        if (typeof value === 'string' && ['null', 'undefined', 'None'].includes(value.toLowerCase())) {
          data[field] = null;
        }
      }
    }
  }

  // If it's an array, process each item
  if (Array.isArray(data)) {
    return data.map((item) => processSpecialDataTypes(item));
  }

  // If it's an object, process each property
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    return Object.entries(data).reduce((acc, [key, value]) => {
      acc[key] = processSpecialDataTypes(value);
      return acc;
    }, {} as Record);
  }

  // Otherwise return the data as is
  return data;
}

/**
 * Process and format API errors consistently
 */
function handleApiError(error: unknown, endpoint: string): ApiResult {
  if (axios.isAxiosError(error) && error.response) {
    // Handle Axios error with response
    // Error data has already been processed by the response interceptor
    const processedErrorData = error.response.data || null;

    const errorMessage = processedErrorData?.detail || (typeof processedErrorData === 'string' ? processedErrorData : 'An error occurred');

    // Create properly typed error
    const errorType = statusCodeToErrorType(error.response.status);

    // Log the error with proper context
    logger.error(`API Error [${errorType}] (${error.response.status}) for ${endpoint}: ${errorMessage}`, {
      status: error.response.status,
      data: processedErrorData,
      endpoint,
    });

    return {
      error: errorMessage,
      status: error.response.status,
      originalError: error,
    };
  } else if (axios.isAxiosError(error) && error.request) {
    // Handle network errors (request made but no response received)
    logger.error(`API Network Error for ${endpoint}:`, error.message);

    return {
      error: 'Network error: Could not connect to server',
      status: 0,
      originalError: error,
    };
  } else {
    // Handle other types of errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`API Unexpected Error for ${endpoint}:`, errorMessage);

    return {
      error: `Unexpected error: ${errorMessage}`,
      status: 0,
      originalError: error,
    };
  }
}

/**
 * Create an Axios instance with default configuration
 */
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds timeout
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Flag to track if we've seen a 401 on /users/me - helps detect refresh loops
  let hasSeenUsersMeAuth401 = false;

  // Add request interceptor for authentication
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

      // Add retry count to track and limit retries
      if (!config.headers) {
        config.headers = {};
      }

      // Initialize retry count if not present
      const retryCount = config.headers['X-Retry-Count'] ? parseInt(config.headers['X-Retry-Count']) : 0;

      // Exponential backoff for retries
      if (retryCount > 0) {
        const delay = Math.min(100 * Math.pow(2, retryCount), 2000); // Max 2 second delay
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      if (config.headers) {
        try {
          // Specific logic for different endpoint types to prevent circular dependencies
          const isUsersMeEndpoint = config.url?.includes('/users/me');

          if (isUsersMeEndpoint) {
            // For /users/me endpoints, just use the current token without checking expiration
            // This prevents circular dependencies where token checks trigger more API calls
            const token = localStorage.getItem('auth_token');
            if (token) {
              config.headers.Authorization = `Bearer ${token}`;
            }
          } else {
            // For all other requests, check if token needs refreshing
            const token = await checkAndRefreshToken();
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

  // Track 401 errors to prevent infinite refresh loops
  let consecutive401Count = 0;
  let last401Timestamp = 0;
  const MAX_CONSECUTIVE_401 = 3;
  const RESET_401_TIMEOUT = 30000; // 30 seconds

  // Add response interceptor for error handling and data processing
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

      // Simple error handling for 429 errors without rate limiting logic
      if (error.response?.status === 429) {
        logger.warn('Rate limit hit (429) - consider implementing proper rate limiting if this happens frequently');
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
            // Using centralized logout from auth store rather than just removing token
            // This ensures all auth state is properly cleared
            try {
              const { useAuthStore } = require('../store/authStore');
              useAuthStore.getState().logout();
            } catch (err) {
              // Fallback to simple token removal if import fails
              localStorage.removeItem('auth_token');
            }
            consecutive401Count = 0; // Reset after clearing

            // If this is a loop with /users/me endpoint, log a special warning
            if (url.includes('/users/me')) {
              logger.error('Detected auth loop with /users/me endpoint - this might indicate a deeper authentication issue');
            }
          }
          // Don't clear token on single 401s anymore; let the centralized logout handle it
          // This prevents race conditions with multiple API calls
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
};

// Create and export the Axios instance
export const axiosInstance = createAxiosInstance();

// Export handleApiError and processSpecialDataTypes functions
export { handleApiError };

/**
 * API client for making requests to the backend using Axios
 */
export class ApiClient {
  // Base URL for API requests
  static baseUrl: string = API_BASE_URL;

  /**
   * Make a request to the API using Axios
   * @param endpoint - API endpoint path (without base URL)
   * @param config - Request configuration
   * @returns Promise with API result
   */
  static async request<T>(method: string, endpoint: string, data?: any, config: ApiRequestConfig = {}): Promise {
    const { headers = {}, params = {}, formData = false, skipConversion = false } = config;

    // Prepare endpoint
    const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

    // Convert params and data from camelCase to snake_case
    const convertedParams = params ? decamelizeKeys(params) : {};

    // Convert request data from camelCase to snake_case if it's not FormData
    // and if skipConversion is not true
    let convertedData = data;
    if (data && !formData && !(data instanceof FormData) && !skipConversion) {
      convertedData = decamelizeKeys(data);
    } else if (skipConversion) {
      // For debugging only in development mode
      if (process.env.NODE_ENV === 'development') {
        console.log('Skipping case conversion for request data:', data);
      }
      convertedData = data; // Use data as-is
    }

    // Prepare Axios config
    const axiosConfig: AxiosRequestConfig = {
      method,
      url,
      headers: { ...headers },
      params: convertedParams,
    };

    // Add data for non-GET requests
    if (method !== 'GET' && convertedData) {
      axiosConfig.data = convertedData;

      // For form data, let browser set the correct content-type with boundary
      if (formData && data instanceof FormData) {
        delete axiosConfig.headers['Content-Type'];
      }
    }

    try {
      // Make request directly - no debug logging for routine API calls
      const response = await axiosInstance(axiosConfig);

      // Data has already been processed by the response interceptor
      const processedData = response.data;

      // Return success result with data
      return {
        data: processedData,
        status: response.status,
      };
    } catch (error) {
      return handleApiError(error, endpoint);
    }
  }

  /**
   * GET request helper
   */
  static async get<T>(endpoint: string, config: Omit = {}): Promise {
    return this.request<T>('GET', endpoint, undefined, config);
  }

  /**
   * POST request helper
   */
  static async post<T>(endpoint: string, body?: any, config: Omit = {}): Promise {
    return this.request<T>('POST', endpoint, body, config);
  }

  /**
   * PUT request helper
   */
  static async put<T>(endpoint: string, body?: any, config: Omit = {}): Promise {
    return this.request<T>('PUT', endpoint, body, config);
  }

  /**
   * PATCH request helper
   */
  static async patch<T>(endpoint: string, body?: any, config: Omit = {}): Promise {
    return this.request<T>('PATCH', endpoint, body, config);
  }

  /**
   * DELETE request helper
   */
  static async delete<T>(endpoint: string, config: Omit = {}): Promise {
    return this.request<T>('DELETE', endpoint, undefined, config);
  }

  /**
   * FormData POST request helper for file uploads
   */
  static async uploadFile<T>(endpoint: string, formData: FormData, config: Omit = {}): Promise {
    return this.request<T>('POST', endpoint, formData, {
      ...config,
      formData: true,
    });
  }
}
