'use client';

import { useEffect, useState, useMemo } from 'react';
import { useTimelineFilter } from '../../hooks/useTimelineFilter';
import { useProfile } from '../../hooks';

/**
 * TimelineSelector component for the profile page
 * Modern interactive timeline with years and quarters
 */
interface TimelineSelectorProps {
  horizontal?: boolean;
}

export function TimelineSelector({ horizontal = false }: TimelineSelectorProps) {
  const { timelineData, selectedYear, selectedQuarter, selectedMonth, dateRange, selectYear, selectQuarter, selectMonth } = useTimelineFilter();

  const { viewType, reports, activities, events } = useProfile();

  // Add animation states
  const [animatingYear, setAnimatingYear] = useState<number | null>(null);
  const [animatingQuarter, setAnimatingQuarter] = useState<number | null>(null);

  // Get the selected quarter data
  const selectedQuarterData = useMemo(() => {
    const yearData = timelineData.find((y) => y.year === selectedYear);
    return yearData?.quarters?.find((q) => q.quarter === selectedQuarter);
  }, [timelineData, selectedYear, selectedQuarter]);

  // Get the selected month data if any
  const selectedMonthData = useMemo(() => {
    if (selectedMonth && selectedQuarterData?.months) {
      return selectedQuarterData.months.find((m) => m.monthNumber === selectedMonth);
    }
    return null;
  }, [selectedQuarterData, selectedMonth]);

  // Reset animations after selection
  useEffect(() => {
    if (animatingYear !== null) {
      const timer = setTimeout(() => setAnimatingYear(null), 300);
      return () => clearTimeout(timer);
    }
  }, [animatingYear]);

  useEffect(() => {
    if (animatingQuarter !== null) {
      const timer = setTimeout(() => setAnimatingQuarter(null), 300);
      return () => clearTimeout(timer);
    }
  }, [animatingQuarter]);

  // Get current year data and count with fallbacks
  const currentYearData = timelineData.find((y) => y.year === selectedYear) ||
    timelineData[0] || {
      year: new Date().getFullYear(),
      quarters: [],
      activityCount: 0,
      eventCount: 0,
    };

  const currentQuarterData = currentYearData.quarters?.find((q) => q.quarter === selectedQuarter) || {
    quarter: 1,
    year: currentYearData.year,
    label: `Q1 ${currentYearData.year}`,
    activityCount: 0,
    eventCount: 0,
  };

  // Calculate appropriate count based on the selected view type
  const quarterReportsCount = reports?.filter((report) => report.year === selectedYear && report.quarter === selectedQuarter).length || 0;

  const currentCount =
    viewType === 'events' ? currentQuarterData.eventCount || 0 : viewType === 'reports' ? quarterReportsCount : currentQuarterData.activityCount || 0;

  // Handle year selection with animation
  const handleYearSelect = (year: number) => {
    setAnimatingYear(year);
    selectYear(year);
  };

  // Handle quarter selection with animation
  const handleQuarterSelect = (year: number, quarter: number) => {
    setAnimatingQuarter(quarter);
    selectQuarter(year, quarter);
  };

  // Handle month selection
  const handleMonthSelect = (monthNumber: number) => {
    selectMonth(monthNumber);
  };

  // Month-focused horizontal timeline
  if (horizontal) {
    return (
      <div className='flex flex-col justify-between bg-white py-2 sm:flex-row sm:items-center'>
        <div className='flex flex-wrap items-center'>
          {/* Year selector */}
          <div className='relative mr-2'>
            <select
              className='cursor-pointer appearance-none rounded-md bg-white py-1 pr-6 text-sm'
              value={selectedYear}
              onChange={(e) => selectYear(Number(e.target.value))}
              aria-label='Select year'
            >
              {timelineData.map((year) => (
                <option key={year.year} value={year.year}>
                  {year.year}
                </option>
              ))}
            </select>
            <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1 text-slate-400'>
              <svg className='h-3 w-3' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
              </svg>
            </div>
          </div>

          {/* All months directly */}
          <div className='flex flex-wrap gap-1'>
            {/* Standard month array */}
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((monthName, i) => {
              const monthNumber = i + 1;
              const isMonthSelected = selectedMonth === monthNumber && selectedYear === currentYearData.year;

              // Find the corresponding month data to check if it exists
              let monthExists = false;
              let associatedQuarter = Math.floor(i / 3) + 1;

              // Always enable all months since we want to allow selection even without data
              monthExists = true;

              // Determine style based on selection
              const buttonStyle = isMonthSelected ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100';

              return (
                <button
                  key={`Month-${monthNumber}`}
                  className={`rounded-md px-2 py-0.5 text-xs ${buttonStyle}`}
                  onClick={() => {
                    if (monthExists) {
                      // Direct selection of the month and its associated quarter
                      const quarterToSelect = associatedQuarter;
                      selectQuarter(currentYearData.year, quarterToSelect);
                      selectMonth(monthNumber);
                    }
                  }}
                  disabled={!monthExists}
                >
                  {monthName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Count indicator */}
        <div className='mt-1 text-xs text-slate-500 sm:mt-0'>
          {viewType === 'events'
            ? `${events.length} events`
            : viewType === 'reports'
            ? `${
                reports?.filter((r) => {
                  if (selectedMonth) return r.year === selectedYear && r.month === selectedMonth;
                  return r.year === selectedYear;
                }).length || 0
              } reports`
            : `${activities.length} posts`}
        </div>
      </div>
    );
  }

  // Month-focused vertical timeline
  return (
    <div className='flex h-full w-[280px] flex-shrink-0 flex-col border-l border-slate-100 bg-white'>
      {/* Current period header */}
      <div className='border-b border-slate-100 px-3 py-2'>
        <div className='flex flex-col'>
          <span className='text-sm font-medium text-slate-700'>
            {selectedMonth
              ? selectedMonthData
                ? `${selectedMonthData.label} ${selectedYear}`
                : `${
                    ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][
                      selectedMonth - 1
                    ]
                  } ${selectedYear}`
              : `${selectedYear}`}
          </span>
          <div className='mt-1 flex items-center justify-between'>
            <span className='text-xs text-slate-500'>
              {viewType === 'events'
                ? events.length + ' events'
                : viewType === 'reports'
                ? reports?.filter((r) => {
                    if (selectedMonth) return r.year === selectedYear && r.month === selectedMonth;
                    return r.year === selectedYear;
                  }).length + ' reports'
                : activities.length + ' posts'}
            </span>
          </div>
        </div>
      </div>

      {/* Years and months */}
      <div className='overflow-y-auto'>
        <div className='px-2 py-1'>
          {timelineData.map((year) => {
            const isYearSelected = year.year === selectedYear;
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            return (
              <div key={year.year} className='mb-1'>
                {/* Year selector */}
                <div
                  className={`flex cursor-pointer items-center px-2 py-1 ${isYearSelected ? 'text-slate-800' : 'text-slate-500'}`}
                  onClick={() => selectYear(year.year)}
                >
                  <svg
                    xmlns='http://www.w3.org/2000/svg'
                    className={`mr-1 h-3 w-3 transition-transform ${isYearSelected ? 'rotate-90 text-slate-600' : 'text-slate-400'}`}
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                  <span className='text-sm'>{year.year}</span>
                </div>

                {/* Months grid */}
                {isYearSelected && (
                  <div className='ml-4 border-l border-slate-100 pl-2'>
                    <div className='grid grid-cols-2 gap-1 py-1'>
                      {/* All 12 months */}
                      {Array.from({ length: 12 }, (_, i) => {
                        const monthNumber = i + 1;
                        const isMonthSelected = selectedMonth === monthNumber && selectedYear === year.year;

                        // Always enable all months
                        let monthExists = true;
                        let associatedQuarter = Math.floor(i / 3) + 1;

                        // Button styling based on selection only
                        const monthStyle = isMonthSelected ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50';

                        return (
                          <button
                            key={`${year.year}-M${monthNumber}`}
                            className={`rounded px-2 py-1 text-left text-xs ${monthStyle}`}
                            onClick={() => {
                              if (monthExists) {
                                // Direct month selection with appropriate quarter context
                                selectQuarter(year.year, associatedQuarter);
                                selectMonth(monthNumber);
                              }
                            }}
                            disabled={!monthExists}
                          >
                            {monthNames[i].substring(0, 3)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
