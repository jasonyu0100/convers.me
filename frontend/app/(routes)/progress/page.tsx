'use client';

import { AppRoute, RoutePageTemplate } from '@/app/components/router';
import { ProgressView } from './ProgressView';
import { ProgressProvider } from './hooks/useProgress';

/**
 * Root progress page component for direct URL access
 * Uses the standardized RoutePageTemplate with ProgressProvider
 */
export default function Page() {
  return (
    <ProgressProvider>
      <RoutePageTemplate routeType={AppRoute.PROGRESS} Component={ProgressView} />
    </ProgressProvider>
  );
}
