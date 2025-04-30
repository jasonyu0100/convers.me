'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { Divider } from '@/app/components/ui/dividers/Divider';
import StatusBadge from '@/app/components/ui/status/StatusBadge';
import { EventService } from '@/app/services/eventService';
import { EventSchema } from '@/app/types/schema';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

interface WeeklyScheduleProps {
  events?: EventSchema[];
}

/**
 * Weekly schedule component for the feed sidebar
 * Shows upcoming events grouped by day
 */
export function FeedWeeklySchedule({ events: initialEvents }: WeeklyScheduleProps) {
  const router = useRouter();
  const app = useApp();
  const [upcomingEvents, setUpcomingEvents] = useState<EventSchema[]>(initialEvents || []);
  const [isLoading, setIsLoading] = useState(!initialEvents);

  useEffect(() => {
    const fetchEvents = async () => {
      if (initialEvents) {
        setUpcomingEvents(initialEvents);
        return;
      }

      try {
        setIsLoading(true);

        // Get today's date
        const today = new Date();

        // Set date range to 7 days before and 7 days after today (15 days total)
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);

        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 7);

        // Format dates as YYYY-MM-DD for API
        const startDateString = startDate.toISOString().split('T')[0];
        const endDateString = endDate.toISOString().split('T')[0];

        // Fetch events from the API
        const result = await EventService.getCalendarEvents(startDateString, endDateString);

        if (result.error) {
          console.error('Error fetching events:', result.error);
          return;
        }

        if (result.data) {
          // Get today's date (without time)
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Process and deduplicate events
          const processedEvents = new Map();

          result.data.forEach((event) => {
            // Parse event date
            let eventDate;
            if (event.startTime) {
              eventDate = new Date(event.startTime);
            } else if (event.date) {
              eventDate = new Date(event.date);
            } else {
              // Skip events without a date
              return;
            }
            eventDate.setHours(0, 0, 0, 0);

            // Calculate if event is today or in future using ISO date strings
            // This avoids timezone issues when comparing dates
            const eventDateISO = eventDate.toISOString().split('T')[0];
            const todayISO = today.toISOString().split('T')[0];
            const isToday = eventDateISO === todayISO;
            const isFuture = eventDateISO > todayISO;

            // Skip past events
            if (!isToday && !isFuture) return;

            // Create a unique key to prevent duplicates
            const key = event.id || `${event.title}-${event.startTime || event.date}-${event.time || ''}`;

            // Only add if not already in the map
            if (!processedEvents.has(key)) {
              processedEvents.set(key, {
                ...event,
                eventDate,
                isToday,
                isFuture,
              });
            }
          });

          // Convert Map back to array and sort by date and then time
          const sortedEvents = Array.from(processedEvents.values()).sort((a, b) => {
            // First sort by eventDate
            if (a.eventDate < b.eventDate) return -1;
            if (a.eventDate > b.eventDate) return 1;

            // If same day, try to use startTime for more precise sorting
            if (a.startTime && b.startTime) {
              // Using Date constructor directly can lead to timezone issues
              // Directly compare ISO time strings instead
              if (a.startTime < b.startTime) return -1;
              if (a.startTime > b.startTime) return 1;
            }

            // Fall back to time string
            if ((a.time || '') < (b.time || '')) return -1;
            if ((a.time || '') > (b.time || '')) return 1;

            return 0;
          });

          setUpcomingEvents(sortedEvents);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, [initialEvents]);

  // Create a ref for the today's events container
  const todayRef = useRef<HTMLDivElement>(null);

  // Group events by date (today and 7 days in advance)
  const groupedEvents = upcomingEvents.reduce((acc, event) => {
    let date;
    if (event.startTime) {
      date = new Date(event.startTime);
    } else if (event.date) {
      date = new Date(event.date);
    } else {
      // Skip events without a date
      return acc;
    }
    // Reset time part to get just the date for grouping
    date.setHours(0, 0, 0, 0);
    const dateKey = date.toISOString().split('T')[0]; // use YYYY-MM-DD as key

    // Only include today and upcoming 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get date 7 days from today
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    // Skip if the event is in the past or more than 7 days in the future
    if (date < today || date > nextWeek) {
      return acc;
    }

    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record);

  // Get today's date key - ensure we're using local timezone
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = today.toISOString().split('T')[0];

  // Sort the date keys to ensure chronological order
  const sortedDateKeys = Object.keys(groupedEvents).sort();

  // Get the full day name for display
  const getDayName = (date: Date) => {
    const day = date.getDay();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[day];
  };

  // Format dates for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateDay = date.getDate();
    const month = date.toLocaleString('default', { month: 'short' });

    // Compare using ISO date strings to avoid time zone issues
    const dateISOString = date.toISOString().split('T')[0];
    const todayISOString = today.toISOString().split('T')[0];
    const tomorrowISOString = tomorrow.toISOString().split('T')[0];

    if (dateISOString === todayISOString) {
      return 'Today';
    } else if (dateISOString === tomorrowISOString) {
      return 'Tomorrow';
    } else {
      return `${month} ${dateDay}`;
    }
  };

  return (
    <div className='flex w-[360px] flex-shrink-0 flex-col border-r-1 border-slate-200 bg-white/80 p-6 backdrop-blur-xl'>
      {/* Header section */}
      <div className='mb-4'>
        <h2 className='mb-1 text-base font-semibold text-gray-900'>Upcoming Schedule</h2>
        <div className='flex justify-between'>
          <p className='text-sm text-slate-500'>Events for the next 7 days</p>
          <button
            className='text-sm font-medium text-blue-600 hover:text-blue-700'
            onClick={() => {
              app.setMainView(AppRoute.CALENDAR);
              router.push('/calendar');
            }}
          >
            View calendar
          </button>
        </div>
      </div>

      {/* Events section */}
      <div className='flex-1 overflow-y-auto pr-2'>
        {isLoading ? (
          <div className='flex items-center justify-center py-8 text-slate-400'>
            <div className='h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500'></div>
            <span className='ml-3 text-sm'>Loading events</span>
          </div>
        ) : upcomingEvents.length === 0 || Object.keys(groupedEvents).length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12 text-center'>
            <div className='mb-3 rounded-full bg-slate-100 p-3'>
              <CalendarDaysIcon className='h-6 w-6 text-slate-400' />
            </div>
            <span className='text-sm font-medium text-slate-600'>No upcoming events</span>
            <p className='mt-1 text-xs text-slate-400'>Your schedule is clear for the next 7 days</p>
          </div>
        ) : (
          <div className='space-y-4'>
            {sortedDateKeys.map((dateKey) => {
              const dateEvents = groupedEvents[dateKey] || [];
              if (dateEvents.length === 0) return null;

              const date = new Date(dateKey);
              const dayOfWeek = date.getDay();
              const isCurrentDay = dateKey === todayKey;

              return (
                <div
                  key={dateKey}
                  ref={isCurrentDay ? todayRef : null}
                  className={`rounded-lg border bg-white shadow-sm transition-all ${
                    isCurrentDay ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200'
                  }`}
                >
                  {/* Top colored bar */}
                  <div
                    className={`h-1.5 w-full rounded-t-lg bg-gradient-to-r ${isCurrentDay ? 'from-blue-600 to-indigo-600' : 'from-slate-300 to-slate-400'}`}
                  ></div>

                  <div className='p-3'>
                    <div className='mb-2 flex items-center'>
                      <div className={`mr-2 flex items-center justify-center font-medium ${isCurrentDay ? 'text-blue-600' : 'text-slate-600'}`}>
                        {getDayName(date)}:
                      </div>
                      <span className={`text-sm font-medium ${isCurrentDay ? 'text-blue-600' : 'text-slate-600'}`}>{formatDate(dateKey)}</span>
                    </div>

                    <div className='space-y-2 pl-2'>
                      {dateEvents.map((event) => (
                        <div
                          key={event.id}
                          className='group cursor-pointer rounded-md border border-slate-100 p-2 transition-all hover:border-blue-100 hover:bg-blue-50'
                          onClick={() => {
                            router.push(`/room?id=${event.id}`);
                            app.setMainView(AppRoute.ROOM);
                          }}
                        >
                          <div className='flex items-center justify-between'>
                            <span className='text-sm font-medium text-slate-700 group-hover:text-blue-700'>{event.title}</span>
                            {event.time && <span className='text-xs text-slate-500'>{event.time}</span>}
                          </div>
                          {event.status && (
                            <div className='mt-1'>
                              <StatusBadge status={event.status as any} size='xs' />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className='mt-6'>
        <Divider className='mb-5 opacity-50' />
        <button
          onClick={() => {
            app.setMainView(AppRoute.SCHEDULE);
            router.push('/schedule');
          }}
          className='flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow'
        >
          <CalendarDaysIcon className='mr-2 h-4 w-4' />
          Schedule New Event
        </button>
      </div>
    </div>
  );
}
