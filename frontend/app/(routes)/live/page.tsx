'use client';

import { AppRoute, RoutePageTemplate } from '@/app/components/router';
import { LiveView } from './LiveView';
import { LiveProvider } from './hooks';

/**
 * Root live conversation page component for direct URL access
 * Uses the standardized RoutePageTemplate
 */
export default function Page() {
  return (
    <LiveProvider>
      <RoutePageTemplate routeType={AppRoute.LIVE} Component={LiveView} />
    </LiveProvider>
  );
}
