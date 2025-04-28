'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { useRouter } from 'next/navigation';
import { SidePanelActionButtonProps } from './types';

/**
 * Reusable action button component for the side panel
 */
export function SidePanelActionButton({
  label,
  icon,
  route,
  appRoute,
  onClick,
  bgColor = 'bg-slate-200',
  textColor = 'text-white',
  hoverColor = 'hover:bg-slate-300',
  ringColor = '',
  disabled = false,
}: SidePanelActionButtonProps) {
  const router = useRouter();
  const app = useApp();

  const handleClick = () => {
    // Execute custom onClick if provided
    if (onClick) {
      onClick();
    }

    // Update app route in context if provided
    if (appRoute) {
      app.setMainView(appRoute as AppRoute);
    }

    // Navigate to the specified route
    if (route) {
      router.push(route);
    }
  };

  return (
    <button
      className={`flex h-12 w-full flex-row items-center space-x-3 rounded-xl px-4 shadow-sm transition-all duration-200 ${
        disabled
          ? 'cursor-not-allowed bg-slate-300 text-slate-400 opacity-70'
          : `cursor-pointer ${bgColor} ${textColor} ${hoverColor} ${ringColor} hover:shadow-md`
      }`}
      onClick={disabled ? undefined : handleClick}
      aria-label={label}
      disabled={disabled}
    >
      {icon}
      <span className='text-base font-bold'>{label}</span>
    </button>
  );
}
