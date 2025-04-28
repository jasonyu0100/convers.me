/**
 * Notification service for handling notification-related operations
 * This service uses Axios for API requests
 */

import { NotificationSchema } from '@/app/types/schema';
import { ApiClient, ApiResult } from './api';

/**
 * Interface for notification list response
 */
export interface NotificationListResponse {
  items: NotificationSchema[];
  total: number;
  unread: number;
}

/**
 * Interface for creating a new notification
 */
export interface CreateNotificationData {
  type: string; // 'mention', 'comment', 'event_invite', etc.
  title: string;
  message: string;
  link?: string;
  read?: boolean;
  user_id: string;
  sender_id?: string;
  reference_id?: string;
  reference_type?: string;
  notification_metadata?: Record;
}

/**
 * Service for notification-related operations
 */
export class NotificationService {
  /**
   * Get user notifications with filtering options
   * @param unreadOnly - Filter to only unread notifications (optional, default: false)
   * @param limit - Maximum number of notifications to return (optional, default: 50)
   * @param offset - Pagination offset (optional, default: 0)
   * @param type - Filter by notification type (optional)
   * @returns Promise with API result containing notifications list response
   */
  static async getNotifications(unreadOnly: boolean = false, limit: number = 50, offset: number = 0, type?: string): Promise {
    // Build query parameters
    const params: Record = {
      unread_only: unreadOnly,
      limit,
      offset,
    };
    if (type) params.type = type;

    return ApiClient.get<NotificationListResponse>('/notifications', { params });
  }

  /**
   * Get count of unread notifications
   * @returns Promise with API result containing unread count
   */
  static async getUnreadCount(): Promise {
    return ApiClient.get<number>('/notifications/unread-count');
  }

  /**
   * Get a notification by ID
   * @param notificationId - Notification ID
   * @returns Promise with API result containing notification data
   */
  static async getNotificationById(notificationId: string): Promise {
    return ApiClient.get<NotificationSchema>(`/notifications/${notificationId}`);
  }

  /**
   * Create a notification
   * @param notificationData - Notification data to create
   * @returns Promise with API result containing created notification data
   */
  static async createNotification(notificationData: CreateNotificationData): Promise {
    return ApiClient.post<NotificationSchema>('/notifications', notificationData);
  }

  /**
   * Update a notification (typically to mark as read/unread)
   * @param notificationId - Notification ID
   * @param read - Whether the notification is read
   * @returns Promise with API result containing updated notification data
   */
  static async updateNotification(notificationId: string, read: boolean): Promise {
    return ApiClient.put<NotificationSchema>(`/notifications/${notificationId}`, { read });
  }

  /**
   * Mark all notifications as read
   * @returns Promise with API result containing number of notifications updated
   */
  static async markAllAsRead(): Promise {
    return ApiClient.put<number>('/notifications/mark-all-read', {});
  }

  /**
   * Delete a notification
   * @param notificationId - Notification ID
   * @returns Promise with API result
   */
  static async deleteNotification(notificationId: string): Promise {
    return ApiClient.delete<void>(`/notifications/${notificationId}`);
  }
}
