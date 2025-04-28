/**
 * Types for side panel components
 */

import { AppRoute } from '@/app/components/router';
import { ReactNode } from 'react';

/**
 * Props for the side panel container
 */
export interface AppSidePanelProps {
  className?: string;
}

/**
 * Props for the side panel loading component
 */
export interface PanelLoadingProps {
  message?: string;
}

/**
 * Type definition for route panel mapping
 * Maps AppRoute values to their corresponding React components
 */
export type RoutePanelMap = {
  [key in AppRoute]?: React.ComponentType;
};

/**
 * Props for the default side panel
 */
export interface DefaultSidePanelProps {
  title?: string;
}

/**
 * Props for any route-specific side panel
 */
export interface RouteSidePanelProps {
  children?: ReactNode;
}
