'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { createRouteContext } from '@/app/components/router/createRouteContext';
import { useRouteComponent } from '@/app/components/router/useRouteComponent';
import { CalendarService } from '@/app/services';
import { EventSchema } from '@/app/types/schema';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarEvent, CalendarMode } from '../../../types/calendar';

// Helper to convert EventSchema to CalendarEvent
const convertToCalendarEvent = (event: EventSchema): CalendarEvent => {
  // Ensure date is properly parsed - prefer startTime but fall back to date for backwards compatibility
  let eventDate;
  try {
    // Use startTime if available, otherwise use date field
    if (event.startTime) {
      eventDate = new Date(event.startTime);
    } else if (event.date) {
      // Legacy - use date field
      eventDate = new Date(event.date);
    } else {
      eventDate = new Date();
    }

    // Verify the date is valid
    if (isNaN(eventDate.getTime())) {
      console.error(`Invalid date for event ${event.id}`);
      eventDate = new Date(); // Fallback to current date
    }
  } catch (error) {
    console.error(`Error parsing date for event ${event.id}: ${error}`);
    eventDate = new Date(); // Fallback to current date
  }

  // Extract end time if available
  let eventEndTime;
  try {
    if (event.endTime) {
      eventEndTime = new Date(event.endTime);
    }
  } catch (error) {
    console.error(`Error parsing end time for event ${event.id}: ${error}`);
  }

  return {
    id: event.id,
    title: event.title,
    description: event.description || '',
    date: eventDate,
    startTime: event.startTime ? new Date(event.startTime) : undefined,
    endTime: eventEndTime,
    time: event.time || '',
    status: event.status || 'pending',
    color: event.color || '#4f46e5',
    topics: Array.isArray(event.topics) ? event.topics.map((t) => (typeof t === 'string' ? t : t.name)) : [],
    participants: {
      count: Array.isArray(event.participants) ? event.participants.length : 0,
      name:
        Array.isArray(event.participants) && event.participants.length > 0 && event.participants[0].user ? event.participants[0].user.name : 'No participants',
    },
    // Removed recurring property - recurring events are no longer supported
  };
};

// Create the context using the standardized factory function
const { Provider, useRouteContext } = createRouteContext<CalendarContextValue>('Calendar', {
  // Default values that will never be used directly (only used for TypeScript)
  events: [],
  mode: CalendarMode.MONTH,
  setMode: () => {},
  selectedEvent: null,
  currentDate: new Date(),
  setCurrentDate: () => {},
  monthName: new Date().toLocaleString('default', { month: 'long' }),
  year: new Date().getFullYear(),
  nextMonth: () => {},
  prevMonth: () => {},
  nextWeek: () => {},
  prevWeek: () => {},
  nextDay: () => {},
  prevDay: () => {},
  nextEvent: () => {},
  prevEvent: () => {},
  getEventsForDate: () => false,
  eventDates: new Set<string>(),
  eventsForCurrentMonth: [],
  getTomorrowEvents: () => [],
  getUpcomingEvents: () => [],
  getEventsForDay: () => [],
  filter: '',
  filteredEvents: [],
  setFilter: () => {},
  selectEvent: () => {},
  handleEventClick: () => {},
  createNewEvent: () => {},
  isLoading: false,
  error: null,
  clearError: () => {},
});

// Provider props
interface CalendarProviderProps {
  children: ReactNode;
}

/**
 * Context type for calendar
 */
interface CalendarContextValue {
  events: CalendarEvent[];
  mode: CalendarMode;
  setMode: (mode: CalendarMode) => void;
  selectedEvent: CalendarEvent | null;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  monthName: string;
  year: number;
  nextMonth: () => void;
  prevMonth: () => void;
  nextWeek: () => void;
  prevWeek: () => void;
  nextDay: () => void;
  prevDay: () => void;
  nextEvent: () => void;
  prevEvent: () => void;
  getEventsForDate: (day: number) => boolean;
  eventDates: Set;
  eventsForCurrentMonth: CalendarEvent[];
  getTomorrowEvents: () => CalendarEvent[];
  getUpcomingEvents: () => CalendarEvent[];
  getEventsForDay: (date: Date) => CalendarEvent[];
  filter: string;
  filteredEvents: CalendarEvent[];
  setFilter: (value: string) => void;
  selectEvent: (event: CalendarEvent | null) => void;
  handleEventClick: (event: CalendarEvent) => void;
  createNewEvent: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Filter events based on search text
 */
function filterEvents(events: CalendarEvent[], filter: string): CalendarEvent[] {
  if (!filter) return events;

  const searchTerm = filter.toLowerCase();
  return events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchTerm) ||
      event.topics.some((topic) => topic.toLowerCase().includes(searchTerm)) ||
      event.participants.name.toLowerCase().includes(searchTerm),
  );
}

