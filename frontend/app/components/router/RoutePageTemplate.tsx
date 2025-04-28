'use client';

import React from 'react';
import { AppRouter } from '../app/AppRouter';
import { AppRoute } from './RouteTypes';

interface RoutePageProps {
  routeType: AppRoute;
  Component: React.ComponentType;
}

/**
 * Standardized page template for route pages
 * Wraps route view components with AppRouter for consistent authentication and layout
 *
 * @example
 * // (routes)/feed/page.tsx
 * export default function Page() {
 *   return <RoutePageTemplate routeType={AppRoute.FEED} Component={FeedView} />
 * }
 */
export function RoutePageTemplate({ routeType, Component }: RoutePageProps) {
  return (
    <AppRouter routeType={routeType}>
      <Component />
    </AppRouter>
  );
}
