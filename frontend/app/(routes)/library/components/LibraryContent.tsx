'use client';

import { useAuth } from '@/app/hooks/useAuth';
import { useLibrary } from '../hooks/useLibrary';

export function LibraryContent() {
  const { processes, selectedCategory, categories, handleProcessSelect } = useLibrary();
  const { isAuthenticated } = useAuth();

  // Get the selected category name
  const categoryName = categories.find((c) => c.id === selectedCategory)?.name || 'All Templates';

  return (
    <div className='flex-1 overflow-y-auto p-8'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-slate-900'>{categoryName}</h1>
        <p className='mt-2 text-slate-600'>Explore workflow templates and processes that you can use with convers.me to streamline your work.</p>
      </div>

      <div className='grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3'>
        {processes.map((process) => (
          <div
            key={process.id}
            className='group overflow-hidden rounded-xl border border-slate-200 bg-white/80 shadow-sm transition-all hover:border-blue-200 hover:shadow-md'
          >
            <div className='border-b border-slate-100 bg-slate-50 p-5'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white'>
                  {process.icon}
                </div>
                <h3 className='text-lg font-semibold text-slate-900'>{process.title}</h3>
              </div>
              <p className='mt-3 text-sm text-slate-600'>{process.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
