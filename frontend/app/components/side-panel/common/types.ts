/**
 * Types for Side Panel components
 */

import { AppRoute } from '@/app/components/router';
import { ReactNode } from 'react';

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
  ringColor?: string;
  disabled?: boolean;
}

/**
 * Side panel meeting item props
 */
export interface SidePanelMeetingItemProps {
  id: string;
  title: string;
  time: string;
  avatarColor?: string;
  isUpcoming?: boolean;
  isPast?: boolean;
  onClick?: () => void;
}
