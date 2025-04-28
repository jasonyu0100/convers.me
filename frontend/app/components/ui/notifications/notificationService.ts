'use client';

import { NotificationSchema, NotificationType } from '@/app/types/schema';
import { ApiClient } from '@/app/services/api';

interface NotificationResponse {
  items: NotificationSchema[];
  total: number;
  unread: number;
}

/**
 * Fetch notifications with pagination and filtering
 */
export const fetchNotifications = async (
  options: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
    type?: NotificationType;
  } = {},
): Promise => {
  const { unreadOnly = false, limit = 50, offset = 0, type } = options;

  try {
    // First check if user is authenticated
    if (!isAuthenticated()) {
      console.warn('User is not authenticated, cannot fetch notifications');
      return { items: [], total: 0, unread: 0 };
    }

    // Build query parameters
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    params.append('offset', offset.toString());

    if (unreadOnly) {
      params.append('unread_only', 'true');
    }

    if (type) {
      params.append('type', type);
    }

    const queryString = params.toString();
    const result = await ApiClient.get<NotificationResponse>(`/notifications?${queryString}`);

    if (result.error) {
      if (result.status === 401) {
        console.warn('Authentication token expired or invalid');
        // Token might be expired - return empty results instead of throwing
        return { items: [], total: 0, unread: 0 };
      }
      throw new Error(String(result.error));
    }

    return result.data || { items: [], total: 0, unread: 0 };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    // Return empty array for error cases
    return { items: [], total: 0, unread: 0 };
  }
};

/**
 * Get unread notification count
 */
export const getUnreadCount = async (): Promise => {
  try {
    // First check if user is authenticated
    if (!isAuthenticated()) {
      console.warn('User is not authenticated, cannot fetch unread count');
      return { count: 0 };
    }

    const result = await ApiClient.get<number>('/notifications/unread-count');

    if (result.error) {
      if (result.status === 401) {
        console.warn('Authentication token expired or invalid');
        // Token might be expired - return zero instead of throwing
        return { count: 0 };
      }
      throw new Error(String(result.error));
    }

    return { count: result.data || 0 };
  } catch (error) {
    console.error('Error fetching unread count:', error);
    // Return 0 as fallback
    return { count: 0 };
  }
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId: string): Promise => {
  try {
    // First check if user is authenticated
    if (!isAuthenticated()) {
      console.warn('User is not authenticated, cannot mark notification as read');
      throw new Error('Authentication required');
    }

    const result = await ApiClient.put<NotificationSchema>(`/notifications/${notificationId}`, {
      read: true,
    });

    if (result.error) {
      if (result.status === 401) {
        console.warn('Authentication token expired or invalid');
        throw new Error('Authentication required');
      }
      throw new Error(String(result.error));
    }

    return result.data as NotificationSchema;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise => {
  try {
    // First check if user is authenticated
    if (!isAuthenticated()) {
      console.warn('User is not authenticated, cannot mark all notifications as read');
      throw new Error('Authentication required');
    }

    const result = await ApiClient.post<number>('/notifications/mark-all-read');

    if (result.error) {
      if (result.status === 401) {
        console.warn('Authentication token expired or invalid');
        throw new Error('Authentication required');
      }
      throw new Error(String(result.error));
    }

    return result.data || 0;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Check if user is authenticated using the API client's auth helper
 */
export const isAuthenticated = (): boolean => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth_token');
    return !!token;
  }
  return false;
};
