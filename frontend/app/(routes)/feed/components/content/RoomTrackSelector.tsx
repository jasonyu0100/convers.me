/**
 * Horizontal room track selector for the Feed section
 * Displays events from 7 days before to 7 days after today
 * With pagination arrows for navigation
 */
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';
import { useFeed } from '../../hooks';

export function RoomTrackSelector() {
  const { roomEvents, selectedRoomId, setSelectedRoomId } = useFeed();
  const [isLoading, setIsLoading] = useState(roomEvents.length === 0);

  // Refs for today's button removed - auto-scroll functionality disabled

  // Constants
  const itemsPerPage = 5; // Fixed number of visible items
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Filter to only show today and future events
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter for current and future events only
  const filteredRoomEvents = roomEvents.filter((event) => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() >= today.getTime();
  });

  // Sort room events by date
  const sortedRoomEvents = [...filteredRoomEvents].sort((a, b) => {
    // First, sort by date
    const dateComparison = a.date.getTime() - b.date.getTime();
    if (dateComparison !== 0) return dateComparison;

    // If same date, try to sort by title
    return a.title.localeCompare(b.title);
  });

  // Find the selected event's index
  const selectedIndex = selectedRoomId ? sortedRoomEvents.findIndex((event) => event.id === selectedRoomId) : -1;

  // Find today's events
  const todayEvents = sortedRoomEvents.filter((event) => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === today.getTime();
  });

  // Get today's event ID (first one if multiple)
  const todayEventId = todayEvents.length > 0 ? todayEvents[0].id : null;

  // We'll default to All (null) instead of today's events

  // Update loading state when room events change
  useEffect(() => {
    if (roomEvents.length > 0) {
      if (isLoading) {
        setIsLoading(false);
      }

      // Removed auto-reset to "All" - this was preventing selection from working
      // by constantly resetting the selection
    }
  }, [roomEvents, isLoading]);

  // Function to get visible options with fixed-window approach
  const getVisibleEvents = () => {
    // Add the "All" option at the beginning
    const allEventsOption = {
      id: null,
      title: 'All',
      date: new Date(),
      status: 'scheduled',
      type: 'all',
    };

    // Add all options with the "All" at the start
    const allOptions = [allEventsOption, ...sortedRoomEvents];

    // Find the currently selected index in the full options list
    const fullSelectedIndex = selectedRoomId ? allOptions.findIndex((event) => event.id === selectedRoomId) : 0; // Select "All" by default

    // If nothing is selected or we have fewer options than can fit, return the first page
    if (fullSelectedIndex === -1 || allOptions.length <= itemsPerPage) {
      return allOptions.slice(0, itemsPerPage);
    }

    // Calculate the middle position
    const middle = Math.floor(itemsPerPage / 2);

    // Calculate start index to keep selected item centered
    let startIndex = fullSelectedIndex - middle;

    // Handle edge cases
    if (startIndex < 0) {
      startIndex = 0;
    } else if (startIndex + itemsPerPage > allOptions.length) {
      startIndex = Math.max(0, allOptions.length - itemsPerPage);
    }

    return allOptions.slice(startIndex, startIndex + itemsPerPage);
  };

  // Get the events to display with proper spacing and centering
  const visibleEvents = getVisibleEvents();

  // Navigation handlers
  const goToPrevious = () => {
    // Find the currently selected index in the full array
    const fullOptions = [null, ...sortedRoomEvents.map((e) => e.id)];
    const currentIndex = fullOptions.indexOf(selectedRoomId);

    if (currentIndex > 0) {
      setSelectedRoomId(fullOptions[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    // Find the currently selected index in the full array
    const fullOptions = [null, ...sortedRoomEvents.map((e) => e.id)];
    const currentIndex = fullOptions.indexOf(selectedRoomId);

    if (currentIndex >= 0 && currentIndex < fullOptions.length - 1) {
      setSelectedRoomId(fullOptions[currentIndex + 1]);
    }
  };

  return (
    <div className='sticky top-0 z-10 border-b border-slate-100 bg-white'>
      <div className='flex w-full flex-col items-center px-4 py-2'>
        {isLoading ? (
          <div className='flex h-10 items-center justify-center'>
            <div className='h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent'></div>
            <span className='ml-2 text-xs text-gray-500'>Loading rooms...</span>
          </div>
        ) : (
          <div className='flex w-full items-center justify-between'>
            {/* Left arrow */}
            <button
              onClick={goToPrevious}
              disabled={selectedRoomId === null} // Disabled when "All Posts" (null) is selected
              className={`flex-shrink-0 rounded-full p-1.5 ${
                selectedRoomId === null ? 'cursor-not-allowed text-slate-300' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
              aria-label='Previous room'
            >
              <ChevronLeftIcon className='h-5 w-5' />
            </button>

            {/* Room cards container */}
            <div className='flex flex-grow items-center justify-center space-x-2'>
              {visibleEvents.map((event) => {
                // Check if this is today's event
                const eventDate = event.id ? new Date(event.date) : null;
                let isToday = false;

                if (eventDate) {
                  eventDate.setHours(0, 0, 0, 0);
                  isToday = eventDate.getTime() === today.getTime();
                }

                return (
                  <button
                    key={event.id || 'all'}
                    onClick={() => {
                      setSelectedRoomId(event.id);
                      // Debug log to show what's being selected
                      console.log('Selected room ID:', event.id);
                    }}
                    className={`flex w-28 flex-col rounded-md px-2 py-2 text-xs transition-colors ${
                      event.id === selectedRoomId || (event.id === null && selectedRoomId === null)
                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
                        : isToday
                        ? 'bg-yellow-50 text-slate-700 ring-1 ring-yellow-200'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                    aria-selected={event.id === selectedRoomId || (event.id === null && selectedRoomId === null)}
                    title={event.id ? `View ${event.title}` : 'View all'}
                  >
                    <span className='truncate text-center font-medium'>{event.title}</span>
                    <span className='mt-0.5 text-center text-[10px] text-slate-400'>
                      {event.id
                        ? `${daysOfWeek[event.date.getDay()]}, ${event.date.toLocaleString('default', { month: 'short' })} ${event.date.getDate()}${
                            isToday ? ' (Today)' : ''
                          }`
                        : 'All'}
                    </span>
                  </button>
                );
              })}

              {/* Spacers to maintain layout */}
              {visibleEvents.length < itemsPerPage &&
                Array(itemsPerPage - visibleEvents.length)
                  .fill(0)
                  .map((_, index) => <div key={`spacer-${index}`} className='pointer-events-none w-28 opacity-0' />)}
            </div>

            {/* Right arrow */}
            <button
              onClick={goToNext}
              disabled={!selectedRoomId || selectedIndex === sortedRoomEvents.length - 1}
              className={`flex-shrink-0 rounded-full p-1.5 ${
                !selectedRoomId || selectedIndex === sortedRoomEvents.length - 1
                  ? 'cursor-not-allowed text-slate-300'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
              aria-label='Next room'
            >
              <ChevronRightIcon className='h-5 w-5' />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
