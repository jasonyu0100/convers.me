/**
 * Authentication utilities
 * Common auth-related helpers
 */

import { UserProfile } from '../types/user';
import { getTokenExpiry } from './jwt';
import { useAuthStore } from '../store/authStore';
import logger from './logger';

/**
 * Get auth token from localStorage
 * @returns Token string or null if not found
 */
export function getStoredAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Store auth token in localStorage
 * @param token - JWT token to store
 */
export function storeAuthToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('auth_token', token);
}

/**
 * Remove auth token from localStorage
 */
export function removeAuthToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
}

/**
 * Check if user is authenticated (has valid token)
 * @returns Boolean indicating authentication status
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('auth_token') !== null;
}

/**
 * Clear all authentication-related data
 */
export function clearAuthData(): void {
  if (typeof window === 'undefined') return;
  
  // Remove token
  localStorage.removeItem('auth_token');
  
  // Remove user data
  localStorage.removeItem('convers_me_user');
  
  // Clean up any other auth-related localStorage items
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('convers-me-') || key.startsWith('convers_me_')) {
      localStorage.removeItem(key);
    }
  });
}

/**
 * Login helper to update store and localStorage
 * @param token - JWT token
 * @param user - User profile
 */
export function login(token: string, user: UserProfile): void {
  if (!token || !user) {
    logger.error('[Auth] Attempted to login with invalid token or user data');
    return;
  }
  
  try {
    // Get token expiration
    const tokenExpiry = getTokenExpiry(token);
    const expiresIn = tokenExpiry ? Math.floor((tokenExpiry - Date.now()) / 1000) : 3600;
    
    // Store token in localStorage
    storeAuthToken(token);
    
    // Update auth store
    useAuthStore.getState().login(token, expiresIn, user);
    
    logger.info(`[Auth] User ${user.handle} logged in successfully`);
  } catch (error) {
    logger.error('[Auth] Login failed:', error);
  }
}

/**
 * Logout helper to clear store and localStorage
 */
export function logout(): void {
  try {
    // Flag to prevent in-flight requests from continuing
    if (typeof window !== 'undefined') {
      (window as any).__AUTH_LOGOUT_IN_PROGRESS = true;
    }
    
    // Clear auth data
    clearAuthData();
    
    // Use store logout to clear state
    useAuthStore.getState().logout();
    
    // Remove flag after a delay
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        (window as any).__AUTH_LOGOUT_IN_PROGRESS = false;
      }
    }, 500);
    
    logger.info('[Auth] User logged out successfully');
  } catch (error) {
    logger.error('[Auth] Logout failed:', error);
  }
}