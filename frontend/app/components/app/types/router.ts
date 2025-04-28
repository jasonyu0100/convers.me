/**
 * Types for the App Router component
 */

import { AppRoute } from '@/app/components/router';
import { ReactNode } from 'react';

/**
 * Props for the AppRouter component
 */
export interface AppRouterProps {
  children: ReactNode;
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
