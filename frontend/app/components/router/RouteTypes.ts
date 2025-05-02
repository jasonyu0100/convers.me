/**
 * Centralized route types and enums for the application
 */

/**
 * Application view types that represent different routes/pages in the app
 */
export enum AppRoute {
  LOGIN = 'login',
  REVIEW = 'review',
  FEED = 'feed',
  MARKET = 'market',
  CALENDAR = 'calendar',
  PROFILE = 'profile',
  INSIGHT = 'insight',
  PROGRESS = 'progress',
  PROCESS = 'process',
  SETTINGS = 'settings',
  LIVE = 'live',
  SUMMARY = 'summary',
  SCHEDULE = 'schedule',
  ROOM = 'room',
  NOTIFICATIONS = 'notifications',
  PUBLIC_PROFILE = 'public_profile',
  CONNECT = 'connect',
  PLAN = 'plan',
}

/**
 * Routes that should NOT display the sidebar
 */
export const ROUTES_WITHOUT_SIDEBAR = [AppRoute.LOGIN];

/**
 * Routes that do not require authentication
 */
export const PUBLIC_ROUTES = [AppRoute.LOGIN, AppRoute.PUBLIC_PROFILE, AppRoute.SCHEDULE];

/**
 * Props for the AppRouter component
 */
export interface AppRouterProps {
  children: React.ReactNode;
  routeType: AppRoute;
}

/**
 * Authentication redirect state
 */
export interface AuthRedirectState {
  isChecking: boolean;
  isRedirecting: boolean;
  redirectMessage: string | null;
}

/**
 * Utility functions for route navigation
 */
export const RouteUtils = {
  /**
   * Check if a route should show the sidebar
   */
  shouldShowSidebar: (route: AppRoute): boolean => {
    return !ROUTES_WITHOUT_SIDEBAR.includes(route);
  },

  /**
   * Check if a route is public (doesn't require auth)
   */
  isPublicRoute: (route: AppRoute): boolean => {
    return PUBLIC_ROUTES.includes(route);
  },
};
