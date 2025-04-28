'use client';

import { AppRoute, RoutePageTemplate } from '@/app/components/router';
import { LoginView } from './LoginView';

/**
 * Root login page component for direct URL access
 * Uses the standardized RoutePageTemplate
 */
export default function Page() {
  return <RoutePageTemplate routeType={AppRoute.LOGIN} Component={LoginView} />;
}
