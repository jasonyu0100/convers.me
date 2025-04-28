import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AuthService } from '../components/auth/AuthService';
import { ApiResult } from '../services/api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date string to a human-readable format
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatDate(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };
  return dateObj.toLocaleDateString(undefined, options);
}

/**
 * Format a date string to a time string
 * @param dateString - ISO date string
 * @returns Formatted time string
 */
export function formatTime(dateString: string): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  return new Date(dateString).toLocaleTimeString(undefined, options);
}

/**
 * Format a date to ISO YYYY-MM-DD format
 * @param date - Date to format
 */
export function formatDateIso(date: Date | string | number): string {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Truncate a string to a specified length and add ellipsis if needed
 * @param str - String to truncate
 * @param length - Maximum length
 * @returns Truncated string
 */
export function truncateString(str: string, length: number): string {
  if (str.length <= length) return str;
  return `${str.substring(0, length)}...`;
}

/**
 * Generate a random ID
 * @returns Random ID string
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Format a date to a relative time string (e.g., "2 hours ago")
 * @param date - Date to format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = date instanceof Date ? date : new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  // Less than a minute
  if (diffInSeconds < 60) {
    return 'just now';
  }

  // Less than an hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  // Less than a day
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }

  // Less than a week
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }

  // More than a week
  return formatDate(dateObj);
}

/**
 * Check if running on server or client
 * @returns True if running on client, false if on server
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Check if running in development environment
 * @returns True if running in development, false in production
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

// Removed deprecated apiRequest function - use ApiClient from services/api.ts instead

/**
 * Build clean params object, removing undefined values
 * Use this to prepare parameters for API calls
 */
export function buildParams<T extends Record>(params: T): Partial {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key as keyof T] = value;
    }
    return acc;
  }, {} as Partial);
}

/**
 * Delay function for controlled timing
 * @param ms - Milliseconds to delay
 */
export function delay(ms: number): Promise {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Safely parse JSON with error handling
 * @param json - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (e) {
    console.error('Error parsing JSON:', e);
    return fallback;
  }
}

/**
 * Unwrap API result to get data or throw an error
 * Useful for React Query where you want to throw errors
 * @param result - API result from a service call
 */
export function unwrapResult<T>(result: ApiResult): T {
  if (result.error) {
    throw new Error(result.error);
  }

  if (result.data === undefined) {
    throw new Error('No data returned from API');
  }

  return result.data;
}

/**
 * Create a debounced version of a function
 * @param fn - Function to debounce
 * @param wait - Time to wait in milliseconds
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, wait: number): (...args: Parameters) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function (...args: Parameters): void {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => fn(...args), wait);
  };
}

/**
 * Group an array of items by a key
 * @param items - Array of items to group
 * @param keyGetter - Function to get the group key for an item
 */
export function groupBy<T, K extends string | number | symbol>(items: T[], keyGetter: (item: T) => K): Record {
  return items.reduce((result, item) => {
    const key = keyGetter(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {} as Record);
}
