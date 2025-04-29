'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import StatusBadge from '@/app/components/ui/status/StatusBadge';
import { EventService } from '@/app/services/eventService';
import { EventSchema } from '@/app/types/schema';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface WeeklyScheduleProps {
  events?: EventSchema[];
}

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
        const todayFormatted = today.toISOString().split('T')[0];

        // Set end date as 7 days from today
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 7);
        const endDateFormatted = endDate.toISOString().split('T')[0];

        // Fetch events from the API
        const result = await EventService.getCalendarEvents(todayFormatted, endDateFormatted);

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

            // Calculate if event is today or in future
            const isToday = eventDate.getTime() === today.getTime();
            const isFuture = eventDate.getTime() > today.getTime();

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
              const aTime = new Date(a.startTime);
              const bTime = new Date(b.startTime);
              if (aTime < bTime) return -1;
              if (aTime > bTime) return 1;
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

  // Group events by day
  const groupedEvents = upcomingEvents.reduce((acc, event) => {
    const date = new Date(event.date);
    const dayOfWeek = date.getDay();
    if (!acc[dayOfWeek]) {
      acc[dayOfWeek] = [];
    }
    acc[dayOfWeek].push(event);
    return acc;
  }, {} as Record);

  // Get the current day of the week
  const today = new Date();
  const currentDayOfWeek = today.getDay();

  // Get the day letter for display
  const getDayLetter = (day: number) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
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

    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return `${month} ${dateDay}`;
    }
  };

  return (
    <div className='flex h-full w-[360px] flex-shrink-0 flex-col bg-white/80'>
      <div className='flex items-center justify-between p-4 pb-3'>
        <h2 className='text-sm font-medium text-slate-800'>Weekly Schedule</h2>
        <button
          className='flex items-center gap-1 text-xs text-slate-500 transition-all hover:text-blue-600'
          onClick={() => {
            app.setMainView(AppRoute.CALENDAR);
            router.push('/calendar');
          }}
        >
          View all
          <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='h-3 w-3'
          >
            <path d='m9 18 6-6-6-6' />
          </svg>
        </button>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center py-4 text-slate-400'>
          <div className='h-4 w-4 animate-spin rounded-full border border-slate-300 border-t-blue-500'></div>
          <span className='ml-2 text-xs'>Loading</span>
        </div>
      ) : upcomingEvents.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-8 text-center'>
          <CalendarDaysIcon className='h-6 w-6 text-slate-300' />
          <p className='mt-2 text-sm text-slate-500'>No upcoming events</p>
          <button
            className='mt-3 text-xs text-blue-600 hover:text-blue-700'
            onClick={() => {
              app.setMainView(AppRoute.SCHEDULE);
              router.push('/schedule');
            }}
          >
            Schedule an event
          </button>
        </div>
      ) : (
        <div className='flex-1 overflow-auto pr-1'>
          <div className='space-y-5 pb-4 pl-4'>
            {Array.from({ length: 7 }).map((_, dayIndex) => {
              const dayEvents = groupedEvents[dayIndex] || [];
              if (dayEvents.length === 0) return null;

              const dateStr = dayEvents[0]?.date || '';
              const isCurrentDay = dayIndex === currentDayOfWeek;

              return (
                <div className='flex' key={dayIndex}>
                  <div className='mr-3 flex flex-col items-center'>
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        isCurrentDay ? 'bg-blue-500 text-white' : dayIndex < currentDayOfWeek ? 'bg-slate-100 text-slate-400' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <span className='text-xs'>{getDayLetter(dayIndex)}</span>
                    </div>
                    {dayIndex < 6 && <div className='my-1 h-full w-px bg-slate-100'></div>}
                  </div>

                  <div className='flex-1 pr-3'>
                    <div className='mb-2'>
                      <span className={`text-xs ${isCurrentDay ? 'font-medium text-blue-600' : 'text-slate-500'}`}>
                        {formatDate(dateStr)}
                        {isCurrentDay && <span className='ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-blue-500'></span>}
                      </span>
                    </div>

                    <div className='space-y-1.5'>
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className='cursor-pointer rounded border-l-2 border-l-blue-500 bg-slate-50 px-3 py-2 transition-all hover:bg-white hover:shadow-sm'
                          onClick={() => {
                            router.push(`/room?id=${event.id}`);
                            app.setMainView(AppRoute.ROOM);
                          }}
                        >
                          <div className='flex items-center justify-between'>
                            <span className='text-xs font-medium text-slate-700'>{event.title}</span>
                            <span className='text-xs text-slate-400'>{event.time}</span>
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
        </div>
      )}
    </div>
  );
}
