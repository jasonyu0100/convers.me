/**
 * Types for side bar components
 */

import { AppRoute } from '@/app/components/router';
import { ReactNode } from 'react';

/**
 * Props for the base sidebar button component
 */
export interface SideBarButtonProps {
  children: ReactNode;
  onClick: (e: React.MouseEvent) => void;
  label?: string;
  title?: string;
  isActive?: boolean;
  hideLabel?: boolean;
}

/**
 * Props for the navigation sidebar button
 */
export interface SideBarNavButtonProps extends SideBarButtonProps {
  route: string;
  appRoute?: AppRoute;
}

/**
 * Props for the app sidebar component
 */
export interface AppSideBarProps {
  className?: string;
}

/**
 * Props for the sidebar toggle button
 */
export interface AppSideBarToggleProps {
  className?: string;
}

/**
 * Props for the sidebar profile section
 */
export interface AppSideBarProfileProps {
  className?: string;
}

/**
 * Navigation item for the sidebar
 */
export interface SideBarNavItem {
  label: string;
  route: string;
  appRoute: AppRoute;
  icon: ReactNode;
  title?: string;
}
