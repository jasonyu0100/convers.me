import { UserProfile } from '@/app/components/app/types';
import { LoginFormData } from '../../../types/login';

// API endpoint base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Response format for authentication operations
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

/**
 * Transform a backend user to frontend user profile format
 * @param user - Backend user data
 * @returns Formatted frontend user profile
 */
function transformUserData(user: any): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    handle: user.handle,
    profileImage: user.profile_image,
    bio: user.bio || '',
  };
}

/**
 * Login user with backend API
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

    // Request token from backend
    const tokenResponse = await fetch(`${API_BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
    });

    if (!tokenResponse.ok) {
      // Handle specific error responses from backend
      if (tokenResponse.status === 401) {
        return {
          success: false,
          error: 'Invalid email or password',
        };
      }

      return {
        success: false,
        error: 'Authentication failed',
      };
    }

    // Get token from response
    const tokenData = await tokenResponse.json();
    const access_token = tokenData.accessToken || tokenData.access_token;

    // Get user profile with token
    const userResponse = await fetch(`${API_BASE_URL}/users/me`, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!userResponse.ok) {
      return {
        success: false,
        error: 'Failed to fetch user profile',
      };
    }

    const userData = await userResponse.json();
    const userProfile = transformUserData(userData);

    // Store token in localStorage (consider using a more secure approach in production)
    localStorage.setItem('auth_token', access_token);

    return {
      success: true,
      userData: userProfile,
      accessToken: access_token,
    };
  } catch (error) {
    console.error('Login error:', error);

    // Check if the error is due to backend not running
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Fallback to mock authentication for development
      console.warn('API server not running, using mock authentication');
      return mockLoginUser(formData);
    }

    return {
      success: false,
      error: 'An error occurred during login',
    };
  }
}

/**
 * Create a guest account with a specified role
 * @param role - Role for the guest account (dev, pm, designer, ops, intern)
 * @returns Promise resolving to auth response with user data and credentials
 */
