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
    <div className='flex w-[360px] flex-shrink-0 flex-col border-l border-slate-200/50 bg-white/80 p-6 shadow-sm backdrop-blur-xl' style={{ height: '100%' }}>
      <div className='mb-6 flex items-center justify-between'>
        <h2 className='text-sm font-semibold tracking-wider text-slate-700 uppercase'>
          <span className='bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>Weekly Schedule</span>
        </h2>
        <button
          className='flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600'
          onClick={() => {
            app.setMainView(AppRoute.CALENDAR);
            router.push('/calendar');
          }}
        >
          All Events
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
        <div className='py-4 text-center text-gray-500'>
          <div className='inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600'></div>
          <p className='mt-2 text-sm'>Loading schedule...</p>
        </div>
      ) : upcomingEvents.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-10 text-center'>
          <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50'>
            <CalendarDaysIcon className='h-8 w-8 text-blue-400' />
          </div>
          <p className='text-sm font-medium text-slate-600'>No upcoming events this week</p>
          <p className='mt-1.5 mb-3 max-w-[220px] text-xs text-slate-500'>Schedule new events to fill your week</p>
          <button
            className='mt-1 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow'
            onClick={() => {
              app.setMainView(AppRoute.SCHEDULE);
              router.push('/schedule');
            }}
          >
            Schedule an event
          </button>
        </div>
      ) : (
        <div className='space-y-4 overflow-auto' style={{ maxHeight: 'calc(100% - 160px)' }}>
          {/* Week Overview */}
          {Array.from({ length: 7 }).map((_, dayIndex) => {
            const dayEvents = groupedEvents[dayIndex] || [];
            if (dayEvents.length === 0) return null;

            const dateStr = dayEvents[0]?.date || '';
            const isCurrentDay = dayIndex === currentDayOfWeek;

            return (
              <div className='flex' key={dayIndex}>
                <div className='mr-4 flex flex-col items-center'>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-white ${
                      isCurrentDay
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 ring-4 ring-blue-100'
                        : dayIndex < currentDayOfWeek
                        ? 'bg-slate-400'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}
                  >
                    <span className='text-xs font-medium'>{getDayLetter(dayIndex)}</span>
                  </div>
                  {dayIndex < 6 && <div className='h-full w-0.5 bg-slate-200'></div>}
                </div>

                <div className='flex-1'>
                  <div className={`rounded-xl p-4 ${isCurrentDay ? 'bg-white shadow-md' : 'bg-white shadow-sm'}`}>
                    <div className='mb-2 flex items-center'>
                      <span className={`text-sm font-medium ${isCurrentDay ? 'text-blue-700' : 'text-slate-700'}`}>{formatDate(dateStr)}</span>
                      {isCurrentDay && (
                        <span className='ml-auto rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700'>
                          <span className='flex items-center'>
                            <span className='mr-1 flex h-2 w-2 rounded-full bg-amber-500'></span>
                            Today
                          </span>
                        </span>
                      )}
                    </div>

                    <div className='space-y-2'>
                      {dayEvents.map((event) => (
                        <div
                          key={event.id}
                          className='group flex cursor-pointer items-center rounded-lg border border-slate-200 bg-white/90 p-3 transition-all duration-200 hover:translate-y-[-2px] hover:shadow-md active:translate-y-[1px]'
                          onClick={() => {
                            router.push(`/room?id=${event.id}`);
                            app.setMainView(AppRoute.ROOM);
                          }}
                        >
                          <div className='flex-1'>
                            <div className='flex items-center justify-between'>
                              <span className='text-sm font-medium text-slate-700 group-hover:text-blue-700'>{event.title}</span>
                              <span className='text-xs text-slate-500'>{event.time}</span>
                            </div>
                            {event.status && (
                              <div className='mt-1.5'>
                                <StatusBadge status={event.status as any} size='xs' />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
