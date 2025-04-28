/**
 * Admin Service
 *
 * Handles admin-specific functionality like user management
 * This service uses Axios for API requests
 */

import { ApiClient, ApiResult } from './api';

// Debug utility to detect issues with currentUser
export const debugIsAdmin = () => {
  try {
    // Don't call React hooks in service functions
    // Instead, access the store directly
    const { currentUser } = require('../store/authStore').useAuthStore.getState();
    console.log('DEBUG - Admin service currentUser:', currentUser);
    console.log('DEBUG - isAdmin value:', currentUser?.isAdmin);
    return Boolean(currentUser?.isAdmin);
  } catch (error) {
    console.error('Error in debugIsAdmin:', error);
    return false;
  }
};

export interface User {
  id: string;
  name: string;
  handle: string;
  email: string;
  profileImage?: string;
  bio?: string;
  isAdmin: boolean; // Enforcing this as required boolean
  createdAt: string;
  updatedAt?: string;
}

export interface CreateUserData {
  name: string;
  handle: string;
  email: string;
  password: string;
  profileImage?: string;
  bio?: string;
  isAdmin?: boolean;
}

export interface UpdateUserData {
  name?: string;
  handle?: string;
  email?: string;
  profileImage?: string;
  bio?: string;
  isAdmin?: boolean;
}

/**
 * Get all users (admin only)
 */
export const getUsers = async (skip = 0, limit = 100) => {
  try {
    const params: Record = { skip, limit };
    const response = await ApiClient.get<User[]>('/admin/users', { params });
    return { data: response.data, error: null };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { data: null, error: 'Failed to fetch users' };
  }
};

/**
 * Get a user by ID (admin only)
 */
export const getUserById = async (userId: string) => {
  try {
    const response = await ApiClient.get<User>(`/admin/users/${userId}`);
    return { data: response.data, error: null };
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return { data: null, error: 'Failed to fetch user' };
  }
};

/**
 * Create a new user (admin only)
 */
export const createUser = async (userData: CreateUserData) => {
  try {
    const response = await ApiClient.post<User>('/admin/users', userData);
    return { data: response.data, error: null };
  } catch (error) {
    console.error('Error creating user:', error);
    return { data: null, error: 'Failed to create user' };
  }
};

/**
 * Update a user (admin only)
 */
export const updateUser = async (userId: string, userData: UpdateUserData) => {
  try {
    const response = await ApiClient.put<User>(`/admin/users/${userId}`, userData);
    return { data: response.data, error: null };
  } catch (error) {
    console.error(`Error updating user ${userId}:`, error);
    return { data: null, error: 'Failed to update user' };
  }
};

/**
 * Delete a user (admin only)
 */
export const deleteUser = async (userId: string) => {
  try {
    const response = await ApiClient.delete<void>(`/admin/users/${userId}`);
    if (response.status === 204 || response.status === 200) {
      return { success: true, error: null };
    } else {
      return { success: false, error: response.error || 'Failed to delete user' };
    }
  } catch (error) {
    console.error(`Error deleting user ${userId}:`, error);
    return { success: false, error: 'Failed to delete user' };
  }
};

/**
 * Initialize the database (admin only)
 */
export const initializeDatabase = async () => {
  try {
    const response = await ApiClient.post<any>('/admin/initialize');
    return { data: response.data, error: null };
  } catch (error) {
    console.error('Error initializing database:', error);
    return { data: null, error: 'Failed to initialize database' };
  }
};

/**
 * Reset the database (admin only)
 */
export const resetDatabase = async () => {
  try {
    const response = await ApiClient.post<any>('/admin/reset');
    return { data: response.data, error: null };
  } catch (error) {
    console.error('Error resetting database:', error);
    return { data: null, error: 'Failed to reset database' };
  }
};

// Export as default object for named imports
const AdminService = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  initializeDatabase,
  resetDatabase,
};

export default AdminService;
