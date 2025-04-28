import { AppRoute } from '@/app/components/router';

/**
 * Extracts route type from redirect path
 */
export function getRouteFromPath(redirectPath: string | null): AppRoute {
  if (!redirectPath) {
    return AppRoute.FEED;
  }

  // Extract route type from path
  const routeParts = redirectPath.split('/');
  const routeName = routeParts[1] || 'home';

  // Try to map the path to an AppRoute enum value
  try {
    return routeName as AppRoute;
  } catch (e) {
    // Fallback to home if route mapping fails
    return AppRoute.FEED;
  }
}

/**
 * Gets destination URL based on redirect path or defaults to home
 */
export function getDestinationUrl(redirectPath: string | null): string {
  return redirectPath || '/feed';
}
