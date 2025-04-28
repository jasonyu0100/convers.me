'use client';

import { useApp } from '@/app/components/app/hooks';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { SideBarButton } from './AppSideBar';
import { AppSideBarToggleProps } from './types';

/**
 * Toggle button for the side panel
 * Controls the visibility of the expandable side panel
 */
export function AppSideBarToggle({ className = '' }: AppSideBarToggleProps) {
  const app = useApp();

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    app.setToggleSidePanel(!app.toggleSidePanel);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <SideBarButton onClick={handleToggle} label='Menu' title='Toggle side panel' isActive={app.toggleSidePanel} hideLabel={true}>
        <Bars3Icon className='size-6' />
      </SideBarButton>
    </div>
  );
}
