import { getProfileTimeline } from '@/app/services/profileService';
import { TimelineYear } from '@/app/types/profile';
import { useEffect, useState } from 'react';
import { useFeed } from '../../hooks';

export function FeedTimelineSelector() {
  const { selectedPeriod, setSelectedPeriod } = useFeed();
  const [timelineData, setTimelineData] = useState<TimelineYear[]>([]);
  const [animatingYear, setAnimatingYear] = useState<number | null>(null);
  const [animatingQuarter, setAnimatingQuarter] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load timeline data
  useEffect(() => {
    const loadTimelineData = async () => {
      setIsLoading(true);
      try {
        const result = await getProfileTimeline();
        if (result.data) {
          setTimelineData(result.data);
        }
      } catch (error) {
        console.error('Error loading timeline data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTimelineData();
  }, []);

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

  // Default to current year/quarter if none selected or data not loaded
  const currentDate = new Date();
  const currentYear = selectedPeriod?.year || currentDate.getFullYear();
  const currentQuarter = selectedPeriod?.quarter || Math.floor(currentDate.getMonth() / 3) + 1;
  const currentWeek = selectedPeriod?.week || null;

  // Get current year data and count with fallbacks
  const currentYearData = timelineData.find((y) => y.year === currentYear) ||
    timelineData[0] || {
      year: currentYear,
      quarters: [],
      activityCount: 0,
      eventCount: 0,
    };

  const currentQuarterData = currentYearData.quarters?.find((q) => q.quarter === currentQuarter) || {
    quarter: 1,
    year: currentYearData.year,
    label: `Q1 ${currentYearData.year}`,
    activityCount: 0,
    eventCount: 0,
  };

  const currentCount = currentQuarterData.activityCount || 0;

  // Handle year selection with animation
  const handleYearSelect = (e: React.ChangeEvent) => {
    const year = parseInt(e.target.value);
    setAnimatingYear(year);
    setSelectedPeriod({ year, quarter: undefined, week: undefined });
  };

  // Handle quarter selection with animation
  const handleQuarterSelect = (year: number, quarter: number) => {
    setAnimatingQuarter(quarter);
    setSelectedPeriod({ year, quarter, week: undefined });
  };

  // Handle month selection
  const handleMonthSelect = (monthNumber: number) => {
    // Toggle month selection
    if (selectedPeriod?.month === monthNumber) {
      setSelectedPeriod({
        year: currentYear,
        quarter: currentQuarter,
        month: undefined,
        week: undefined,
      });
    } else {
      setSelectedPeriod({
        year: currentYear,
        quarter: currentQuarter,
        month: monthNumber,
        week: undefined,
      });
    }
  };

  // Handle week selection
  const handleWeekSelect = (weekNumber: number) => {
    setSelectedPeriod({ year: currentYear, quarter: currentQuarter, week: weekNumber });
  };

  // Clear week selection
  const clearWeekSelection = () => {
    setSelectedPeriod({
      year: currentYear,
      quarter: currentQuarter,
      week: undefined,
    });
  };

  // Clear month selection
  const clearMonthSelection = () => {
    setSelectedPeriod({
      year: currentYear,
      quarter: currentQuarter,
      month: undefined,
    });
  };

  if (isLoading) {
    return (
      <div className='mb-4 flex w-full justify-center rounded-lg bg-white/80 p-4 shadow-sm'>
        <span className='text-sm text-slate-500'>Loading timeline...</span>
      </div>
    );
  }

  if (!timelineData.length) {
    return null;
  }

  return (
    <div className='mb-4 flex flex-col justify-between rounded-lg border border-slate-100 bg-white/80 px-5 py-4 shadow-sm'>
      <div className='flex flex-wrap items-center justify-between'>
        <div className='flex flex-wrap items-center'>
          <span className='mr-4 text-sm font-medium tracking-wide text-slate-700'>Feed Timeline</span>

          {/* Year selector with modern styling */}
          <div className='relative'>
            <select
              className='cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white/80 px-4 py-2 pr-9 text-sm font-medium shadow-sm transition-all hover:border-blue-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400 focus:outline-none'
              value={currentYear}
              onChange={handleYearSelect}
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
              const isSelected = currentQuarter === quarter.quarter && currentYear === quarter.year;
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
        </div>

        {/* Count indicator with blue-500 accent */}
        <div className='mt-3 self-start sm:mt-0 sm:self-auto'>
          <span className='inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3.5 py-1.5 text-xs font-medium text-blue-600 shadow-sm'>
            <span className='mr-2 inline-block h-2 w-2 rounded-full bg-blue-500'></span>
            {currentCount} posts
          </span>
        </div>
      </div>

      {/* Month selection if a quarter is selected and has months */}
      {currentQuarterData.months && currentQuarterData.months.length > 0 && (
        <div className='mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4'>
          <div className='mb-2 w-full'>
            <span className='text-xs font-medium text-slate-600'>Months of {currentYear}</span>
          </div>
          {currentQuarterData.months.map((month) => {
            const isSelected = selectedPeriod?.month === month.monthNumber;
            return (
              <button
                key={`Month-${month.monthNumber}`}
                className={`relative rounded-md px-3 py-1 text-xs font-medium transition-all duration-150 ${
                  isSelected ? 'bg-blue-100 text-blue-700 shadow-sm' : 'border border-slate-100 hover:bg-slate-50 hover:text-blue-600'
                }`}
                onClick={() => handleMonthSelect(month.monthNumber)}
                aria-pressed={isSelected}
              >
                <span className='relative z-10'>
                  {month.label} {currentYear}
                </span>
                {month.activityCount > 0 && (
                  <span className='ml-1 inline-block rounded-full bg-blue-50 px-1.5 text-xs text-blue-600'>{month.activityCount}</span>
                )}
              </button>
            );
          })}
          {selectedPeriod?.month && (
            <button className='text-xs text-slate-500 hover:text-slate-700' onClick={clearMonthSelection}>
              Clear month selection
            </button>
          )}
        </div>
      )}

      {/* Week selection if a quarter is selected and has weeks */}
      {currentQuarterData.weeks && currentQuarterData.weeks.length > 0 && (
        <div className='mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4'>
          <div className='mb-2 w-full'>
            <span className='text-xs font-medium text-slate-600'>Weeks</span>
          </div>
          {currentQuarterData.weeks.map((week) => {
            const isSelected = currentWeek === week.weekNumber;
            return (
              <button
                key={`Week-${week.weekNumber}`}
                className={`relative rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 ${
                  isSelected ? 'bg-blue-100 text-blue-700 shadow-sm' : 'border border-slate-100 hover:bg-slate-50 hover:text-blue-600'
                }`}
                onClick={() => handleWeekSelect(week.weekNumber)}
                aria-pressed={isSelected}
              >
                <span className='relative z-10'>Week {week.weekNumber}</span>
                {week.activityCount > 0 && <span className='ml-1 inline-block rounded-full bg-blue-50 px-1.5 text-xs text-blue-600'>{week.activityCount}</span>}
              </button>
            );
          })}
          {currentWeek && (
            <button className='text-xs text-slate-500 hover:text-slate-700' onClick={clearWeekSelection}>
              Clear week selection
            </button>
          )}
        </div>
      )}
    </div>
  );
}