/**
 * Provider component for calendar context
 */
export function CalendarProvider({ children }: CalendarProviderProps) {
  const app = useApp();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Use standardized route component utilities for error and loading states
  const { error, handleError, clearError } = useRouteComponent();

  // State
  const [mode, setMode] = useState(CalendarMode.WEEK);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filter, setFilter] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get current user from app context instead of making a separate API call
  const currentUser = app.currentUser;

  // Get month name and year
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const year = currentDate.getFullYear();

  // Calculate date range for the current view
  const getDateRange = useCallback(() => {
    const month = currentDate.getMonth();
    const year = currentDate.getFullYear();

    // Start date is first day of current month
    const startDate = new Date(year, month, 1);

    // End date is last day of next month
    let endMonth = month + 1;
    let endYear = year;
    if (endMonth > 11) {
      endMonth = 0;
      endYear += 1;
    }
    const endDate = new Date(endYear, endMonth + 1, 0);

    // Format dates for API
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    return { startDateStr, endDateStr };
  }, [currentDate]);

  // Fetch events with React Query
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendarEvents', getDateRange().startDateStr, getDateRange().endDateStr],
    queryFn: async () => {
      const { startDateStr, endDateStr } = getDateRange();

      console.log(`Calendar fetching events from ${startDateStr} to ${endDateStr}`);

      const result = await CalendarService.getCalendarEvents(startDateStr, endDateStr);

      if (result.error) {
        throw new Error(result.error);
      }

      const calendarEvents = (result.data || []).map(convertToCalendarEvent);
      console.log(`Loaded ${calendarEvents.length} events for calendar`);

      return calendarEvents;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Prefetch adjacent months when current month changes
  useEffect(() => {
    const prefetchAdjacentMonths = async () => {
      const month = currentDate.getMonth();
      const year = currentDate.getFullYear();

      // Prefetch previous month
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const prevStartDate = new Date(prevYear, prevMonth, 1);
      const prevEndDate = new Date(year, month, 0);

      // Prefetch next month
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const nextStartDate = new Date(nextYear, nextMonth, 1);
      const nextEndDate = new Date(nextYear, nextMonth + 1, 0);

      // Format dates for API
      const prevStartDateStr = prevStartDate.toISOString().split('T')[0];
      const prevEndDateStr = prevEndDate.toISOString().split('T')[0];
      const nextStartDateStr = nextStartDate.toISOString().split('T')[0];
      const nextEndDateStr = nextEndDate.toISOString().split('T')[0];

      // Prefetch previous month
      queryClient.prefetchQuery({
        queryKey: ['calendarEvents', prevStartDateStr, prevEndDateStr],
        queryFn: async () => {
          const result = await CalendarService.getCalendarEvents(prevStartDateStr, prevEndDateStr);
          if (result.error) throw new Error(result.error);
          return (result.data || []).map(convertToCalendarEvent);
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
      });

      // Prefetch next month
      queryClient.prefetchQuery({
        queryKey: ['calendarEvents', nextStartDateStr, nextEndDateStr],
        queryFn: async () => {
          const result = await CalendarService.getCalendarEvents(nextStartDateStr, nextEndDateStr);
          if (result.error) throw new Error(result.error);
          return (result.data || []).map(convertToCalendarEvent);
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
      });
    };

    prefetchAdjacentMonths();
  }, [currentDate.getMonth(), currentDate.getFullYear(), queryClient]);

  // Create a set of dates that have events
  const eventDates = useMemo(() => {
    const dateSet = new Set<string>();

    events.forEach((event) => {
      // Use startTime if available, otherwise fall back to date
      const eventDate = event.startTime || event.date;
      if (eventDate) {
        const dateKey = `${eventDate.getFullYear()}-${eventDate.getMonth()}-${eventDate.getDate()}`;
        dateSet.add(dateKey);
      }
    });

    return dateSet;
  }, [events]);

  // Filter events for the current month view
  const eventsForCurrentMonth = useMemo(() => {
    // Filter events for the current month
    const filtered = events.filter((event) => {
      // Use startTime if available, otherwise fall back to date
      const eventDate = event.startTime || event.date;

      // Skip events with invalid dates
      if (!eventDate || isNaN(eventDate.getTime())) {
        console.warn(`Skipping event with invalid date: ${event.id} - ${event.title}`);
        return false;
      }

      return eventDate.getMonth() === currentDate.getMonth() && eventDate.getFullYear() === currentDate.getFullYear();
    });

    return filtered;
  }, [events, currentDate]);

  // Helper function to get tomorrow's events
  const getTomorrowEvents = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    return events.filter((event) => {
      // Use startTime if available, otherwise fall back to date
      const eventDate = event.startTime || event.date;
      if (!eventDate) return false;

      return eventDate.getDate() === tomorrow.getDate() && eventDate.getMonth() === tomorrow.getMonth() && eventDate.getFullYear() === tomorrow.getFullYear();
    });
  }, [events]);

  // Helper function to get upcoming events (next 7 days)
  const getUpcomingEvents = useCallback(() => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    return events.filter((event) => {
      // Use startTime if available, otherwise fall back to date
      const eventDate = event.startTime || event.date;
      if (!eventDate) return false;

      return eventDate >= today && eventDate <= nextWeek;
    });
  }, [events]);

  // Helper function to get events for a specific day
  const getEventsForDay = useCallback(
    (date: Date) => {
      return events.filter((event) => {
        // Use startTime if available, otherwise fall back to date
        const eventDate = event.startTime || event.date;
        if (!eventDate) return false;

        return eventDate.getDate() === date.getDate() && eventDate.getMonth() === date.getMonth() && eventDate.getFullYear() === date.getFullYear();
      });
    },
    [events],
  );

  // Helper function to check if a specific date has events
  const getEventsForDate = useCallback(
    (day: number): boolean => {
      if (!day) return false;

      const dateKey = `${year}-${currentDate.getMonth()}-${day}`;
      return eventDates.has(dateKey);
    },
    [currentDate, year, eventDates],
  );

  // Filter events based on search term
  const filteredEvents = useMemo(() => {
    return filterEvents(events, filter);
  }, [events, filter]);

  // Select an event with error handling
  const selectEvent = useCallback(
    (event: CalendarEvent | null) => {
      try {
        setSelectedEvent(event);
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  // Filter events with error handling
  const handleSetFilter = useCallback(
    (value: string) => {
      try {
        setFilter(value);
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  // Handle clicking on an event with error handling
  const handleEventClick = useCallback(
    (event: CalendarEvent) => {
      try {
        selectEvent(event);
        app.setMainView(AppRoute.ROOM);
        router.push(`/room?id=${event.id}`);
      } catch (error) {
        handleError(error);
      }
    },
    [app, router, selectEvent, handleError],
  );

  // Create a new event with error handling
  const createNewEvent = useCallback(() => {
    try {
      app.setMainView(AppRoute.SCHEDULE);
      router.push('/schedule');
    } catch (error) {
      handleError(error);
    }
  }, [app, router, handleError]);

  // Month navigation handlers with error handling
  const nextMonth = useCallback(() => {
    try {
      const nextMonthIndex = currentDate.getMonth() + 1;
      const yearToUse = nextMonthIndex > 11 ? year + 1 : year;
      const monthToUse = nextMonthIndex > 11 ? 0 : nextMonthIndex;

      // Always set to first day of month
      setCurrentDate(new Date(yearToUse, monthToUse, 1));
    } catch (error) {
      handleError(error);
    }
  }, [currentDate, year, handleError]);

  const prevMonth = useCallback(() => {
    try {
      const prevMonthIndex = currentDate.getMonth() - 1;
      const yearToUse = prevMonthIndex < 0 ? year - 1 : year;
      const monthToUse = prevMonthIndex < 0 ? 11 : prevMonthIndex;

      // Always set to first day of month
      setCurrentDate(new Date(yearToUse, monthToUse, 1));
    } catch (error) {
      handleError(error);
    }
  }, [currentDate, year, handleError]);

  // Week navigation handlers with error handling
  const nextWeek = useCallback(() => {
    try {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);

      // Get the day of the week (0 is Sunday, 1 is Monday, etc.)
      const dayOfWeek = newDate.getDay();

      // Calculate days to subtract to get to Monday
      // If Sunday (0), go back 6 days to previous Monday
      // If Monday (1), go back 0 days
      // If Tuesday (2), go back 1 day, etc.
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      // Set date to Monday of that week
      newDate.setDate(newDate.getDate() - daysToSubtract);

      setCurrentDate(newDate);
    } catch (error) {
      handleError(error);
    }
  }, [currentDate, handleError]);

  const prevWeek = useCallback(() => {
    try {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);

      // Get the day of the week (0 is Sunday, 1 is Monday, etc.)
      const dayOfWeek = newDate.getDay();

      // Calculate days to subtract to get to Monday
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

      // Set date to Monday of that week
      newDate.setDate(newDate.getDate() - daysToSubtract);

      setCurrentDate(newDate);
    } catch (error) {
      handleError(error);
    }
  }, [currentDate, handleError]);

  const nextDay = useCallback(() => {
    try {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 1);
      setCurrentDate(newDate);
    } catch (error) {
      handleError(error);
    }
  }, [currentDate, handleError]);

  const prevDay = useCallback(() => {
    try {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 1);
      setCurrentDate(newDate);
    } catch (error) {
      handleError(error);
    }
  }, [currentDate, handleError]);

  const nextEvent = useCallback(() => {
    try {
      // Find all events with dates (either startTime or date)
      const eventsWithDates = events.filter((event) => event.startTime || event.date);

      // Sort events by date (using startTime if available, otherwise date)
      const sortedEvents = [...eventsWithDates].sort((a, b) => {
        const aDate = a.startTime || a.date;
        const bDate = b.startTime || b.date;
        return aDate!.getTime() - bDate!.getTime();
      });

      // Find the next event after current date
      const nextEvent = sortedEvents.find((event) => {
        // We need to compare just the date part, not the time
        const eventDate = event.startTime || event.date!;
        const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

        const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

        // Find the first event that occurs strictly after the current date
        return eventDateOnly.getTime() > currentDateOnly.getTime();
      });

      // If a next event is found, update the current date to match that event's date
      if (nextEvent) {
        const eventDate = nextEvent.startTime || nextEvent.date!;
        setCurrentDate(new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()));
      }
    } catch (error) {
      handleError(error);
    }
  }, [currentDate, events, handleError]);

  const prevEvent = useCallback(() => {
    try {
      // Find all events with dates (either startTime or date)
      const eventsWithDates = events.filter((event) => event.startTime || event.date);

      // Sort events by date in reverse order (using startTime if available, otherwise date)
      const sortedEvents = [...eventsWithDates].sort((a, b) => {
        const aDate = a.startTime || a.date;
        const bDate = b.startTime || b.date;
        return bDate!.getTime() - aDate!.getTime();
      });

      // Find the previous event before current date
      const prevEvent = sortedEvents.find((event) => {
        // We need to compare just the date part, not the time
        const eventDate = event.startTime || event.date!;
        const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());

        const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

        // Find the first event that occurs strictly before the current date
        return eventDateOnly.getTime() < currentDateOnly.getTime();
      });

      // If a previous event is found, update the current date to match that event's date
      if (prevEvent) {
        const eventDate = prevEvent.startTime || prevEvent.date!;
        setCurrentDate(new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate()));
      }
    } catch (error) {
      handleError(error);
    }
  }, [currentDate, events, handleError]);

  // Context value
  const contextValue: CalendarContextValue = {
    // Data
    events,
    mode,
    setMode,
    selectedEvent,
    currentDate,
    setCurrentDate,
    monthName,
    year,

    // Navigation
    nextDay,
    prevDay,
    nextMonth,
    prevMonth,
    nextWeek,
    prevWeek,
    nextEvent,
    prevEvent,

    // Event helpers
    getEventsForDate,
    eventDates,
    eventsForCurrentMonth,
    getTomorrowEvents,
    getUpcomingEvents,
    getEventsForDay,

    // Filtering
    filter,
    filteredEvents,
    setFilter: handleSetFilter,

    // Actions
    selectEvent,
    handleEventClick,
    createNewEvent,

    // Error handling
    isLoading,
    error,
    clearError,
  };

  return <Provider value={contextValue}>{children}</Provider>;
}

/**
 * Hook for accessing calendar context
 */
export function useCalendar() {
  return useRouteContext();
}
