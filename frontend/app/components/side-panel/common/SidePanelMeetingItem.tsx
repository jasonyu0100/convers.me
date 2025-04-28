'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { useRouter } from 'next/navigation';
import { SidePanelMeetingItemProps } from './types';

/**
 * Reusable meeting item component for the side panel
 * Used for both upcoming and completed meetings
 */
export function SidePanelMeetingItem({ id, title, time, avatarColor, isUpcoming, isPast, onClick }: SidePanelMeetingItemProps) {
  const router = useRouter();
  const app = useApp();

  const handleClick = () => {
    // Execute custom onClick if provided
    if (onClick) {
      onClick();
    } else {
      // Default behavior: navigate to room with the meeting id
      router.push(`/room?id=${id}`);
      app.setMainView(AppRoute.ROOM);
    }
  };

  return (
    <div
      className='flex cursor-pointer flex-row items-center space-x-2 rounded border border-transparent px-1 py-1 transition-colors duration-200 hover:border-slate-100 hover:bg-slate-50'
      onClick={handleClick}
      role='button'
      aria-label={`Meeting: ${title}`}
    >
      {/* Meeting icon */}
      <div className={`h-5 w-5 rounded-sm ${avatarColor.includes('bg-') ? avatarColor : 'bg-blue-400'} flex-shrink-0`} />

      <div className='flex min-w-0 flex-1'>
        <div className='flex w-full flex-col'>
          <p className='truncate text-xs font-medium text-slate-700'>{title}</p>
          {time && (
            <div className='flex w-full justify-between'>
              <p className='max-w-[95%] truncate text-[10px] text-slate-500'>{time}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
