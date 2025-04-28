'use client';

import { formatDate } from '@/app/lib/utils';
import { EventStatus } from '@/app/types/shared';
import { useEffect, useState } from 'react';

interface StatusLogEntry {
  id: string;
  previousStatus?: EventStatus;
  newStatus: EventStatus;
  eventId: string;
  userId?: string;
  userName?: string;
  createdAt: string;
}

interface StatusHistoryProps {
  eventId: string;
  logs?: StatusLogEntry[];
  className?: string;
}

// Define status colors
const statusColors: Record = {
  Pending: '#FEF3C7', // yellow-100
  Planning: '#DBEAFE', // blue-100
  Execution: '#E0E7FF', // indigo-100
  Review: '#EDE9FE', // purple-100
  Administrative: '#F3F4F6', // gray-100
  Done: '#D1FAE5', // green-100
  execution: '#DBEAFE', // blue-100
  upcoming: '#D5F5F6', // teal-100
  done: '#D1FAE5', // green-100
  ready: '#CFFAFE', // cyan-100
};

export default function StatusHistory({ eventId, logs = [], className = '' }: StatusHistoryProps) {
  const [statusLogs, setStatusLogs] = useState<StatusLogEntry[]>(logs);

  // If no logs were provided, we could fetch them here
  useEffect(() => {
    // If logs were provided as props, use them
    if (logs.length > 0) {
      setStatusLogs(logs);
      return;
    }

    // Otherwise we could fetch them from the API
    // This is just a placeholder for the actual implementation
    async function fetchStatusLogs() {
      try {
        const response = await fetch(`/api/events/${eventId}/status-logs`);
        if (response.ok) {
          const data = await response.json();
          setStatusLogs(data);
        }
      } catch (error) {
        console.error('Error fetching status logs:', error);
      }
    }

    // Only fetch if no logs were provided as props
    if (logs.length === 0) {
      fetchStatusLogs();
    }
  }, [eventId, logs]);

  if (statusLogs.length === 0) {
    return (
      <div className={`rounded-lg border border-gray-200 p-4 ${className}`}>
        <p className='text-center text-gray-500'>No status history available</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-gray-200 p-4 ${className}`}>
      <h3 className='mb-4 text-lg font-medium text-gray-900'>Status History</h3>

      <div className='relative'>
        {/* Status Timeline */}
        <div className='absolute top-0 left-2.5 h-full w-0.5 bg-gray-200'></div>

        <ul className='space-y-4'>
          {statusLogs.map((log, index) => {
            const date = new Date(log.createdAt);
            const formattedDate = formatDate(date);
            const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <li key={log.id} className='ml-6'>
                {/* Status Circle */}
                <span
                  className='absolute -left-1 flex h-5 w-5 items-center justify-center rounded-full ring-4 ring-white'
                  style={{ backgroundColor: statusColors[log.newStatus] || '#F3F4F6' }}
                />

                {/* Status Content */}
                <div className='rounded-lg border border-gray-200 bg-white/80 p-3 shadow-sm'>
                  <div className='mb-1 flex items-center justify-between text-sm'>
                    <span className='font-medium text-gray-900'>
                      {log.previousStatus ? (
                        <>
                          Changed from <b>{log.previousStatus}</b> to <b>{log.newStatus}</b>
                        </>
                      ) : (
                        <>
                          Initial status: <b>{log.newStatus}</b>
                        </>
                      )}
                    </span>
                    <time className='text-xs text-gray-500'>
                      {formattedDate} at {formattedTime}
                    </time>
                  </div>

                  {log.userId && <p className='text-xs text-gray-500'>By: {log.userName || log.userId}</p>}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
