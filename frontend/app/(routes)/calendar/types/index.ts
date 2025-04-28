import { CalendarEvent, CalendarMode } from '@/app/types/calendar';

/**
 * Calendar route-specific context and component types
 */

export interface CalendarContextValue {
  // Data
  events: CalendarEvent[];
  selectedEvent: CalendarEvent | null;
  mode: CalendarMode;
  setMode: (mode: CalendarMode) => void;

  // Navigation
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

  // Event date helpers
  getEventsForDate: (date: number) => boolean;
  eventDates: Set;
  eventsForCurrentMonth: CalendarEvent[];

  // Get events for specific time periods
  getTomorrowEvents: () => CalendarEvent[];
  getUpcomingEvents: () => CalendarEvent[];
  getEventsForDay: (date: Date) => CalendarEvent[];

  // Filtering
  filter: string;
  filteredEvents: CalendarEvent[];

  // Actions
  setFilter: (filter: string) => void;
  selectEvent: (event: CalendarEvent | null) => void;
  handleEventClick: (event: CalendarEvent) => void;
  createNewEvent: () => void;

  // Loading and error handling
  isLoading?: boolean;
  error?: string | null;
  clearError?: () => void;
}

// Component-specific props types
export interface CalendarMonthViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  getEventsForDate: (day: number) => boolean;
  handleEventClick: (event: CalendarEvent) => void;
}

export interface CalendarMonthCardProps {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvents: boolean;
  onClick?: () => void;
}

export interface CalendarWeekViewProps {
  events: CalendarEvent[];
  currentDate: Date;
  handleEventClick: (event: CalendarEvent) => void;
}

export interface CalendarWeekDayProps {
  date: Date;
  events: CalendarEvent[];
  isToday: boolean;
  handleEventClick: (event: CalendarEvent) => void;
}

export interface CalendarEventsListProps {
  events: CalendarEvent[];
  handleEventClick: (event: CalendarEvent) => void;
  emptyMessage?: string;
}

export interface CalendarHeaderProps {
  title: string;
  mode: CalendarMode;
  onModeChange: (mode: CalendarMode) => void;
  onNextClick: () => void;
  onPrevClick: () => void;
  subtitle: string;
  onFilterChange: (filter: string) => void;
  filter: string;
  onCreateEvent: () => void;
}
