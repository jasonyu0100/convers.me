/**
 * Authentication service for handling user login, registration, and authentication
 * Updated to use Axios for API requests
 */

import { ApiClient, axiosInstance } from './api';
import axios from 'axios';
import logger from '../lib/logger';
import { getTokenExpiry } from '../lib/jwt';
import { UserProfile, transformUserData } from '../types/user';

/**
 * Login form data interface
 */
export interface LoginFormData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Response for authentication operations
 */
export interface AuthResponse {
  success: boolean;
  userData?: UserProfile;
  error?: string;
  accessToken?: string;
  credentials?: {
    email: string;
    password: string;
  };
}

/**
 * Guest account role options
 */
export type GuestRole = 'dev' | 'pm' | 'designer' | 'ops' | 'intern' | 'leadership';

/**
 * Validates user credentials
 * @param formData - User credentials to validate
 * @param isSignup - Whether this is a signup (true) or login (false) operation
 * @returns Validation error message or null if valid
 */
function validateCredentials(formData: LoginFormData, isSignup: boolean): string | null {
  const { email, password, firstName, lastName } = formData;

  // Check required fields
  if (!email || !password) {
    return 'Email and password are required';
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  // Validate password length
  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }

  // Additional signup validations
  if (isSignup) {
    if (!firstName || !lastName) {
      return 'First name and last name are required';
    }

    // Prevent script injection in name fields
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
      return 'Names can only contain letters, spaces, hyphens, and apostrophes';
    }
  }

  return null;
}

// transformUserData has been moved to types/user.ts

/**
 * Login user with backend API using Axios
 * @param formData - User credentials for login
 * @returns Promise resolving to auth response with user data or error
 */
export async function loginUser(formData: LoginFormData): Promise {
  const { email, password } = formData;

  try {
    // Validate credentials
    const validationError = validateCredentials(formData, false);
    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    // Create form data for token request
    const formBody = new URLSearchParams();
    formBody.append('username', email);
    formBody.append('password', password);

    try {
      // Request token from backend using Axios
      const response = await axiosInstance({
        method: 'POST',
        url: '/auth/token',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: formBody.toString(),
      });

      // Get token from response
      const tokenData = response.data;
      const access_token = tokenData.accessToken;

      // Get user profile with token
      const userResult = await ApiClient.get('/users/me', {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (userResult.error) {
        return {
          success: false,
          error: 'Failed to fetch user profile',
        };
      }

      const userProfile = transformUserData(userResult.data);

      // Store token and userId in localStorage
      localStorage.setItem('auth_token', access_token);
      localStorage.setItem('userId', userProfile.id); // Store user ID for permissions checking

      // Update the auth store directly
      const { useAuthStore } = require('../store/authStore');
      const tokenExpiry = getTokenExpiry(access_token);
      useAuthStore.setState({
        token: access_token,
        tokenExpiresAt: tokenExpiry,
        currentUser: userProfile,
        isAuthenticated: true,
      });

      return {
        success: true,
        userData: userProfile,
        accessToken: access_token,
      };
    } catch (error) {
      // Handle axios errors
      if (axios.isAxiosError(error)) {
        // Handle specific error responses from backend
        if (error.response?.status === 401) {
          return {
            success: false,
            error: 'Invalid email or password',
          };
        }

        const errorMessage = error.response?.data?.detail || 'Authentication failed';
        return {
          success: false,
          error: errorMessage,
        };
      }

      // Rethrow to be caught by outer catch
      throw error;
    }
  } catch (error) {
    // No fallback to mock authentication anymore - backend is required
    return {
      success: false,
      error: 'Backend API not available. Please ensure the backend server is running.',
    };
  }
}

/**
 * Create a guest account with a specified role
 * @param role - Role for the guest account
 * @returns Promise resolving to auth response with user data and credentials
 */
export async function createGuestAccount(role: GuestRole): Promise {
  try {
    // Try first using the guest endpoint
    try {
      // Make request to create guest account through guest endpoint
      const result = await ApiClient.post('/auth/guest', { role });

      if (!result.error) {
        const data = result.data;

        // Store token and guest user ID in localStorage
        localStorage.setItem('auth_token', data.accessToken);
        localStorage.setItem('userId', data.userId || 'guest-id');

        // Create user profile from response
        const userProfile: UserProfile = {
          id: 'guest-id', // We don't get an ID from the response
          email: data.email,
          name: data.name,
          handle: data.handle,
          profileImage: data.profileImage,
          bio: `Guest ${role.toUpperCase()} account`,
          isAdmin: false, // Guests are never admins
        };

        return {
          success: true,
          userData: userProfile,
          accessToken: data.accessToken,
          credentials: {
            email: data.email,
            password: data.password,
          },
        };
      }
    } catch (guestEndpointError) {
      // If guest endpoint fails, try the regular user signup endpoint with guest flag
    }

    // Generate random details for the guest account
    const randomId = Math.floor(Math.random() * 900 + 100).toString();
    const email = `${role}${randomId}@convers.me`;
    const password = 'guest123';
    const name = `Guest ${role.charAt(0).toUpperCase() + role.slice(1)} ${randomId}`;
    const handle = `${role}_${randomId}`;

    // Create user through regular signup endpoint but with guest flags
    const signupResult = await ApiClient.post('/users', {
      email,
      password,
      name,
      handle,
      bio: `Guest ${role.toUpperCase()} account for exploring the platform`,
      profile_image: `/profile/profile-picture-${(role.charCodeAt(0) % 7) + 1}.jpg`,
      is_guest: true,
      guest_role: role,
    });

    if (signupResult.error) {
      return {
        success: false,
        error: signupResult.error,
      };
    }

    // Now login with the credentials
    const loginResult = await loginUser({ email, password });

    if (loginResult.success) {
      // Add credentials to the response for convenience
      loginResult.credentials = {
        email,
        password,
      };
      return loginResult;
    } else {
      return {
        success: false,
        error: 'Created guest account but login failed',
      };
    }
  } catch (error) {
    // No fallback to mock guest account anymore - backend is required
    return {
      success: false,
      error: 'Backend API not available. Please ensure the backend server is running.',
    };
  }
}

/**
 * Signup user with backend API
 * @param formData - User information for signup
 * @returns Promise resolving to auth response with user data or error
 */
export async function signupUser(formData: LoginFormData): Promise {
  const { email, password, firstName, lastName } = formData;

  try {
    // Validate credentials
    const validationError = validateCredentials(formData, true);
    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }

    // Prepare user data
    const userData = {
      email: email.trim().toLowerCase(),
      password,
      name: `${firstName} ${lastName}`.trim(),
      handle: email
        .split('@')[0]
        .toLowerCase()
        .replace(/[^a-z0-9]/g, ''),
    };

    // Create user using Axios through ApiClient
    const result = await ApiClient.post('/users', userData);

    if (result.error) {
      return {
        success: false,
        error: result.error,
      };
    }

    // After successful signup, login the user
    return loginUser({ email, password });
  } catch (error) {
    return {
      success: false,
      error: 'An error occurred during signup',
    };
  }
}

/**
 * Log out the current user
 */
export function logoutUser(): void {
  // Import the centralized logout function from the store
  const { useAuthStore } = require('../store/authStore');

  // Use the centralized logout function from the auth store
  useAuthStore.getState().logout();
}

/**
 * Check if user is authenticated
 * @returns True if user has a stored token
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem('auth_token') !== null;
}

// JWT token utilities are now imported from lib/jwt.ts

/**
 * Get the current authentication token
 * @returns The current token or null if not authenticated
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem('auth_token');
}
