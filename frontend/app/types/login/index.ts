/**
 * Login form states
 */
export enum AuthMode {
  LOGIN = 'login',
  SIGNUP = 'signup',
}

/**
 * Login form data interface
 */
export interface LoginFormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/**
 * Auth service response interface
 */
export interface AuthResponse {
  success: boolean;
  error?: string;
  userData?: any;
}
