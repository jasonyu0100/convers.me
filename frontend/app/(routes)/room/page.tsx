'use client';

import { AppRoute, RoutePageTemplate } from '@/app/components/router';
import { RoomView } from './RoomView';
import { RoomProvider } from './hooks';

/**
 * Root room page component for direct URL access
 * Uses the standardized RoutePageTemplate
 */
export default function Page() {
  return (
    <RoomProvider>
      <RoutePageTemplate routeType={AppRoute.ROOM} Component={RoomView} />
    </RoomProvider>
  );
}
