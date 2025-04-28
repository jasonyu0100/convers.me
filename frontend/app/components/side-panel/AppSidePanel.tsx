'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { Suspense } from 'react';
import { DefaultSidePanel } from './default/DefaultSidePanel';
import { AppSidePanelProps, PanelLoadingProps, RoutePanelMap } from './types';

// Import all route-specific panels
import { CalendarSidePanel } from './calendar/CalendarSidePanel';
import { LiveSidePanel } from './live/LiveSidePanel';

/**
 * Simple loading component for Suspense fallback
 */
function PanelLoading({ message = 'Loading panel...' }: PanelLoadingProps) {
  return (
    <div className='px-4 py-4 text-sm text-slate-500' role='status'>
      <span>{message}</span>
    </div>
  );
}

/**
 * Route to panel component mapping
 * Centralizes all route-specific panel components
 */
const ROUTE_PANELS: RoutePanelMap = {
  [AppRoute.LIVE]: LiveSidePanel,
  [AppRoute.CALENDAR]: CalendarSidePanel,
};

/**
 * Main side panel view that renders the appropriate panel based on current route
 */
export function AppSidePanelView({ className = '' }: AppSidePanelProps) {
  const app = useApp();

  // Get the panel component for the current route
  const PanelComponent = ROUTE_PANELS[app.mainView];

  return (
    <aside className={`flex h-full w-[300px] flex-shrink-0 flex-col overflow-auto py-4 pl-4 ${className}`}>
      <Suspense fallback={<PanelLoading />}>{PanelComponent ? <PanelComponent /> : <DefaultSidePanel />}</Suspense>
    </aside>
  );
}
