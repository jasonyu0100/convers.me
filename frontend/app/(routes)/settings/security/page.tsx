'use client';

import { AppRoute, RoutePageTemplate } from '@/app/components/router';
import { SettingsView } from '../SettingsView';

export default function Page() {
  return <RoutePageTemplate routeType={AppRoute.SETTINGS} Component={SettingsView} />;
}
