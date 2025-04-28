/**
 * Type definitions for auth-related components
 */
import { UserProfile } from '@/app/types/user';

/**
 * Properties for AuthRedirect component
 */
export interface AuthRedirectProps {
  /** Path to redirect authenticated users to */
  redirectAuthenticatedTo?: string;
  /** Path to redirect unauthenticated users to */
  redirectUnauthenticatedTo?: string;
}

/**
 * Login and registration response format
 */
export interface AuthResponse {
  /** Whether the operation was successful */
  success: boolean;
  /** User data if successful */
  userData?: UserProfile;
  /** Error message if unsuccessful */
  error?: string;
}

/**
 * Auth service interface for consistent implementation
 */
export interface IAuthService {
  /** Log in a user */
  login: (user: UserProfile) => void;
  /** Log out the current user */
  logout: () => void;
  /** Check if a user is authenticated */
  isAuthenticated: () => boolean;
  /** Get the current user profile */
  getUser: () => UserProfile | null;
  /** Get the authentication token */
  getToken: () => string | null;
}
