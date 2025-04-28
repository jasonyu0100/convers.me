'use client';

import { NotificationSchema } from '@/app/types/schema';
import { BellIcon } from '@heroicons/react/24/outline';
import { NotificationCard } from './NotificationCard';

interface NotificationListProps {
  notifications: NotificationSchema[];
  isLoading: boolean;
  onNotificationClick: (notification: NotificationSchema) => void;
}

export const NotificationList = ({ notifications, isLoading, onNotificationClick }: NotificationListProps) => {
  if (isLoading) {
    return (
      <div className='flex justify-center p-8'>
        <div className='h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600'></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center px-6 py-16 text-center'>
        <div className='mb-5 rounded-full bg-gray-100 p-4'>
          <BellIcon className='h-10 w-10 text-gray-400' />
        </div>
        <h3 className='mb-2 text-lg font-medium text-gray-900'>No notifications</h3>
        <p className='max-w-xs text-sm text-gray-500'>You don't have any notifications yet. We'll notify you when something important happens.</p>
      </div>
    );
  }

  return (
    <div className='scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent max-h-[70vh] overflow-y-auto py-2'>
      {notifications.map((notification) => (
        <NotificationCard key={notification.id} notification={notification} onClick={onNotificationClick} />
      ))}
    </div>
  );
};