export async function createGuestAccount(role: GuestRole): Promise {
  try {
    // Convert 'leadership' to a supported role ('dev') for the API
    // The backend API only accepts 'dev', 'pm', 'designer', 'ops', or 'intern'
    const apiRole = role === 'leadership' ? 'dev' : role;

    // Make request to create guest account
    const response = await fetch(`${API_BASE_URL}/auth/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: apiRole }),
    });

    if (!response.ok) {
      // Handle specific error responses
      if (response.status === 403) {
        return {
          success: false,
          error: 'Guest login is not available in this environment',
        };
      }

      return {
        success: false,
        error: 'Failed to create guest account',
      };
    }

    // Parse the response
    const data = await response.json();

    // Store token in localStorage - handle both camel and snake case
    const accessToken = data.accessToken || data.access_token;
    localStorage.setItem('auth_token', accessToken);

    // Create user profile from response
    const userProfile: UserProfile = {
      id: 'guest-id', // We don't get an ID from the response
      email: data.email,
      name: data.name,
      handle: data.handle,
      profileImage: data.profileImage || data.profile_image,
      bio: `Guest ${role.toUpperCase()} account`,
    };

    return {
      success: true,
      userData: userProfile,
      accessToken: accessToken,
      credentials: {
        email: data.email,
        password: data.password,
      },
    };
  } catch (error) {
    console.error('Guest login error:', error);

    // Check if the error is due to backend not running
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // Fallback to mock guest account for development
      console.warn('API server not running, using mock guest account');
      return mockGuestAccount(role);
    }

    return {
      success: false,
      error: 'An error occurred while creating a guest account',
    };
  }
}

/**
 * Fallback mock guest account creation when the backend is not running
 */
async function mockGuestAccount(role: GuestRole): Promise {
  // Generate a random 3-digit ID
  const randomId = Math.floor(Math.random() * 900 + 100).toString();

  // Create mock user data based on role
  // For API compatibility, the email uses 'dev' for leadership to maintain compatibility
  const emailPrefix = role === 'leadership' ? 'leadership' : role;
  const email = `${emailPrefix}${randomId}@convers.me`;
  const password = 'guest123';

  // Role-specific information
  const roleInfo: Record = {
    dev: {
      name: `Guest Developer ${randomId}`,
      image: '/profile/profile-picture-1.jpg',
    },
    pm: {
      name: `Guest Product Manager ${randomId}`,
      image: '/profile/profile-picture-2.jpg',
    },
    designer: {
      name: `Guest Designer ${randomId}`,
      image: '/profile/profile-picture-3.jpg',
    },
    ops: {
      name: `Guest Operations ${randomId}`,
      image: '/profile/profile-picture-4.jpg',
    },
    intern: {
      name: `Guest Intern ${randomId}`,
      image: '/profile/profile-picture-5.jpg',
    },
    leadership: {
      name: `Guest Leadership ${randomId}`,
      image: '/profile/profile-picture-6.jpg',
    },
  };

  // Generate a fake token
  const mockToken = `mock_token_${Date.now()}`;
  localStorage.setItem('auth_token', mockToken);

  // Create user profile
  const userProfile: UserProfile = {
    id: `guest-${role}-${randomId}`,
    email,
    name: roleInfo[role].name,
    handle: `guest_${role}${randomId}`,
    profileImage: roleInfo[role].image,
    bio: `Guest ${role.toUpperCase()} account for exploring the platform`,
  };

  return {
    success: true,
    userData: userProfile,
    accessToken: mockToken,
    credentials: {
      email,
      password,
    },
  };
}

/**
 * Fallback mock login for development when the backend is not running
 */
async function mockLoginUser(formData: LoginFormData): Promise {
  const { email, password } = formData;

  // Sample users that match the ones created by DataInitializationService
  const sampleUsers = [
    {
      id: 'dev-id',
      email: 'dev@convers.me',
      password: 'password123',
      name: 'Alex Developer',
      handle: 'dev',
      profile_image: '/profile/profile-picture-1.jpg',
      bio: 'Senior Software Engineer | Full Stack Development | 5 years experience',
    },
    {
      id: 'pm-id',
      email: 'pm@convers.me',
      password: 'password123',
      name: 'Sam ProductManager',
      handle: 'pm',
      profile_image: '/profile/profile-picture-2.jpg',
      bio: 'Product Manager | User-Centered Design | Agile Methodology',
    },
    {
      id: 'designer-id',
      email: 'designer@convers.me',
      password: 'password123',
      name: 'Jordan Designer',
      handle: 'designer',
      profile_image: '/profile/profile-picture-3.jpg',
      bio: 'UX/UI Designer | Visual Design | User Research | Prototyping',
    },
    {
      id: 'ops-id',
      email: 'ops@convers.me',
      password: 'password123',
      name: 'Taylor Operations',
      handle: 'ops',
      profile_image: '/profile/profile-picture-4.jpg',
      bio: 'DevOps Engineer | Infrastructure | CI/CD | Cloud Architecture',
    },
    {
      id: 'intern-id',
      email: 'intern@convers.me',
      password: 'password123',
      name: 'Casey Intern',
      handle: 'intern',
      profile_image: '/profile/profile-picture-5.jpg',
      bio: 'Engineering Intern | Computer Science Student | Learning Full Stack',
    },
  ];

  // Find the user with the provided email and password
  const user = sampleUsers.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

  if (!user) {
    return {
      success: false,
      error: 'Invalid email or password',
    };
  }

  // Generate a fake token
  const mockToken = `mock_token_${Date.now()}`;
  localStorage.setItem('auth_token', mockToken);

  // Return the mock user data
  return {
    success: true,
    userData: transformUserData(user),
    accessToken: mockToken,
  };
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

    // Sanitize input before usage
    const sanitizedFirstName = (firstName || '').trim();
    const sanitizedLastName = (lastName || '').trim();
    const sanitizedEmail = email.trim().toLowerCase();

    // Create user data to send to the backend
    const userData = {
      email: sanitizedEmail,
      name: `${sanitizedFirstName} ${sanitizedLastName}`,
      handle: sanitizedFirstName.toLowerCase() + Math.floor(Math.random() * 1000).toString(),
      password: password,
      bio: '',
      profile_image: '',
    };

    // Send signup request to backend
    const signupResponse = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    // Handle response
    if (!signupResponse.ok) {
      // Check for specific error types
      if (signupResponse.status === 400) {
        const errorData = await signupResponse.json();
        return {
          success: false,
          error: errorData.detail || 'Email or handle already in use',
        };
      }

      if (signupResponse.status === 403) {
        const errorData = await signupResponse.json();
        return {
          success: false,
          error: errorData.detail || 'Signup is not available',
        };
      }

      return {
        success: false,
        error: 'Failed to create account',
      };
    }

    // If signup was successful, log the user in
    return await loginUser({ email: sanitizedEmail, password });
  } catch (error) {
    console.error('Signup error:', error);

    // Check if the error is due to backend not running
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('API server not running, signup not available in offline mode');
      return {
        success: false,
        error: 'Signup requires a connection to the server',
      };
    }

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
  // Remove token from storage
  localStorage.removeItem('auth_token');
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
