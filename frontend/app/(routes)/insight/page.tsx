'use client';

import { AppRoute, RoutePageTemplate } from '@/app/components/router';
import { InsightView } from './InsightView';
import { InsightProvider } from './hooks/useInsight';

/**
 * Root performance page component for direct URL access
 * Uses the standardized RoutePageTemplate with InsightProvider
 */
export default function Page() {
  return (
    <InsightProvider>
      <RoutePageTemplate routeType={AppRoute.INSIGHT} Component={InsightView} />
    </InsightProvider>
  );
}
