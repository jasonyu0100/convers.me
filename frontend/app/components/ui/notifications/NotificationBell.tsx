'use client';

import { NotificationSchema } from '@/app/types/schema';
import { BellAlertIcon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { NotificationList } from './NotificationList';
import { fetchNotifications, isAuthenticated, markAllAsRead, markAsRead } from './notificationService';

interface NotificationBellProps {
  onNotificationClick?: (notification: NotificationSchema) => void;
}

export const NotificationBell = ({ onNotificationClick }: NotificationBellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSchema[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const loadNotifications = async () => {
    if (!isAuthenticated()) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data.items);
      setUnreadCount(data.unread);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifications();
    }
  };

  const handleNotificationClick = async (notification: NotificationSchema) => {
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
        setNotifications(notifications.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
        setUnreadCount(Math.max(0, unreadCount - 1));
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    if (onNotificationClick) {
      onNotificationClick(notification);
    } else if (notification.link) {
      router.push(notification.link);
    }

    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map((notification) => ({ ...notification, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      loadNotifications();
    }
  };

  return (
    <div className='relative' ref={notificationRef}>
      {/* Notification Bell Button */}
      <button
        className='relative flex h-12 w-12 items-center justify-center rounded-full text-gray-500 transition-all hover:bg-gray-100 hover:text-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
        onClick={toggleDropdown}
        aria-label='Notifications'
      >
        {unreadCount > 0 ? (
          <>
            <BellAlertIcon className='h-7 w-7' />
            <span className='absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ring-2 ring-white'>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          </>
        ) : (
          <BellIcon className='h-7 w-7' />
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className='absolute right-0 z-50 mt-3 w-[420px] origin-top-right rounded-2xl border border-gray-100 bg-white/80 shadow-xl transition-all duration-200 ease-out'>
          {/* Header */}
          <div className='flex items-center justify-between border-b border-gray-100 px-6 py-4'>
            <h3 className='text-xl font-semibold text-gray-900'>Notifications</h3>
            <div className='flex items-center gap-3'>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className='flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100'
                >
                  <CheckCircleIcon className='h-4 w-4' />
                  <span>Mark all as read</span>
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className='rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600'>
                <XMarkIcon className='h-5 w-5' />
              </button>
            </div>
          </div>

          {/* Notification List */}
          <NotificationList notifications={notifications} isLoading={isLoading} onNotificationClick={handleNotificationClick} />

          {/* Footer */}
          <div className='border-t border-gray-100 p-4 text-center'>
            <button
              onClick={() => {
                router.push('/settings/notifications');
                setIsOpen(false);
              }}
              className='w-full rounded-xl bg-gray-50 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100'
            >
              Manage notification settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
