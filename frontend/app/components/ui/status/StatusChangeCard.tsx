'use client';

import React from 'react';
import { EventStatus } from '@/app/types/shared';
import { UserAvatar } from '../avatars/UserAvatar';
import { formatRelativeTime } from '@/app/lib/utils';

interface StatusChangeCardProps {
  previousStatus?: EventStatus;
  newStatus: EventStatus;
  userId: string;
  userName?: string;
  userImage?: string;
  eventId: string;
  eventTitle?: string;
  timestamp: string;
  onClick?: () => void;
}

// Define status options with their colors
const statusStyles: Record = {
  Pending: {
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: '⏳',
  },
  Planning: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: '📝',
  },
  Execution: {
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    icon: '🏃',
  },
  Review: {
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    icon: '🔍',
  },
  Administrative: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: '📋',
  },
  Done: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '✅',
  },
  execution: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: '⏱️',
  },
  upcoming: {
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    icon: '📅',
  },
  done: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: '✓',
  },
  ready: {
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-100',
    icon: '🚀',
  },
};

export default function StatusChangeCard({
  previousStatus,
  newStatus,
  userId,
  userName = 'Team Member',
  userImage,
  eventId,
  eventTitle = 'Event',
  timestamp,
  onClick,
}: StatusChangeCardProps) {
  // Get the current status style
  const prevStyle = previousStatus ? statusStyles[previousStatus] : undefined;
  const newStyle = statusStyles[newStatus];

  // Format the relative time (e.g., "2 hours ago")
  const timeAgo = formatRelativeTime(new Date(timestamp));

  return (
    <div onClick={onClick} className='flex flex-col gap-2 rounded-xl border border-gray-200 p-4 shadow-sm transition hover:bg-gray-50'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <UserAvatar
            user={{
              id: userId,
              name: userName || 'User',
              profileImage: userImage,
            }}
            size='sm'
          />
          <div>
            <p className='font-medium text-gray-900'>{userName}</p>
            <p className='text-xs text-gray-500'>User ID: {userId}</p>
          </div>
        </div>
        <span className='text-xs text-gray-500'>{timeAgo}</span>
      </div>

      <div className='mt-1 flex flex-col gap-3'>
        <p className='text-sm text-gray-600'>
          Status updated for <span className='font-medium'>{eventTitle}</span>
        </p>

        <div className='flex flex-row items-center gap-2 text-sm'>
          {prevStyle && (
            <>
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${prevStyle.bgColor} ${prevStyle.color}`}>
                {prevStyle.icon} {previousStatus}
              </span>

              <svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' className='text-gray-400' viewBox='0 0 16 16'>
                <path
                  fillRule='evenodd'
                  d='M1 8a.5.5 0 0 1 .5-.5h11.793l-3.147-3.146a.5.5 0 0 1 .708-.708l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 0 1-.708-.708L13.293 8.5H1.5A.5.5 0 0 1 1 8z'
                />
              </svg>
            </>
          )}

          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-1 ${newStyle.bgColor} ${newStyle.color}`}>
            {newStyle.icon} {newStatus}
          </span>
        </div>
      </div>

      <div className='mt-1'>
        <a href={`/room/${eventId}`} className='text-xs font-medium text-blue-600 hover:text-blue-800'>
          View event details →
        </a>
      </div>
    </div>
  );
}
