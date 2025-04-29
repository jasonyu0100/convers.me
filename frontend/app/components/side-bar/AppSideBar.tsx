'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { CalendarIcon, ChartBarIcon, GlobeAltIcon, HomeIcon, MapIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { AppSideBarProfile } from './AppSideBarProfile';
import { AppSideBarToggle } from './AppSideBarToggle';
import { AppSideBarProps, SideBarButtonProps, SideBarNavButtonProps, SideBarNavItem } from './types';

/**
 * Basic sidebar button component
 *
 * Renders a clickable button with active state styling.
 * Used as the foundation for all sidebar navigation items.
 */
export function SideBarButton({ children, onClick, label, title, isActive, hideLabel = false }: SideBarButtonProps) {
  return (
    <div
      className={`flex h-[4rem] w-[5rem] cursor-pointer flex-col items-center justify-center rounded-[1rem] transition-colors duration-200 ${
        isActive ? 'bg-blue-100 text-blue-600' : 'text-blue-900 hover:bg-blue-50'
      }`}
      onClick={onClick}
      title={title || label}
      role='button'
      aria-label={label}
      aria-pressed={isActive}
    >
      {children}
      {!hideLabel && <span className='mt-1 text-xs font-medium'>{label}</span>}
    </div>
  );
}

/**
 * Navigation sidebar button with route handling
 *
 * Extends the base SideBarButton with navigation capabilities.
 * Handles route changes and app state updates when clicked.
 * Optimized to avoid unnecessary re-renders by checking current path.
 */
export function SideBarNavButton({ children, onClick, label, route, appRoute, title }: SideBarNavButtonProps) {
  const router = useRouter();
  const app = useApp();
  const isActive = typeof window !== 'undefined' && window.location.pathname === route;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    // First update the app context
    onClick(e);

    // Set app route if provided
    if (appRoute) {
      app.setMainView(appRoute);
    }

    // Only navigate when needed to avoid redundant renders
    const currentPath = window.location.pathname;
    if (currentPath !== route) {
      // Use replace for authenticated users to avoid building navigation history
      if (app.isAuthenticated) {
        router.replace(route);
      } else {
        router.push(route);
      }
    }
  };

  return (
    <SideBarButton onClick={handleClick} label={label} title={title} isActive={isActive}>
      {children}
    </SideBarButton>
  );
}

/**
 * Main navigation items for the sidebar
 *
 * Centralized configuration for all navigation elements.
 * Each item defines its label, route path, app route constant,
 * and icon component to display.
 */
const NAV_ITEMS: SideBarNavItem[] = [
  {
    label: 'Home',
    route: '/feed',
    appRoute: AppRoute.FEED,
    icon: <HomeIcon className='size-5' />,
  },
  {
    label: 'Calendar',
    route: '/calendar',
    appRoute: AppRoute.CALENDAR,
    icon: <CalendarIcon className='size-5' />,
  },
  {
    label: 'Process',
    route: '/process',
    appRoute: AppRoute.PROCESS,
    icon: <MapIcon className='size-5' />,
  },
  {
    label: 'Library',
    route: '/library',
    appRoute: AppRoute.LIBRARY,
    icon: <GlobeAltIcon className='size-5' />,
  },
  {
    label: 'Insight',
    route: '/insight',
    appRoute: AppRoute.INSIGHT,
    icon: <ChartBarIcon className='size-5' />,
  },
];

/**
 * Main sidebar component that displays navigation and profile controls
 *
 * Renders the application's primary navigation bar with:
 * - App sidebar toggle for collapsing/expanding
 * - Navigation buttons for all main sections
 * - User profile section at the bottom
 *
 * The sidebar maintains a fixed width and takes the full height
 * of its container, with items arranged in a vertical column.
 */
export function AppSideBarView({ className = '' }: AppSideBarProps) {
  // Add a custom click handler for Process navigation
  const handleProcessClick = () => {
    // If we're in the Library view, try to find and reset the LibraryContext
    if (typeof window !== 'undefined') {
      const libraryContext = (window as any).__LIBRARY_CONTEXT__;
      if (libraryContext && typeof libraryContext.setSelectedCollection === 'function') {
        libraryContext.setSelectedCollection(null);
      }
    }
  };

  return (
    <div className={`flex h-full w-[6rem] flex-shrink-0 flex-col items-center justify-between border-r-1 border-slate-200 py-4 ${className}`}>
      <div className='flex flex-col items-center space-y-[1rem]'>
        <AppSideBarToggle />
        {/* Render navigation items from the centralized array */}
        {NAV_ITEMS.map((item) => (
          <SideBarNavButton
            key={item.label}
            onClick={item.label === 'Process' ? handleProcessClick : () => {}}
            label={item.label}
            route={item.route}
            appRoute={item.appRoute}
            title={item.title || item.label}
          >
            {item.icon}
          </SideBarNavButton>
        ))}
      </div>
      <AppSideBarProfile />
    </div>
  );
}
