'use client';

import { RoutePageTemplate } from '@/app/components/router';
import { AppRoute } from '@/app/components/router/RouteTypes';
import { MarketView } from './MarketView';
import { MarketProvider } from './hooks/useMarketContext';

/**
 * Library page component
 * Sets up the library provider and renders the library view
 */
export default function LibraryPage() {
  return (
    <MarketProvider>
      <RoutePageTemplate routeType={AppRoute.MARKET} Component={MarketView} />
    </MarketProvider>
  );
}
