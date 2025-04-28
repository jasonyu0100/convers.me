'use client';

import { AppRoute, RoutePageTemplate } from '@/app/components/router';
import { ProfileProvider } from './hooks/useProfile';
import { ProfileView } from './ProfileView';

/**
 * Root profile page component for direct URL access
 * Using RoutePageTemplate with a wrapped component to include the provider
 */
export default function Page() {
  return (
    <ProfileProvider>
      <RoutePageTemplate routeType={AppRoute.PROFILE} Component={ProfileView} />
    </ProfileProvider>
  );
}
