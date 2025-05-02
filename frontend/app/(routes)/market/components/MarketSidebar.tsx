'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { Divider } from '@/app/components/ui/dividers/Divider';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { CategoryList } from './categories/CategoryList';

/**
 * Sidebar component for the library view
 * Shows categories and action buttons
 */
export function MarketSidebar() {
  const router = useRouter();
  const app = useApp();

  return (
    <div className='border-r-1 flex w-[360px] flex-shrink-0 flex-col border-slate-200 bg-white/80 p-6 backdrop-blur-xl'>
      {/* Categories section */}
      <div className='flex-1 overflow-y-auto pr-2'>
        <CategoryList />
      </div>

      {/* Action buttons */}
      <div className='mt-6'>
        <Divider className='mb-5 opacity-50' />
        <button
          onClick={() => {
            app.setMainView(AppRoute.SCHEDULE);
            router.push('/schedule');
          }}
          className='flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 font-medium text-sm text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow'
        >
          <CalendarDaysIcon className='mr-2 h-4 w-4' />
          Schedule Event
        </button>
      </div>
    </div>
  );
}
