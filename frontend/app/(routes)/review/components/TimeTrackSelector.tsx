/**
 * Horizontal time track selector with pagination arrows for the Review section
 */
import { KnowledgeTimeFrameType } from '@/app/types/review';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';

interface TimeTrackSelectorProps {
  selectedTimeFrame: KnowledgeTimeFrameType;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function TimeTrackSelector({ selectedTimeFrame, selectedDate, onSelectDate }: TimeTrackSelectorProps) {
  const [timeOptions, setTimeOptions] = useState<{ date: Date; label: string; subLabel?: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [maxPages, setMaxPages] = useState(1);
  const trackRef = useRef<HTMLDivElement>(null);

  // Always display exactly 7 items per page for consistent layout
  const itemsPerPage = 7;

  // Generate time options based on the selected time frame
  useEffect(() => {
    const today = new Date();
    const options: { date: Date; label: string; subLabel?: string }[] = [];

    if (selectedTimeFrame === 'day') {
      // Generate options for the last 14 days
      for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);

        let label = '';
        let subLabel = '';

        if (i === 0) {
          label = 'Today';
          subLabel = date.toLocaleDateString('en-US', { day: 'numeric' });
        } else if (i === 1) {
          label = 'Yesterday';
          subLabel = date.toLocaleDateString('en-US', { day: 'numeric' });
        } else {
          // Use shorter day name format
          label = date.toLocaleDateString('en-US', { weekday: 'short' });

          // For day view, just show month/day without year to save space
          const month = date.toLocaleDateString('en-US', { month: 'short' });
          const day = date.getDate();
          subLabel = `${month} ${day}`;
        }

        options.push({ date, label, subLabel });
      }
    } else if (selectedTimeFrame === 'week') {
      // Generate options for the last 8 weeks
      for (let i = 7; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - 7 * i);
        // Adjust to the beginning of the week (Sunday)
        date.setDate(date.getDate() - date.getDay());

        const endOfWeek = new Date(date);
        endOfWeek.setDate(date.getDate() + 6);

        let label = '';
        let subLabel = '';

        if (i === 0) {
          label = 'This Week';
          subLabel = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}`;
        } else if (i === 1) {
          label = 'Last Week';
          subLabel = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}`;
        } else {
          label = `Week ${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
          subLabel = `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}`;
        }

        options.push({ date, label, subLabel });
      }
    } else if (selectedTimeFrame === 'month') {
      // Generate options for the last 6 months
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(today.getMonth() - i);
        date.setDate(1); // Start of month

        let label = date.toLocaleDateString('en-US', { month: 'long' });
        let subLabel = date.toLocaleDateString('en-US', { year: 'numeric' });

        if (i === 0) {
          label = 'This Month';
          subLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } else if (i === 1) {
          label = 'Last Month';
          subLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }

        options.push({ date, label, subLabel });
      }
    }

    setTimeOptions(options);

    // Reset pagination when time frame changes
    setCurrentPage(0);
    setMaxPages(Math.ceil(options.length / itemsPerPage));
  }, [selectedTimeFrame, itemsPerPage]);

  // Find the currently selected date option
  const selectedOption = timeOptions.findIndex((option) => {
    if (selectedTimeFrame === 'day') {
      return option.date.toDateString() === selectedDate.toDateString();
    } else if (selectedTimeFrame === 'week') {
      const selectedDay = selectedDate.getDay();
      const weekStartDate = new Date(selectedDate);
      weekStartDate.setDate(selectedDate.getDate() - selectedDay);
      return option.date.toDateString() === weekStartDate.toDateString();
    } else {
      return option.date.getMonth() === selectedDate.getMonth() && option.date.getFullYear() === selectedDate.getFullYear();
    }
  });

  // Fixed-center approach to eliminate jumping
  // Instead of changing pages, we'll create a fixed window that slides with the selection
  const getFixedWindowOptions = () => {
    if (selectedOption === -1 || timeOptions.length <= itemsPerPage) {
      // If nothing is selected or we don't have enough options to scroll,
      // just return the first page of options
      return timeOptions.slice(0, itemsPerPage);
    }

    // Find the middle index position
    const middleIndex = Math.floor(itemsPerPage / 2);

    // Calculate the start index for our window, ensuring the selected item is in the middle
    let startIndex = selectedOption - middleIndex;

    // Handle edge cases
    if (startIndex < 0) {
      // We're near the beginning, so just start from the beginning
      startIndex = 0;
    } else if (startIndex + itemsPerPage > timeOptions.length) {
      // We're near the end, so adjust to show the last page
      startIndex = Math.max(0, timeOptions.length - itemsPerPage);
    }

    // Return the options in our sliding window
    return timeOptions.slice(startIndex, startIndex + itemsPerPage);
  };

  // Use our fixed window approach instead of standard pagination
  // This ensures the selected item stays in the center and prevents jumping
  const visibleTimeOptions = getFixedWindowOptions();

  // Navigation handlers - move by 1 period instead of by page
  const goToPreviousDate = () => {
    if (selectedOption > 0) {
      // Go to previous date option
      onSelectDate(timeOptions[selectedOption - 1].date);
    }
  };

  const goToNextDate = () => {
    if (selectedOption < timeOptions.length - 1) {
      // Go to next date option
      onSelectDate(timeOptions[selectedOption + 1].date);
    }
  };

  // Get appropriate styles based on the selected time frame
  const getButtonWidth = () => {
    switch (selectedTimeFrame) {
      case 'day':
        return 'w-[80px]';
      case 'week':
        return 'w-[130px]';
      case 'month':
        return 'w-[110px]';
      default:
        return 'w-[100px]';
    }
  };

  return (
    <div className='mt-auto border-t border-slate-200 bg-white/90 backdrop-blur-sm'>
      <div className='w-full px-4 py-4'>
        {/* Container with navigation arrows */}
        <div className='flex w-full items-center'>
          {/* Left arrow - navigate to previous date */}
          <button
            onClick={goToPreviousDate}
            disabled={selectedOption <= 0}
            className={`mr-1 flex-shrink-0 rounded-full p-1.5 ${
              selectedOption <= 0 ? 'cursor-not-allowed text-slate-300' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
            aria-label='Previous date'
          >
            <ChevronLeftIcon className='h-5 w-5' />
          </button>

          {/* Time options container - centered with fixed spacing */}
          <div className='flex flex-grow items-center justify-center gap-3 px-2'>
            {visibleTimeOptions.map((option) => {
              // Find this option's index in the full array for comparison
              const optionIndex = timeOptions.findIndex((o) => o.date.getTime() === option.date.getTime());

              return (
                <button
                  key={optionIndex}
                  onClick={() => onSelectDate(option.date)}
                  className={`flex shrink-0 flex-col rounded-md px-3 py-2.5 text-xs transition-all ${
                    selectedOption === optionIndex ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200' : 'text-slate-600 hover:bg-slate-50'
                  } ${getButtonWidth()}`}
                >
                  <span className='w-full truncate text-center font-medium'>{option.label}</span>
                  {option.subLabel && (
                    <span
                      className={`mt-0.5 w-full truncate text-center text-[10px] ${selectedOption === optionIndex ? 'text-blue-500/80' : 'text-slate-400'}`}
                    >
                      {option.subLabel}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Add spacer buttons to maintain layout when fewer than itemsPerPage items */}
            {visibleTimeOptions.length < itemsPerPage &&
              Array(itemsPerPage - visibleTimeOptions.length)
                .fill(0)
                .map((_, index) => <div key={`spacer-${index}`} className={`pointer-events-none flex-shrink-0 opacity-0 ${getButtonWidth()}`} />)}
          </div>

          {/* Right arrow - navigate to next date */}
          <button
            onClick={goToNextDate}
            disabled={selectedOption >= timeOptions.length - 1}
            className={`ml-1 flex-shrink-0 rounded-full p-1.5 ${
              selectedOption >= timeOptions.length - 1 ? 'cursor-not-allowed text-slate-300' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
            }`}
            aria-label='Next date'
          >
            <ChevronRightIcon className='h-5 w-5' />
          </button>
        </div>
      </div>
    </div>
  );
}
