'use client';

import { SidePanelSectionProps } from './types';

/**
 * Reusable section component for grouping items in the side panel
 */
export function SidePanelSection({ title, children, className = '', onClick }: SidePanelSectionProps) {
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      className={`flex ${isClickable ? 'cursor-pointer' : ''} flex-col space-y-2 rounded-xl bg-white/80 p-4 shadow-sm ${className}`}
      role={isClickable ? 'button' : undefined}
      aria-label={isClickable ? `${title} section` : undefined}
    >
      <h3 className='text-sm font-bold tracking-wide text-slate-500 uppercase'>{title}</h3>
      <div className='flex flex-col space-y-2'>{children}</div>
    </div>
  );
}
