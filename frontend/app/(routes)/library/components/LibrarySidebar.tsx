'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { Divider } from '@/app/components/ui/dividers/Divider';
import { ArrowLeftIcon, BookmarkIcon, CalendarDaysIcon, FolderIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useLibrary } from '../hooks/useLibrary';
import { CheckIcon } from '@heroicons/react/24/outline';

export function LibrarySidebar() {
  const { categories, selectedCategory, setSelectedCategory, setSelectedCollection } = useLibrary();
  const router = useRouter();
  const app = useApp();

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Reset the selected collection when changing categories
    setSelectedCollection(null);
  };

  return (
    <div className='flex w-[360px] flex-shrink-0 flex-col border-r border-slate-200/50 bg-gradient-to-b from-white/95 to-white/90 p-5 backdrop-blur-xl'>
      <div className='mb-5'>
        <div className='mb-4'>
          <h3 className='text-lg font-semibold text-slate-800'>Categories</h3>
        </div>

        <div className='space-y-1'>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`group flex w-full items-center rounded-lg px-4 py-2.5 text-left text-sm transition-all ${
                selectedCategory === category.id ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={() => handleCategorySelect(category.id)}
            >
              <div
                className={`mr-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border bg-white/80 transition-colors ${
                  selectedCategory === category.id ? 'border-blue-200' : 'border-gray-200 group-hover:border-blue-100'
                }`}
              >
                {selectedCategory === category.id && <CheckIcon className='h-4 w-4 text-blue-600' />}
              </div>
              <span className={selectedCategory === category.id ? 'font-medium' : ''}>{category.name}</span>

              {/* Category counter */}
              <span className={`ml-auto text-xs ${selectedCategory === category.id ? 'text-blue-500' : 'text-gray-400'}`}>
                {category.id === 'all'
                  ? '7'
                  : category.id === 'project-management' || category.id === 'management' || category.id === 'engineering'
                  ? '3'
                  : category.id === 'design' || category.id === 'research' || category.id === 'product'
                  ? '2'
                  : '1'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className='mt-auto pt-6'>
        <Divider className='opacity-50' />
        <button
          onClick={() => {
            app.setMainView(AppRoute.SCHEDULE);
            router.push('/schedule');
          }}
          className='mt-5 flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-indigo-700 hover:shadow'
        >
          <CalendarDaysIcon className='mr-2 h-4 w-4' />
          Schedule Event
        </button>
      </div>
    </div>
  );
}
