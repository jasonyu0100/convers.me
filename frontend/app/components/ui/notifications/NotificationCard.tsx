'use client';

import { NotificationSchema } from '@/app/types/schema';
import { formatDistanceToNow } from 'date-fns';
import { getNotificationTypeInfo } from './notificationUtils';

interface NotificationCardProps {
  notification: NotificationSchema;
  onClick: (notification: NotificationSchema) => void;
}

export const NotificationCard = ({ notification, onClick }: NotificationCardProps) => {
  const { icon, color } = getNotificationTypeInfo(notification.type);

  return (
    <div
      onClick={() => onClick(notification)}
      className={`relative flex cursor-pointer items-start gap-4 px-6 py-4 transition-colors hover:bg-gray-50 ${!notification.read ? 'bg-blue-50/70' : ''}`}
    >
      {!notification.read && <span className='absolute top-1/2 left-2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-blue-500'></span>}
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full p-2.5 text-white ${color}`}>
        <span className='text-base'>{icon}</span>
      </div>
      <div className='min-w-0 flex-1 space-y-1.5'>
        <div className='flex items-center justify-between'>
          <p className='truncate text-base font-medium text-gray-900'>{notification.title}</p>
          <p className='ml-3 text-xs whitespace-nowrap text-gray-500'>
            {notification.createdAt
              ? formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                })
              : ''}
          </p>
        </div>
        <p className='line-clamp-2 text-sm text-gray-600'>{notification.message}</p>
        {notification.sender && (
          <div className='mt-2 flex items-center'>
            <span className='text-xs text-gray-500'>From: </span>
            <span className='ml-1.5 text-sm font-medium text-gray-700'>{notification.sender.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};
