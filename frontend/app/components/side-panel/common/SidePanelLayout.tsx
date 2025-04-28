'use client';

import { SidePanelLogo } from './SidePanelLogo';
import { SidePanelLayoutProps } from './types';

/**
 * Standard layout component for side panels
 * Provides consistent spacing and optional logo display
 */
export function SidePanelLayout({ children, showLogo = true }: SidePanelLayoutProps) {
  return (
    <div className='flex h-full w-full flex-col space-y-4'>
      {showLogo && <SidePanelLogo />}
      {children}
    </div>
  );
}
