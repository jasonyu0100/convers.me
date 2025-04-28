'use client';

import { useEffect, useState, useMemo } from 'react';
import { useProfile } from '../../hooks/useProfile';

/**
 * TimelineSelector component for the profile page
 * Modern interactive timeline with years and quarters
 */
interface TimelineSelectorProps {
  horizontal?: boolean;
}

export function TimelineSelector({ horizontal = false }: TimelineSelectorProps) {
  const {
    timelineData,
    selectedYear,
    selectedQuarter,
    selectedMonth,
    dateRange,
    selectYear,
    selectQuarter,
    selectMonth,
    viewType,
    reports,
    activities,
    events,
  } = useProfile();

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

  // Modern airy horizontal timeline
  if (horizontal) {
    return (
      <div className='flex flex-col justify-between rounded-lg border border-slate-100 bg-white/80 px-5 py-4 shadow-sm sm:flex-row sm:items-center'>
        <div className='flex flex-wrap items-center'>
          <span className='mr-4 text-sm font-medium tracking-wide text-slate-700'>Timeline</span>

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
            {dateRange && (
              <div className='mt-1 ml-2 hidden text-xs text-slate-500 sm:inline-block'>
                <span>
                  {dateRange.startDate} to {dateRange.endDate}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Count indicator with blue-500 accent */}
        <div className='mt-3 self-start sm:mt-0 sm:self-auto'>
          <span className='inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-medium text-blue-600 shadow-sm'>
            <span className='mr-2 inline-block h-2 w-2 rounded-full bg-blue-500'></span>
            {viewType === 'events'
              ? `${events.length} events`
              : viewType === 'reports'
              ? `${
                  reports?.filter((r) => {
                    if (selectedMonth) {
                      return r.year === selectedYear && r.quarter === selectedQuarter && r.month === selectedMonth;
                    }
                    return r.year === selectedYear && r.quarter === selectedQuarter;
                  }).length || 0
                } reports`
              : `${activities.length} posts`}
          </span>
        </div>
      </div>
    );
  }

  // Modern airy vertical timeline with vibrant blue accents
  return (
    <div className='flex h-full w-[380px] flex-shrink-0 flex-col border-l border-slate-200 bg-white/80 shadow-sm'>
      {/* Timeline header - clean, airy with vibrant blue */}
      <div className='border-b border-slate-100 bg-white/80 px-5 py-5'>
        <h3 className='text-md flex items-center font-medium text-slate-700'>
          <svg xmlns='http://www.w3.org/2000/svg' className='mr-2 h-5 w-5 text-blue-500' viewBox='0 0 20 20' fill='currentColor' aria-hidden='true'>
            <path
              fillRule='evenodd'
              d='M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z'
              clipRule='evenodd'
            />
          </svg>
          <span className='tracking-wide'>Timeline</span>
        </h3>
      </div>

      {/* Current period indicator with clean design and popping blue */}
      <div className='border-b border-slate-100 bg-slate-50/50 px-5 py-5'>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col'>
            <span className='mb-0.5 text-sm font-medium tracking-wide text-blue-400'>Current Period</span>
            <div className='flex items-baseline gap-2'>
              <span className='text-xl font-semibold tracking-tight text-slate-800'>
                {selectedMonth ? 'Month ' + selectedMonth : `Q${selectedQuarter}`} {selectedYear}
              </span>
            </div>
            {dateRange && (
              <div className='mt-1 text-xs text-slate-500'>
                <span>
                  {dateRange.startDate} to {dateRange.endDate}
                </span>
              </div>
            )}
          </div>
          <div className='flex flex-col items-end gap-2'>
            <span className='rounded-full bg-blue-500 px-3.5 py-1.5 text-xs font-medium text-white shadow-sm'>
              {viewType === 'events'
                ? events.length
                : viewType === 'reports'
                ? reports?.filter((r) => {
                    if (selectedMonth) {
                      return r.year === selectedYear && r.quarter === selectedQuarter && r.month === selectedMonth;
                    }
                    return r.year === selectedYear && r.quarter === selectedQuarter;
                  }).length || 0
                : activities.length}{' '}
              {viewType === 'events' ? 'events' : viewType === 'reports' ? 'reports' : 'posts'}
            </span>
          </div>
        </div>
      </div>

      {/* Years and quarters with airy, modern styling */}
      <div className='scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent flex-grow overflow-y-auto'>
        <div className='space-y-3 px-4 py-4'>
          {timelineData.map((year) => {
            const isYearSelected = year.year === selectedYear;
            const isAnimating = year.year === animatingYear;

            return (
              <div key={year.year} className='relative'>
                {/* Year selector with modern styling and hover effects */}
                <div
                  className={`flex cursor-pointer items-center justify-between rounded-xl px-5 py-3.5 transition-all duration-200 ${
                    isYearSelected ? 'border border-blue-100 bg-blue-50 text-blue-600 shadow-sm' : 'border border-transparent hover:bg-slate-50'
                  } ${isAnimating ? 'scale-[1.02]' : ''}`}
                  onClick={() => handleYearSelect(year.year)}
                  role='button'
                  aria-expanded={isYearSelected}
                  aria-controls={`quarters-${year.year}`}
                >
                  <div className='flex items-center'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      className={`mr-2.5 h-4 w-4 transition-transform duration-300 ease-out ${
                        isYearSelected ? 'rotate-90 transform text-blue-500' : 'text-slate-400'
                      }`}
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                      aria-hidden='true'
                    >
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                    </svg>
                    <span className='text-sm font-semibold tracking-wide'>{year.year}</span>
                  </div>
                </div>

                {/* Quarters with smooth transitions and airy spacing */}
                <div
                  id={`quarters-${year.year}`}
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    isYearSelected ? 'my-3 max-h-[500px] opacity-100' : 'my-0 max-h-0 opacity-0'
                  }`}
                >
                  <div className='ml-7 space-y-2.5 border-l-2 border-blue-200 py-1 pl-5'>
                    {year.quarters.map((quarter) => {
                      const isQuarterSelected = selectedYear === year.year && selectedQuarter === quarter.quarter;

                      return (
                        <div key={`${year.year}-Q${quarter.quarter !== undefined ? quarter.quarter : ''}`}>
                          <div
                            className={`relative flex cursor-pointer items-center justify-between rounded-xl px-4 py-3 transition-all duration-200 ${
                              isQuarterSelected
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md'
                                : 'border border-transparent hover:bg-slate-50'
                            }`}
                            onClick={() => handleQuarterSelect(year.year, quarter.quarter)}
                            role='button'
                            aria-pressed={isQuarterSelected}
                            aria-expanded={isQuarterSelected}
                            aria-controls={`months-${year.year}-Q${quarter.quarter}`}
                          >
                            {/* Quarter marker with pulse animation for selected item */}
                            <div className='absolute -left-[28px] flex items-center justify-center'>
                              <span
                                className={`h-4 w-4 rounded-full ${
                                  isQuarterSelected ? 'bg-blue-500 ring-4 ring-blue-200' : 'border-2 border-blue-200 bg-white/80'
                                }`}
                              ></span>
                              {isQuarterSelected && <span className='absolute h-5 w-5 animate-ping rounded-full bg-blue-400 opacity-40'></span>}
                            </div>

                            {/* Quarter content with modern styling */}
                            <div className='flex items-center'>
                              <span className={`text-sm font-medium tracking-wide ${isQuarterSelected ? 'text-white' : 'text-slate-700'}`}>
                                {quarter.label}
                              </span>
                            </div>
                          </div>

                          {/* Months section - only show for selected quarter */}
                          {isQuarterSelected && quarter.months && quarter.months.length > 0 && (
                            <div id={`months-${year.year}-Q${quarter.quarter}`} className='mt-2 ml-4 space-y-1.5'>
                              {[...quarter.months].reverse().map((month) => {
                                const isMonthSelected = selectedMonth === month.monthNumber;

                                return (
                                  <div
                                    key={`${year.year}-M${month.monthNumber}`}
                                    className={`relative flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 transition-all duration-150 ${
                                      isMonthSelected ? 'bg-blue-100 text-blue-700 shadow-sm' : 'border border-transparent hover:bg-blue-50 hover:text-blue-600'
                                    }`}
                                    onClick={() => handleMonthSelect(month.monthNumber)}
                                    role='button'
                                    aria-pressed={isMonthSelected}
                                  >
                                    <div className='flex items-center'>
                                      <span className='text-xs font-medium'>{month.label}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
