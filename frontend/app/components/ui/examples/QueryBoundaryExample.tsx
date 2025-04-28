'use client';

import React from 'react';
import { useApiQuery, QueryKeys } from '@/app/lib/reactQuery';
import { ProcessService } from '@/app/services';
import { QueryBoundary, withQueryBoundary } from '../loading/QueryBoundary';
import { ProcessSchema } from '@/app/types/schema';

// Example 1: Using QueryBoundary directly in a component
export function ProcessListExample() {
  // Use standardized API query hook
  const processesQuery = useApiQuery(QueryKeys.process.all, () => ProcessService.getTemplates());

  return (
    <div className='p-4'>
      <h2 className='mb-4 text-xl font-bold'>Processes</h2>

      {/* Wrap with QueryBoundary for automatic loading/error handling */}
      <QueryBoundary query={processesQuery}>
        {(processes) => (
          <div className='space-y-4'>
            {processes.length === 0 ? (
              <p>No processes found.</p>
            ) : (
              processes.map((process) => (
                <div key={process.id} className='rounded border p-3 shadow-sm'>
                  <h3 className='font-medium'>{process.title}</h3>
                  <p className='text-sm text-gray-600'>{process.description}</p>
                </div>
              ))
            )}
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}

// Example 2: Using the HOC pattern
function ProcessCard({ data }: { data: ProcessSchema }) {
  return (
    <div className='rounded border p-4 shadow-sm'>
      <h3 className='font-medium'>{data.title}</h3>
      <p className='text-gray-600'>{data.description}</p>
    </div>
  );
}

// Custom hook to fetch a single process
function useProcess(id: string) {
  return useApiQuery(QueryKeys.process.detail(id), () => ProcessService.getTemplateById(id));
}

// Create a wrapped version of ProcessCard with loading/error handling
export const ProcessCardWithBoundary = withQueryBoundary(ProcessCard, () => useProcess('some-process-id'), {
  loadingComponent: <div className='animate-pulse rounded border p-4'>Loading process...</div>,
  errorComponent: (error, retry) => (
    <div className='rounded border border-red-200 bg-red-50 p-4'>
      <p className='text-red-700'>Failed to load process</p>
      <button onClick={retry} className='mt-2 rounded bg-red-100 px-3 py-1 text-sm text-red-800 hover:bg-red-200'>
        Retry
      </button>
    </div>
  ),
});
