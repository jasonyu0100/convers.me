import React, { useState, useCallback, useMemo } from 'react';
import { EventSchema } from '@/app/types/schema';
import { CalendarDaysIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useFeed } from '../../hooks';

interface EventsListItemProps {
  event: EventSchema;
}

// Move status style maps outside component to avoid recreation
const STATUS_MAP = {
  done: {
    color: 'text-emerald-700',
    bg: 'bg-emerald-500',
    border: 'border-emerald-500',
  },
  'in progress': {
    color: 'text-blue-700',
    bg: 'bg-blue-500',
    border: 'border-blue-500',
  },
  execution: {
    color: 'text-blue-700',
    bg: 'bg-blue-500',
    border: 'border-blue-500',
  },
  pending: {
    color: 'text-amber-700',
    bg: 'bg-amber-500',
    border: 'border-amber-500',
  },
  planning: {
    color: 'text-amber-700',
    bg: 'bg-amber-500',
    border: 'border-amber-500',
  },
  cancelled: {
    color: 'text-red-700',
    bg: 'bg-red-500',
    border: 'border-red-500',
  },
};

const DEFAULT_STATUS = {
  color: 'text-gray-500',
  bg: 'bg-gray-200',
  border: 'border-gray-300',
};

// Helper function for formatting dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Memoized topic component to prevent unnecessary re-renders
const EventTopic = React.memo(({ topic }: { topic: { id: string; name: string } }) => (
  <span className='rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600'>{topic.name}</span>
));
EventTopic.displayName = 'EventTopic';

const EventsListItem = React.memo(({ event }: EventsListItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { handleEventClick } = useFeed();

  // Handler functions
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);
  const handleClick = useCallback(() => handleEventClick(event.id), [handleEventClick, event.id]);

  // Get status styles - memoized to avoid recreating on every render
  const statusStyles = useMemo(() => {
    if (!event.status) return DEFAULT_STATUS;
    const statusKey = event.status.toLowerCase();
    return STATUS_MAP[statusKey] || DEFAULT_STATUS;
  }, [event.status]);

  // Memoize the formatted date to prevent recalculation
  const formattedDate = useMemo(() => formatDate(event.date), [event.date]);

  // Memoize the topics section to prevent unnecessary re-renders
  const topicsSection = useMemo(() => {
    if (!event.topics || event.topics.length === 0) return null;

    return (
      <div className='flex flex-wrap gap-1'>
        {event.topics.slice(0, 2).map((topic) => (
          <EventTopic key={topic.id} topic={topic} />
        ))}
        {event.topics.length > 2 && <span className='text-xs text-slate-500'>+{event.topics.length - 2}</span>}
      </div>
    );
  }, [event.topics]);

  return (
    <div
      className={`flex flex-col rounded-xl border ${statusStyles.border} bg-white/80 p-4 shadow-sm transition-all duration-200 ${
        isHovered ? 'scale-[1.01] shadow-md' : 'shadow-sm'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      role='button'
      tabIndex={0}
      aria-label={`View event: ${event.title}`}
    >
      <div className='mb-2 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className={`h-2.5 w-2.5 rounded-full ${statusStyles.bg}`}></span>
          <span className={`text-xs font-medium ${statusStyles.color}`}>{event.status || 'No Status'}</span>
        </div>
        <span className='flex items-center text-xs text-slate-500'>
          <CalendarDaysIcon className='mr-1 h-3.5 w-3.5' />
          {formattedDate}
        </span>
      </div>

      <h3 className='mb-1.5 line-clamp-1 text-base font-semibold text-slate-800'>{event.title}</h3>

      {event.description && <p className='mb-3 line-clamp-2 text-sm text-slate-600'>{event.description}</p>}

      <div className='mt-auto flex items-center justify-between'>
        <div className='flex flex-wrap items-center gap-1'>{topicsSection}</div>

        {event.duration && (
          <span className='ml-auto flex items-center text-xs text-slate-500'>
            <ClockIcon className='mr-1 h-3.5 w-3.5' />
            {event.duration}
          </span>
        )}
      </div>
    </div>
  );
});

EventsListItem.displayName = 'EventsListItem';

export { EventsListItem };
