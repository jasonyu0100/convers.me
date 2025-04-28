/**
 * Authentication initialization
 * Ensures auth state is loaded at app startup
 */

import { useAuthStore } from '../store/authStore';
import { UserService } from '../services/userService';
import { parseJwt } from './jwt';
import logger from './logger';

let initialized = false;

/**
 * Initialize authentication state from localStorage
 * This function is called during app startup
 */
export function initializeAuth(): void {
  // Prevent double initialization
  if (initialized || typeof window === 'undefined') return;

  try {
    // Check for token in localStorage
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    // Parse and validate token
    const payload = parseJwt(token);
    if (!payload || !payload.exp) {
      logger.warn('Invalid token found during initialization, removing');
      localStorage.removeItem('auth_token');
      return;
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      logger.warn('Expired token found during initialization, removing');
      localStorage.removeItem('auth_token');
      return;
    }

    // Valid token found, set it in the store
    const expiresAt = payload.exp * 1000; // Convert to milliseconds
    useAuthStore.setState({
      token,
      tokenExpiresAt: expiresAt,
      isAuthenticated: true,
    });

    // Fetch user profile in the background
    // Using setTimeout to avoid blocking the initialization process
    setTimeout(() => {
      UserService.getCurrentUser()
        .catch(err => logger.error('Failed to fetch user data during auth initialization:', err));
    }, 100);

    logger.info('Auth token restored from localStorage');
  } catch (error) {
    logger.error('Error initializing auth:', error);
  } finally {
    // Mark as initialized to prevent duplicate initialization
    initialized = true;
  }
}

/**
 * Call this function early in the app lifecycle
 */
export function checkAndInitializeAuth(): void {
  if (typeof window !== 'undefined') {
    initializeAuth();
  }
}

// Auto-initialize in browser environments
if (typeof window !== 'undefined') {
  checkAndInitializeAuth();
}