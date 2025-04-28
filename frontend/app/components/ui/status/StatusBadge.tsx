'use client';

import React from 'react';
import { EventStatus } from '@/app/types/shared';

interface StatusBadgeProps {
  status: EventStatus;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  withIcon?: boolean;
  className?: string;
}

// Define status options with their colors and icons
const statusConfig: Record = {
  Pending: {
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    hoverBg: 'hover:bg-yellow-200',
    icon: '⏳',
  },
  Planning: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    hoverBg: 'hover:bg-blue-200',
    icon: '📝',
  },
  Execution: {
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    hoverBg: 'hover:bg-indigo-200',
    icon: '🏃',
  },
  Review: {
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    hoverBg: 'hover:bg-purple-200',
    icon: '🔍',
  },
  Administrative: {
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    hoverBg: 'hover:bg-gray-200',
    icon: '📋',
  },
  Done: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    hoverBg: 'hover:bg-green-200',
    icon: '✅',
  },
  execution: {
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    hoverBg: 'hover:bg-blue-200',
    icon: '⏱️',
  },
  upcoming: {
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    hoverBg: 'hover:bg-teal-200',
    icon: '📅',
  },
  done: {
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    hoverBg: 'hover:bg-green-200',
    icon: '✓',
  },
  ready: {
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-100',
    hoverBg: 'hover:bg-cyan-200',
    icon: '🚀',
  },
};

// Size classes for the badge
const sizeClasses = {
  xs: 'text-xs px-1.5 py-0.5 rounded',
  sm: 'text-xs px-2 py-1 rounded-md',
  md: 'text-sm px-2.5 py-1 rounded-md',
  lg: 'text-base px-3 py-1.5 rounded-md',
};

export default function StatusBadge({ status, size = 'md', withIcon = true, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig['Pending'];
  const sizeClass = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium ${config.bgColor} ${config.color} ${sizeClass} transition-colors ${config.hoverBg} ${className}`}
    >
      {withIcon && <span className='flex-shrink-0'>{config.icon}</span>}
      <span className='flex-grow'>{status}</span>
    </span>
  );
}
