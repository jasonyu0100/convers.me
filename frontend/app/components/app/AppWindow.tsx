'use client';

import { AppWindowHeaderProps, AppWindowProps } from './types';

/**
 * Main content window wrapper component with glassmorphic effect
 */
export function AppWindow({ children }: AppWindowProps) {
  return (
    <div className='flex h-full flex-grow px-6 pt-6'>
      <div className='relative flex h-full w-full flex-col overflow-hidden rounded-t-[2rem] border-[0.5px] border-b-0 border-white/60 bg-white/50 shadow-lg backdrop-blur-[15px]'>
        {/* Enhanced glass effect with border highlights */}
        <div
          className='pointer-events-none absolute inset-0'
          style={{
            boxShadow: 'inset 0 1px 1px rgba(255, 255, 255, 0.6), inset 0 -1px 1px rgba(255, 255, 255, 0.3)',
          }}
        ></div>

        {/* Glassmorphic reflections - subtle but noticeable */}
        <div className='pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.5)_0%,rgba(255,255,255,0)_100%)] opacity-20'></div>

        {/* Light blue tint to glass */}
        <div className='pointer-events-none absolute inset-0 bg-blue-50/5'></div>

        {/* Frost texture for glass authenticity */}
        <div
          className='pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay'
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
            backgroundSize: '120px',
          }}
        ></div>

        {children}
      </div>
    </div>
  );
}

/**
 * Header component for content windows - clearly visible with subtle glass effect
 */
export function AppWindowHeader({ children }: AppWindowHeaderProps) {
  return (
    <div className='bg-white/80/90 relative z-10 flex h-[4rem] w-full flex-shrink-0 items-center justify-between rounded-t-[2rem] border-b-[0.5px] border-blue-100/30 px-[2rem] backdrop-blur-md'>
      {/* Subtle separation line */}
      <div className='absolute right-[5%] bottom-0 left-[5%] h-[1px] bg-gradient-to-r from-transparent via-blue-200/40 to-transparent'></div>

      {/* Glass reflection with slight blue tint */}
      <div className='pointer-events-none absolute inset-0 rounded-t-[2rem] bg-gradient-to-b from-white/40 to-transparent'></div>
      <div className='pointer-events-none absolute inset-0 rounded-t-[2rem] bg-blue-50/5'></div>

      {children}
    </div>
  );
}
