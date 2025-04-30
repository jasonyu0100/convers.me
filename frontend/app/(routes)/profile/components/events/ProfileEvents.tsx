import { EventCard } from '@/app/components/ui/events';
import { useProfile } from '../../hooks';

/**
 * Empty state component for when there are no events
 */
function EmptyEventsState() {
  return (
    <div className='flex flex-col items-center justify-center px-4 py-12 text-center'>
      <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50'>
        <svg xmlns='http://www.w3.org/2000/svg' className='h-8 w-8 text-blue-500' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
          />
        </svg>
      </div>
      <h3 className='mb-1 text-lg font-medium text-gray-900'>No Events Found</h3>
      <p className='max-w-md text-sm text-gray-500'>
        You don't have any events for the selected time period. Try selecting a different time period or create a new event.
      </p>
    </div>
  );
}

/**
 * Component for displaying events in the profile
 * To be shown when the Events tab is selected
 */
export function ProfileEvents() {
  const { events, selectedYear, selectedQuarter, selectedMonth, selectedWeek, handleEventClick, handleTagClick } = useProfile();

  if (events.length === 0) {
    return <EmptyEventsState />;
  }

  return (
    <div className='px-8 py-5'>
      <div className='grid grid-cols-1 gap-5 md:grid-cols-2'>
        {events.map((event) => (
          <div key={event.id} className='rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md'>
            <EventCard
              id={event.id}
              title={event.title}
              date={event.date}
              duration={event.duration}
              tags={event.tags}
              description={event.description}
              participants={event.participants}
              complexity={event.complexity}
              onEventClick={handleEventClick}
              onTagClick={handleTagClick}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
