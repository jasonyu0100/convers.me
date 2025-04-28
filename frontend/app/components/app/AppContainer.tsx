'use client';

import { GradientBackground } from '@/app/components/ui/backgrounds';
import { AppContainerProps } from './types';

/**
 * Main application container that provides the root layout
 */
export function AppContainer({ children }: AppContainerProps) {
  return (
    <div className='relative flex h-screen w-full flex-row overflow-hidden'>
      {/* Subtle blue-tinted background - slightly more vibrant */}
      <div className='absolute inset-0 -z-10'>
        <GradientBackground intensity='subtle' color='blue' shapes={true} texture={true} animated={true} />
      </div>

      {/* Light overlay with blue tint */}
      <div className='absolute inset-0 -z-5 bg-gradient-to-br from-blue-50/60 to-white/60' />

      {/* Slightly more noticeable blue-toned light areas */}
      <div className='absolute -top-[20%] -right-[15%] h-[60%] w-[60%] rounded-full bg-blue-200/20 blur-[110px]'></div>
      <div className='absolute -bottom-[15%] -left-[10%] h-[45%] w-[45%] rounded-full bg-blue-300/20 blur-[90px]'></div>
      <div className='absolute top-[60%] right-[10%] h-[30%] w-[30%] rounded-full bg-blue-100/20 blur-[70px]'></div>
      <div className='absolute top-[20%] left-[15%] h-[25%] w-[25%] rounded-full bg-sky-200/15 blur-[80px]'></div>

      {/* Subtle blue mesh pattern */}
      <div
        className='absolute inset-0 -z-4 opacity-5'
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%234299E1' fill-opacity='0.15' fill-rule='evenodd'/%3E%3C/svg%3E\")",
        }}
      ></div>

      {/* Main content */}
      <div className='relative z-0 flex h-screen w-full flex-row'>{children}</div>
    </div>
  );
}
