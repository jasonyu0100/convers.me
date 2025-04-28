'use client';

import { AppRoute, RoutePageTemplate } from '@/app/components/router';
import { PlanView } from './PlanView';
import { PlanProvider } from './hooks';

/**
 * Root plan page component for direct URL access
 * Uses the standardized RoutePageTemplate
 */
export default function Page() {
  return (
    <PlanProvider>
      <RoutePageTemplate routeType={AppRoute.PLAN} Component={PlanView} />
    </PlanProvider>
  );
}
