'use client';

import { AppRoute, RoutePageTemplate } from '@/app/components/router';
import { CalendarView } from './CalendarView';
import { CalendarProvider } from './hooks';

/**
 * Root calendar page component for direct URL access
 * Uses the standardized RoutePageTemplate with CalendarProvider
 */
export default function Page() {
  return (
    <CalendarProvider>
      <RoutePageTemplate routeType={AppRoute.CALENDAR} Component={CalendarView} />
    </CalendarProvider>
  );
}
