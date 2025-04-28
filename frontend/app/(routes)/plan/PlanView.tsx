'use client';

import { AppHeader } from '@/app/components/app/AppHeader';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { PlanForm } from './components/PlanForm';
import { PlanSchedule } from './components/PlanSchedule';
import { usePlan, usePlanHeader } from './hooks';

/**
 * Content component that uses the plan context
 */
export function PlanView() {
  const { isLoading, error, clearError, hasGeneratedPlan } = usePlan();
  const headerProps = usePlanHeader();

  // Handle loading state
  if (isLoading) {
    return (
      <div className='flex h-full w-full flex-col'>
        <AppHeader title={headerProps.title} />
        <PageLoading />
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className='flex h-full w-full flex-col'>
        <AppHeader title={headerProps.title} />
        <ErrorDisplay error={error} title='Plan Error' onRetry={clearError} />
      </div>
    );
  }

  return (
    <div className='flex h-full w-full flex-col'>
      <AppHeader
        title={headerProps.title}
        searchPlaceholder={headerProps.searchPlaceholder}
        searchValue={headerProps.searchValue}
        onSearchChange={headerProps.onSearchChange}
        onSearchSubmit={headerProps.onSearchSubmit}
      />
      <div className='flex flex-1 flex-col overflow-hidden'>
        {hasGeneratedPlan ? (
          <div className='flex h-full w-full flex-col overflow-hidden lg:flex-row'>
            <div className='h-full w-full overflow-auto border-b border-slate-200 lg:w-1/2 lg:border-r lg:border-b-0'>
              <PlanForm />
            </div>
            <div className='h-full w-full overflow-auto lg:w-1/2'>
              <PlanSchedule />
            </div>
          </div>
        ) : (
          <div className='h-full w-full overflow-auto'>
            <PlanForm />
          </div>
        )}
      </div>
    </div>
  );
}
