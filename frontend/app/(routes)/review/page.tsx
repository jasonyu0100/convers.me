'use client';

import { AppRoute, RoutePageTemplate } from '@/app/components/router';
import { ReviewView } from './ReviewView';
import { ReviewProvider } from './hooks/useReview';

/**
 * Root review page component for direct URL access
 * Uses the standardized RoutePageTemplate with ReviewProvider
 */
export default function Page() {
  return (
    <ReviewProvider>
      <RoutePageTemplate routeType={AppRoute.BASE} Component={ReviewView} />
    </ReviewProvider>
  );
}
