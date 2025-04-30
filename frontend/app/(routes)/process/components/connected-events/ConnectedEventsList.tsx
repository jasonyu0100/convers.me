import { CalendarDaysIcon, ChevronRightIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { ConnectedEvent } from '../../../../types/process';
import { ConnectedEventCard } from './ConnectedEventCard';
import { useState } from 'react';

interface ConnectedEventsListProps {
  events: ConnectedEvent[];
}

export function ConnectedEventsList({ events }: ConnectedEventsListProps) {
  const [showAllEvents, setShowAllEvents] = useState(false);

  if (!events?.length) {
    return (
      <div className='mt-6 pt-6'>
        <div className='mb-3 flex items-center'>
          <CalendarDaysIcon className='mr-2 h-4 w-4 text-slate-500' />
          <h3 className='text-sm font-medium text-slate-700'>Events Based on This Process</h3>
        </div>

        <div className='rounded-lg bg-white p-4 text-center'>
          <p className='text-xs text-slate-500'>No events have been created from this template yet.</p>
        </div>
      </div>
    );
  }

  const displayedEvents = showAllEvents ? events : events.slice(0, 6);

  return (
    <div className='mt-6 pt-6'>
      <div className='mb-3 flex items-center justify-between'>
        <div className='flex items-center'>
          <CalendarDaysIcon className='mr-2 h-4 w-4 text-blue-500' />
          <h3 className='text-sm font-medium text-slate-700'>
            Events Based on This Process <span className='text-slate-500'>({events.length})</span>
          </h3>
        </div>
      </div>

      <div className='space-y-3'>
        <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
          {displayedEvents.map((event) => (
            <ConnectedEventCard key={event.id} event={event} />
          ))}
        </div>

        {events.length > 6 && (
          <div className='flex justify-center'>
            <button onClick={() => setShowAllEvents(!showAllEvents)} className='flex items-center gap-1 text-xs font-medium text-blue-500 hover:text-blue-600'>
              {showAllEvents ? 'Show less' : `View all ${events.length} events`}
              {showAllEvents ? <ChevronUpIcon className='h-3.5 w-3.5' /> : <ChevronRightIcon className='h-3.5 w-3.5' />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
