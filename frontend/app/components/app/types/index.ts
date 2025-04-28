/**
 * Shared types for App components
 */

import { AppRoute } from '@/app/components/router';
import { TranscriptEntry } from '@/app/types/live';
import { ReactNode } from 'react';

/**
 * User profile information
 */
export interface UserProfile {
  id: string;
  email: string;
  handle: string;
  name: string;
  profileImage?: string;
  bio?: string;
  isAdmin?: boolean;
}

/**
 * Summary item interface for live summaries
 */
export interface SummaryItem {
  id: string;
  timestamp: string;
  summary: string;
  isNew?: boolean;
}

/**
 * Application context type definition
 */
export interface AppContextType {
  // UI state
  toggleSidePanel: boolean;
  setToggleSidePanel: (toggleSidePanel: boolean) => void;

  // Navigation
  mainView: AppRoute;
  setMainView: (mainView: AppRoute) => void;

  // Authentication
  isAuthenticated: boolean;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  currentUser: UserProfile | null;
  setCurrentUser: (currentUser: UserProfile | null) => void;

  // Actions
  logout: () => void;
  refreshUserProfile: () => Promise;

  // Live transcript and summaries (shared between Live and Summary views)
  liveTranscript: TranscriptEntry[];
  setLiveTranscript: (transcript: TranscriptEntry[]) => void;
  liveSummaries: SummaryItem[];
  setLiveSummaries: (summaries: SummaryItem[]) => void;

  // Route helpers
  shouldShowSidebar: (route: AppRoute) => boolean;
  isPublicRoute: (route: AppRoute) => boolean;
}

/**
 * Provider component for the app context
 */
export interface AppProviderProps {
  children: ReactNode;
}

/**
 * App header component props
 */
export interface AppHeaderProps {
  route?: AppRoute;
  title?: string;
  searchPlaceholder?: string;
  searchValue?: string;
  isSearchVisible?: boolean;
  onSearchChange?: (e: React.ChangeEvent) => void;
  onSearchSubmit?: (value: string) => void;
  isMinimalist?: boolean;
  profileImageUrl?: string;
}

/**
 * App container component props
 */
export interface AppContainerProps {
  children: ReactNode;
}

/**
 * App window component props
 */
export interface AppWindowProps {
  children: ReactNode;
}

/**
 * App window header component props
 */
export interface AppWindowHeaderProps {
  children: ReactNode;
}

/**
 * Sidebar navigation button props
 */
export interface SideBarButtonProps {
  children: ReactNode;
  onClick: (e: React.MouseEvent) => void;
  label?: string;
  title?: string;
  isActive?: boolean;
}

/**
 * Extended props for sidebar navigation buttons
 */
export interface SideBarNavButtonProps extends SideBarButtonProps {
  route: string;
  appRoute?: AppRoute;
}

/**
 * Side panel layout props
 */
export interface SidePanelLayoutProps {
  children: ReactNode;
  showLogo?: boolean;
}

/**
 * Side panel section props
 */
export interface SidePanelSectionProps {
  title: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Side panel action button props
 */
export interface SidePanelActionButtonProps {
  label: string;
  icon: ReactNode;
  route?: string;
  appRoute?: AppRoute;
  onClick?: () => void;
  bgColor?: string;
  textColor?: string;
  hoverColor?: string;
}
