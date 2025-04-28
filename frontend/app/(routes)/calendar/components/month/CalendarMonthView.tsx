import { useCallback, useEffect, useRef } from 'react';
import { CalendarEvent, CalendarMode, EventColor } from '../../../../types/calendar';
import { useCalendar } from '../../hooks';
import { dateUtils } from '../../utils/dateUtils';
import { CalendarMonthNoEvents } from './CalendarMonthNoEvents';

// Clean, compact list item for events
function ListEventItem({ event, onClick }: { event: CalendarEvent; onClick: (e: React.MouseEvent) => void }) {
  // Get color for the event
  const getColorIndicator = (color?: EventColor) => {
    const colorMap = {
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      pink: 'bg-pink-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
      orange: 'bg-orange-500',
      teal: 'bg-teal-500',
      indigo: 'bg-indigo-500',
      red: 'bg-red-500',
      emerald: 'bg-emerald-500',
      amber: 'bg-amber-500',
    };

    return color && colorMap[color] ? colorMap[color] : 'bg-slate-400';
  };

  const colorClass = getColorIndicator(event.color);

  // Format time to be more readable
  const formatTime = (timeRange: string) => {
    return timeRange.replace(' - ', '–'); // Use en dash instead of hyphen for time ranges
  };

  return (
    <div id={event.id} className='flex cursor-pointer items-center border-b border-slate-50 px-3 py-3 transition-colors hover:bg-slate-50' onClick={onClick}>
      {/* Color indicator */}
      <div className={`mr-3 h-10 w-1 rounded-full ${colorClass}`}></div>

      {/* Event time */}
      <div className='w-28 flex-shrink-0'>
        <div className='text-sm font-medium text-slate-600'>{formatTime(event.time)}</div>
        {/* Removed recurring event indicator - recurring events are no longer supported */}
      </div>

      {/* Event details */}
      <div className='min-w-0 flex-1'>
        <h3 className='truncate text-base font-medium text-slate-800'>{event.title}</h3>
        <div className='flex items-center text-xs text-slate-600'>
          <span className='truncate'>{event.participants.name}</span>
          {event.participants.count > 1 && <span className='ml-1 text-slate-400'>+{event.participants.count - 1}</span>}
        </div>
      </div>

      {/* Status indicator */}
      <div className='ml-3 flex-shrink-0'>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            event.status === 'ready' ? 'bg-green-50 text-green-700' : event.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
          }`}
        >
          {event.status === 'ready' && (
            <svg className='mr-1 h-2 w-2 text-green-500' fill='currentColor' viewBox='0 0 8 8'>
              <circle cx='4' cy='4' r='3' />
            </svg>
          )}
          {event.status === 'pending' && (
            <svg className='mr-1 h-2 w-2 text-amber-500' fill='currentColor' viewBox='0 0 8 8'>
              <circle cx='4' cy='4' r='3' />
            </svg>
          )}
          {event.status === 'done' && (
            <svg className='mr-1 h-2 w-2 text-blue-500' fill='currentColor' viewBox='0 0 8 8'>
              <circle cx='4' cy='4' r='3' />
            </svg>
          )}
          {event.status}
        </span>
      </div>
    </div>
  );
}

// Date section header for the list view
function ListDateHeader({ date, isToday, day }: { date: string; isToday: boolean; day: string }) {
  return (
    <div className='sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2'>
      <div className='flex items-center'>
        <div className={`text-base font-semibold ${isToday ? 'text-red-500' : 'text-slate-700'}`}>{date}</div>
        <div className='ml-2 text-sm text-slate-500'>{day}</div>
        {isToday && <div className='ml-2 rounded-full bg-red-50/50 px-2 py-0.5 text-xs font-medium text-red-500'>Today</div>}
      </div>

      {/* Right side actions for date */}
      <div className='flex items-center space-x-1'>
        <button className='rounded-full p-1 text-slate-500 hover:bg-slate-200' title='Add event'>
          <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='h-4 w-4'>
            <path d='M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z' />
          </svg>
        </button>
      </div>
    </div>
  );
}

export function CalendarMonthView() {
  const { eventsForCurrentMonth, handleEventClick, mode, setMode, currentDate, createNewEvent } = useCalendar();

  // Reference to the container div for keyboard focus
  const containerRef = useRef<HTMLDivElement>(null);

  // Set focus to the container div on mount
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  const setCalendarView = useCallback(() => {
    if (mode === CalendarMode.MONTH) {
      setMode(CalendarMode.WEEK);
    } else {
      setMode(CalendarMode.MONTH);
    }
  }, [mode, setMode]);

  // Log the events to help debug
  console.log(`Calendar Month View has ${eventsForCurrentMonth.length} events for display`);

  const hasEvents = eventsForCurrentMonth.length > 0;

  // Group events by day for the list view
  const groupEventsByDay = () => {
    const grouped: {
      [key: string]: { events: CalendarEvent[]; date: Date; isToday: boolean };
    } = {};

    eventsForCurrentMonth.forEach((event) => {
      if (!event.date) return;

      // Format date as "MMM DD" (e.g., "Jan 15")
      const dateStr = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
      }).format(event.date);

      const isToday = dateUtils.isToday(event.date);

      if (!grouped[dateStr]) {
        grouped[dateStr] = { events: [], date: new Date(event.date), isToday };
      }

      grouped[dateStr].events.push(event);
    });

    return grouped;
  };

  const groupedEvents = groupEventsByDay();

  // Sort days chronologically
  const eventDays = Object.keys(groupedEvents).sort((a, b) => {
    const dateA = groupedEvents[a].date;
    const dateB = groupedEvents[b].date;

    return dateA.getTime() - dateB.getTime();
  });

  // Sort events by time within each day
  Object.keys(groupedEvents).forEach((key) => {
    groupedEvents[key].events.sort((a, b) => {
      const timeA = a.time.split(' - ')[0];
      const timeB = b.time.split(' - ')[0];
      return timeA.localeCompare(timeB);
    });
  });

  // Reference for the scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} tabIndex={0} className='relative flex h-full w-full flex-col overflow-hidden bg-white/80 outline-none'>
      {hasEvents ? (
        <div ref={scrollContainerRef} className='flex h-full flex-col overflow-y-auto' id='events-container'>
          {/* Add event floating button */}
          <button
            onClick={createNewEvent}
            className='fixed right-5 bottom-5 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
            aria-label='Create new event'
            title='Create new event'
          >
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='h-6 w-6'>
              <path d='M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z' />
            </svg>
          </button>

          {/* Events list grouped by day */}
          {eventDays.map((dateStr) => {
            const { events, date, isToday } = groupedEvents[dateStr];

            // Get day name
            const day = new Intl.DateTimeFormat('en-US', {
              weekday: 'long',
            }).format(date);

            return (
              <div key={dateStr} className='flex flex-col'>
                <ListDateHeader date={dateStr} isToday={isToday} day={day} />

                <div className='flex flex-1 flex-col overflow-auto'>
                  {events.map((event) => (
                    <ListEventItem
                      key={event.id}
                      event={event}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEventClick(event);
                      }}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className='flex h-full flex-col'>
          <CalendarMonthNoEvents setToday={setCalendarView} />

          {/* Add event button when no events */}
          <div className='mt-4 flex justify-center'>
            <button
              onClick={createNewEvent}
              className='flex items-center rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none'
            >
              <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='mr-2 h-5 w-5'>
                <path d='M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z' />
              </svg>
              Create New Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
