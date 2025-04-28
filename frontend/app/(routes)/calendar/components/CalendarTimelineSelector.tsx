'use client';

import { useEffect, useState } from 'react';
import { useCalendar } from '../hooks';
import { TimelineQuarter, TimelineWeek, TimelineYear } from '@/app/types/profile';

/**
 * CalendarTimelineSelector component for the calendar view
 * Modern interactive timeline with years, quarters, and weeks
 */
interface CalendarTimelineSelectorProps {
  horizontal?: boolean;
  timelineData: TimelineYear[];
  selectedYear: number;
  selectedQuarter: number;
  selectedWeek: number | null;
  onSelectYear: (year: number) => void;
  onSelectQuarter: (year: number, quarter: number) => void;
  onSelectWeek: (weekNumber: number) => void;
}

export function CalendarTimelineSelector({
  horizontal = false,
  timelineData,
  selectedYear,
  selectedQuarter,
  selectedWeek,
  onSelectYear,
  onSelectQuarter,
  onSelectWeek,
}: CalendarTimelineSelectorProps) {
  // Add animation states
  const [animatingYear, setAnimatingYear] = useState<number | null>(null);
  const [animatingQuarter, setAnimatingQuarter] = useState<number | null>(null);

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

  const currentCount = currentQuarterData.eventCount || 0;

  // Handle year selection with animation
  const handleYearSelect = (year: number) => {
    setAnimatingYear(year);
    onSelectYear(year);
  };

  // Handle quarter selection with animation
  const handleQuarterSelect = (year: number, quarter: number) => {
    setAnimatingQuarter(quarter);
    onSelectQuarter(year, quarter);
  };

  // Handle week selection
  const handleWeekSelect = (weekNumber: number) => {
    onSelectWeek(weekNumber);
  };

  // Modern airy horizontal timeline
  if (horizontal) {
    return (
      <div className='flex flex-col justify-between rounded-lg border border-slate-100 bg-white/80 px-5 py-4 shadow-sm sm:flex-row sm:items-center'>
        <div className='flex flex-wrap items-center'>
          <span className='mr-4 text-sm font-medium tracking-wide text-slate-700'>Period</span>

          {/* Year selector with modern styling */}
          <div className='relative'>
            <select
              className='cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white/80 px-4 py-2 pr-9 text-sm font-medium shadow-sm transition-all hover:border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:outline-none'
              value={selectedYear}
              onChange={(e) => handleYearSelect(Number(e.target.value))}
              aria-label='Select year'
            >
              {timelineData.map((year) => (
                <option key={year.year} value={year.year}>
                  {year.year}
                </option>
              ))}
            </select>
            <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-blue-500'>
              <svg className='h-4 w-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' aria-hidden='true'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M19 9l-7 7-7-7' />
              </svg>
            </div>
          </div>

          {/* Quarter pills with vibrant blue-500/600 */}
          <div className='mt-3 ml-4 flex flex-wrap gap-2 sm:mt-0'>
            {currentYearData.quarters.map((quarter) => {
              const isSelected = selectedQuarter === quarter.quarter && selectedYear === quarter.year;
              return (
                <button
                  key={`${quarter.year}-Q${quarter.quarter}`}
                  className={`relative rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-1 focus:outline-none ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-blue-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  onClick={() => handleQuarterSelect(quarter.year, quarter.quarter)}
                  aria-pressed={isSelected}
                >
                  {/* Add a subtle pulse animation for the active quarter */}
                  {isSelected && <span className='absolute inset-0 animate-pulse rounded-full bg-blue-400 opacity-30'></span>}
                  <span className='relative z-10'>Q{quarter.quarter}</span>
                </button>
              );
            })}
          </div>

          {/* Week selection if a quarter is selected and has weeks */}
          {currentQuarterData.weeks && currentQuarterData.weeks.length > 0 && (
            <div className='mt-3 ml-4 flex flex-wrap gap-2 sm:mt-0'>
              {currentQuarterData.weeks.map((week) => {
                const isSelected = selectedWeek === week.weekNumber;
                return (
                  <button
                    key={`Week-${week.weekNumber}`}
                    className={`relative rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 focus:ring-2 focus:ring-offset-1 focus:outline-none ${
                      isSelected ? 'bg-blue-200 text-blue-800 shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => handleWeekSelect(week.weekNumber)}
                    aria-pressed={isSelected}
                  >
                    <span className='relative z-10'>W{week.weekNumber}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Count indicator with blue-500 accent */}
        <div className='mt-3 self-start sm:mt-0 sm:self-auto'>
          <span className='inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-medium text-blue-600 shadow-sm'>
            <span className='mr-2 inline-block h-2 w-2 rounded-full bg-blue-500'></span>
            {currentCount} events
          </span>
        </div>
      </div>
    );
  }

  // For non-horizontal display, just show a simplified version
  return (
    <div className='flex items-center justify-between border-b border-slate-200 p-4'>
      <div className='flex items-center space-x-4'>
        <select
          className='cursor-pointer appearance-none rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-medium'
          value={selectedYear}
          onChange={(e) => handleYearSelect(Number(e.target.value))}
          aria-label='Select year'
        >
          {timelineData.map((year) => (
            <option key={year.year} value={year.year}>
              {year.year}
            </option>
          ))}
        </select>

        <div className='flex space-x-2'>
          {currentYearData.quarters.map((quarter) => {
            const isSelected = selectedQuarter === quarter.quarter && selectedYear === quarter.year;
            return (
              <button
                key={`${quarter.year}-Q${quarter.quarter}`}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                onClick={() => handleQuarterSelect(quarter.year, quarter.quarter)}
              >
                Q{quarter.quarter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Count indicator */}
      <span className='text-xs font-medium text-slate-600'>{currentCount} events</span>
    </div>
  );
}
