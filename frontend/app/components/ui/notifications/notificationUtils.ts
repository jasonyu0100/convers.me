'use client';

import { NotificationSchema, NotificationType } from '@/app/types/schema';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, getUnreadCount, markAsRead, markAllAsRead } from './notificationService';

/**
 * Get notification icon and color based on notification type
 */
export const getNotificationTypeInfo = (type: NotificationType) => {
  switch (type) {
    case 'mention':
      return {
        icon: '@',
        color: 'bg-blue-500',
        label: 'Mention',
      };
    case 'comment':
      return {
        icon: '💬',
        color: 'bg-green-500',
        label: 'Comment',
      };
    case 'event_invite':
      return {
        icon: '📅',
        color: 'bg-purple-500',
        label: 'Event Invitation',
      };
    case 'event_reminder':
      return {
        icon: '⏰',
        color: 'bg-orange-500',
        label: 'Event Reminder',
      };
    case 'event_update':
      return {
        icon: '📝',
        color: 'bg-teal-500',
        label: 'Event Update',
      };
    case 'new_message':
      return {
        icon: '✉️',
        color: 'bg-blue-500',
        label: 'New Message',
      };
    case 'follow':
      return {
        icon: '👤',
        color: 'bg-green-500',
        label: 'New Follower',
      };
    case 'system':
    default:
      return {
        icon: '🔔',
        color: 'bg-gray-500',
        label: 'System Notification',
      };
  }
};

/**
 * React Query hook for fetching notifications
 */
export function useNotifications({
  unreadOnly = false,
  limit = 50,
  offset = 0,
  type,
  enabled = true,
}: {
  unreadOnly?: boolean;
  limit?: number;
  offset?: number;
  type?: NotificationType;
  enabled?: boolean;
} = {}) {
  return useQuery({
    queryKey: ['notifications', { unreadOnly, limit, offset, type }],
    queryFn: () => fetchNotifications({ unreadOnly, limit, offset, type }),
    staleTime: 1000 * 60, // 1 minute
    enabled,
  });
}

/**
 * React Query hook for fetching unread notification count
 */
export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: getUnreadCount,
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Poll every minute
    enabled,
  });
}

/**
 * React Query mutation hook for marking a notification as read
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAsRead,
    onSuccess: (updatedNotification) => {
      // Update the notification in the cache
      queryClient.setQueryData<{ items: NotificationSchema[]; total: number; unread: number }>(['notifications'], (oldData) => {
        if (!oldData) return undefined;

        return {
          ...oldData,
          items: oldData.items.map((notification) => (notification.id === updatedNotification.id ? updatedNotification : notification)),
          unread: Math.max(0, oldData.unread - 1),
        };
      });

      // Invalidate unread count query
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

/**
 * React Query mutation hook for marking all notifications as read
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      // Update the notifications in the cache
      queryClient.setQueryData<{ items: NotificationSchema[]; total: number; unread: number }>(['notifications'], (oldData) => {
        if (!oldData) return undefined;

        return {
          ...oldData,
          items: oldData.items.map((notification) => ({
            ...notification,
            read: true,
          })),
          unread: 0,
        };
      });

      // Update unread count
      queryClient.setQueryData(['notifications', 'unread-count'], { count: 0 });
    },
  });
}

/**
 * Format notification timestamp into relative time
 */
export function formatNotificationTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 1) {
    return 'Just now';
  }

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  // For older notifications, show the actual date
  return date.toLocaleDateString();
}
