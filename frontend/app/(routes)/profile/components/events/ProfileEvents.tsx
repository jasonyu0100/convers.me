import { EventCard } from '@/app/components/ui/events';
import { useProfile } from '../../hooks/useProfile';

/**
 * Component for displaying events in the profile
 * To be shown when the Events tab is selected
 */
export function ProfileEvents() {
  const { events, selectedYear, selectedQuarter, selectedWeek, handleEventClick, handleTagClick } = useProfile();

  // Create period string for showing timeframe
  const getPeriodText = () => {
    let periodText = `Q${selectedQuarter} ${selectedYear}`;
    if (selectedWeek) {
      periodText += ` - Week ${selectedWeek}`;
    }
    return periodText;
  };

  return (
    <div className='flex flex-col space-y-5'>
      <div className='flex items-center justify-between'>
        <h2 className='text-lg font-medium text-slate-800'>Events</h2>
        <span className='rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-600'>{getPeriodText()}</span>
      </div>

      {events.length === 0 ? (
        <div className='flex h-40 items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white/80 p-6 text-center'>
          <div>
            <p className='text-gray-500'>No events found for this period</p>
            <p className='mt-1 text-sm text-gray-400'>Try selecting a different time period</p>
          </div>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          {events.map((event) => (
            <EventCard
              key={event.id}
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
          ))}
        </div>
      )}
    </div>
  );
}
