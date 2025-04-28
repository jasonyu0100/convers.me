'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { ProcessService } from '@/app/services';
import { Process } from '@/app/types/process';
import { CalendarDaysIcon, DocumentTextIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Divider } from '../../ui';
import { SidePanelActionButton, SidePanelLayout, SidePanelSection } from '../common';
import { DefaultSidePanelProps } from '../types';

/**
 * Sidebar action buttons for quick access to common functions
 */
function ActionButtons() {
  return (
    <div className='flex flex-col space-y-3'>
      <SidePanelActionButton
        label='Plan Week'
        icon={<CalendarDaysIcon className='size-6' />}
        route='/plan'
        appRoute={AppRoute.PLAN}
        bgColor='bg-gradient-to-r from-slate-500 to-slate-600'
        hoverColor='hover:from-slate-600 hover:to-slate-700'
      />
      <SidePanelActionButton
        label='Schedule Time'
        icon={<MapPinIcon className='size-6' />}
        route='/schedule'
        appRoute={AppRoute.SCHEDULE}
        bgColor='bg-gradient-to-r from-blue-500 to-blue-600'
        hoverColor='hover:from-blue-600 hover:to-blue-700'
      />
    </div>
  );
}

/**
 * Section displaying favorite processes
 */
function FavoriteProcesses() {
  const router = useRouter();
  const app = useApp();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch favorited template processes with React Query
  const { data: processes = [], isLoading: isFetchingProcesses } = useQuery({
    queryKey: ['favoriteTemplates'],
    queryFn: async () => {
      // Use getTemplates instead of getProcesses to ensure we only get templates
      // and pass favorite=true parameter to filter for favorites
      const result = await ProcessService.getTemplates({
        skip: 0,
        limit: 3,
        favorite: true,
      });
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
  });

  const calculateCompletion = (process: Process) => {
    if (!process.steps || process.steps.length === 0) return 0;

    let totalItems = process.steps.length;
    let completedItems = process.steps.filter((step) => step.completed).length;

    // Count substeps
    process.steps.forEach((step) => {
      if (step.subSteps && step.subSteps.length > 0) {
        totalItems += step.subSteps.length;
        completedItems += step.subSteps.filter((subStep) => subStep.completed).length;
      }
    });

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const handleSchedule = (processId: string) => {
    app.setMainView(AppRoute.SCHEDULE);
    router.push(`/schedule?processId=${processId}`);
  };

  if (isFetchingProcesses) {
    return (
      <SidePanelSection title='FAVORITE TEMPLATES'>
        <div className='py-4 text-center text-gray-500'>
          <div className='inline-block h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600'></div>
          <p className='mt-2 text-sm'>Loading templates...</p>
        </div>
      </SidePanelSection>
    );
  }

  if (processes.length === 0) {
    return (
      <SidePanelSection title='FAVORITE TEMPLATES'>
        <div className='py-4 text-center text-gray-500'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50'>
            <DocumentTextIcon className='h-6 w-6 text-blue-400' />
          </div>
          <p className='text-sm'>No favorite templates</p>
          <p className='mx-auto mt-1 max-w-[220px] text-xs text-slate-500'>Add process templates to favorites to track them here</p>
          <button
            className='mt-3 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow'
            onClick={() => {
              app.setMainView(AppRoute.PROCESS);
              router.push('/process');
            }}
          >
            Browse processes
          </button>
        </div>
      </SidePanelSection>
    );
  }

  return (
    <SidePanelSection title='FAVORITE TEMPLATES'>
      <div className='space-y-3'>
        {processes.map((process) => {
          const stepCount = process.steps?.length || 0;
          const completion = calculateCompletion(process);

          return (
            <div
              key={process.id}
              className='group flex cursor-pointer flex-col rounded-xl border border-slate-200/60 bg-white/80 p-3 transition-all hover:translate-y-[-1px] hover:border-blue-200 hover:shadow-md'
              onClick={() => handleSchedule(process.id)}
            >
              <div className='mb-1.5 flex items-center justify-between'>
                <div className='flex w-[80%] items-center gap-2'>
                  <div className={`h-3 w-3 flex-shrink-0 rounded-full ${process.color || 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}></div>
                  <h3 className='truncate text-sm font-medium text-slate-700'>{process.title}</h3>
                </div>

                <div className='flex gap-1'>
                  <button
                    className='flex items-center justify-center rounded-full bg-blue-50 p-1 text-blue-600 transition-all group-hover:scale-105 hover:bg-blue-100 hover:text-blue-700'
                    title='Schedule Event'
                    aria-label='Schedule Event'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSchedule(process.id);
                    }}
                  >
                    <CalendarDaysIcon className='h-3.5 w-3.5' />
                  </button>
                </div>
              </div>

              <div className='mb-0.5 flex items-center gap-2'>
                <div className='flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-500'>
                  <DocumentTextIcon className='mr-1 h-2.5 w-2.5' />
                  {stepCount} {stepCount === 1 ? 'step' : 'steps'}
                </div>

                <div className={`h-1.5 w-1.5 rounded-full ${completion === 100 ? 'bg-green-500' : 'bg-amber-400'}`}></div>
              </div>

              <div className='mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100'>
                <div className='h-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all' style={{ width: `${completion}%` }}></div>
              </div>
            </div>
          );
        })}

        <div className='mt-1 flex justify-end'>
          <button
            onClick={() => {
              app.setMainView(AppRoute.PROCESS);
              router.push('/process');
            }}
            className='text-xs text-blue-600 hover:text-blue-800 hover:underline'
          >
            View all
          </button>
        </div>
      </div>
    </SidePanelSection>
  );
}

/**
 * Default side panel component
 * Shown when no specific route panel is active
 */
export function DefaultSidePanel({ title }: DefaultSidePanelProps) {
  return (
    <SidePanelLayout>
      {title && <h2 className='mb-4 text-lg font-bold text-slate-700'>{title}</h2>}
      <ActionButtons />
      <Divider />
      <FavoriteProcesses />
    </SidePanelLayout>
  );
}
