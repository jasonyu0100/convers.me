'use client';

import { AppRoute, RoutePageTemplate } from '@/app/components/router';
import { FeedView } from './FeedView';
import { FeedProvider } from './hooks';

/**
 * Root home page component for direct URL access
 */
export default function Page() {
  return (
    <FeedProvider>
      <RoutePageTemplate routeType={AppRoute.FEED} Component={FeedView} />
    </FeedProvider>
  );
}
