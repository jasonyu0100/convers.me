'use client';

import { useState } from 'react';
import { useReview } from './useReview';

/**
 * Hook that provides header configuration for the Review view
 *
 * @returns Header configuration
 */
export function useReviewHeader() {
  const [searchValue, setSearchValue] = useState('');
  const { selectedTimeFrame, selectedDate } = useReview();

  // Get date display based on time frame and selected date
  const getDateDisplay = () => {
    const date = new Date(selectedDate);
    const options: Intl.DateTimeFormatOptions = {};

    if (selectedTimeFrame === 'day') {
      options.weekday = 'long';
      options.year = 'numeric';
      options.month = 'long';
      options.day = 'numeric';
    } else if (selectedTimeFrame === 'week') {
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const startMonth = start.toLocaleString('default', { month: 'short' });
      const endMonth = end.toLocaleString('default', { month: 'short' });

      return `Week of ${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${start.getFullYear()}`;
    } else if (selectedTimeFrame === 'month') {
      options.year = 'numeric';
      options.month = 'long';
    }

    return date.toLocaleDateString('en-US', options);
  };

  // Get title based on time frame
  const getTitle = () => {
    switch (selectedTimeFrame) {
      case 'day':
        return 'Daily Review';
      case 'week':
        return 'Weekly Review';
      case 'month':
        return 'Monthly Review';
      default:
        return 'Performance Review';
    }
  };

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  // Handle search submit
  const handleSearchSubmit = () => {
    // Implement search functionality
    console.log('Search for:', searchValue);
  };

  return {
    title: getTitle(),
    subtitle: getDateDisplay(),
    searchPlaceholder: 'Search review data...',
    searchValue,
    onSearchChange: handleSearchChange,
    onSearchSubmit: handleSearchSubmit,
  };
}
