'use client';

import { AppRoute, RoutePageTemplate } from '@/app/components/router';
import { ScheduleView } from './ScheduleView';
import { ScheduleProvider } from './hooks';

/**
 * Root schedule page component for direct URL access
 * Uses the standardized RoutePageTemplate
 */
export default function Page() {
  return (
    <ScheduleProvider>
      <RoutePageTemplate routeType={AppRoute.SCHEDULE} Component={ScheduleView} />
    </ScheduleProvider>
  );
}
