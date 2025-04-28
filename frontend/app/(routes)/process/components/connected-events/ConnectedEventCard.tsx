import { CalendarDaysIcon, UsersIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { ConnectedEvent } from '../../../../types/process';

interface ConnectedEventCardProps {
  event: ConnectedEvent;
}

export function ConnectedEventCard({ event }: ConnectedEventCardProps) {
  // Format the date - handle both string and Date objects
  const formatDate = () => {
    if (!event.date) return 'No date';

    try {
      const eventDate = typeof event.date === 'string' ? new Date(event.date) : event.date;

      return eventDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch (e) {
      return String(event.date);
    }
  };

  const formattedDate = formatDate();

  // Format time if available
  const formatTime = () => {
    if (!event.time) return null;

    try {
      if (event.time.includes(':')) {
        const [hours, minutes] = event.time.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0);
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      } else {
        const timeDate = new Date(`1970-01-01T${event.time}`);
        return timeDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });
      }
    } catch (e) {
      return event.time;
    }
  };

  const timeString = formatTime();

  // Calculate progress percentage
  const progressPercentage = Math.round(event.progress * 100);

  // Get status info
  const getStatusInfo = () => {
    // First use the status from the event if available
    if (event.status) {
      const status = event.status.toLowerCase();

      if (status === 'done') {
        return {
          color: 'bg-green-500',
          text: 'Done',
          textColor: 'text-green-600',
        };
      }
      if (status === 'in_progress' || status === 'in progress' || status === 'active') {
        return {
          color: 'bg-blue-500',
          text: 'In Progress',
          textColor: 'text-blue-600',
        };
      }
      if (status === 'started') {
        return {
          color: 'bg-amber-400',
          text: 'Started',
          textColor: 'text-amber-600',
        };
      }
      if (status === 'not_started' || status === 'not started' || status === 'pending') {
        return {
          color: 'bg-slate-300',
          text: 'Not Started',
          textColor: 'text-slate-600',
        };
      }
      if (status === 'upcoming') {
        return {
          color: 'bg-purple-400',
          text: 'Upcoming',
          textColor: 'text-purple-600',
        };
      }
    }

    // Fall back to progress-based status if no status is provided
    if (progressPercentage === 100) {
      return {
        color: 'bg-green-500',
        text: 'Done',
        textColor: 'text-green-600',
      };
    }
    if (progressPercentage > 50) {
      return {
        color: 'bg-blue-500',
        text: 'In Progress',
        textColor: 'text-blue-600',
      };
    }
    if (progressPercentage > 0) {
      return {
        color: 'bg-amber-400',
        text: 'Started',
        textColor: 'text-amber-600',
      };
    }
    return {
      color: 'bg-slate-300',
      text: 'Not Started',
      textColor: 'text-slate-600',
    };
  };

  const status = getStatusInfo();

  return (
    <Link
      href={`/room?id=${event.id}`}
      className='group flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/80 transition-all hover:border-blue-200 hover:shadow-sm'
    >
      <div className='h-1 w-full bg-slate-100'>
        <div className={`h-full ${status.color} transition-all`} style={{ width: `${progressPercentage}%` }} />
      </div>

      <div className='flex flex-grow flex-col p-4'>
        <div className='mb-2 flex items-center justify-between'>
          <div className='flex items-center'>
            <div className={`h-1.5 w-1.5 rounded-full ${status.color} mr-1.5`}></div>
            <span className={`text-xs ${status.textColor}`}>{status.text}</span>
          </div>
          {progressPercentage > 0 && <span className='text-xs text-slate-500'>{progressPercentage}%</span>}
        </div>

        <h3 className='mb-2 truncate text-sm font-medium text-slate-800'>{event.name || 'Untitled Event'}</h3>

        <div className='mt-auto space-y-1.5 text-xs'>
          <div className='flex items-center text-slate-500'>
            <CalendarDaysIcon className='mr-1.5 h-3.5 w-3.5' />
            <span>{formattedDate}</span>
            {timeString && (
              <>
                <span className='mx-1 text-slate-300'>•</span>
                <span>{timeString}</span>
              </>
            )}
          </div>

          <div className='flex items-center text-slate-500'>
            <UsersIcon className='mr-1.5 h-3.5 w-3.5' />
            <span>
              {event.participants} {event.participants !== 1 ? 'participants' : 'participant'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
