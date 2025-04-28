'use client';

import { Logo } from '@/app/components/ui/logo/Logo';

/**
 * Logo component for the side panel
 * Uses the reusable Logo component with vibrant styling for the side panel
 */
export function SidePanelLogo() {
  return (
    <div className='group opacity-90 transition-all duration-300 hover:opacity-100'>
      <Logo
        size='lg'
        theme='default'
        display='full'
        iconStyle='gradient'
        className='transition-all duration-300'
        textClassName='font-black bg-gradient-to-r from-blue-500 to-blue-600 bg-clip-text text-transparent'
      />
    </div>
  );
}
