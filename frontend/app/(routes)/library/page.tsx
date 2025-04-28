'use client';

import { RoutePageTemplate } from '@/app/components/router';
import { AppRoute } from '@/app/components/router/RouteTypes';
import { LibraryView } from './LibraryView';
import { LibraryProvider } from './hooks/useLibraryContext';

export default function LibraryPage() {
  return (
    <LibraryProvider>
      <RoutePageTemplate routeType={AppRoute.LIBRARY} Component={LibraryView} />
    </LibraryProvider>
  );
}
