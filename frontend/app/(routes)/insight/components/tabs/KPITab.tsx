import { AreaChart, LineChart } from '@/app/components/ui/charts';
import { LoadingSpinner } from '@/app/components/ui/loading';
import { ProgressBar } from '@/app/components/ui/stats';
import { useState, useEffect } from 'react';
import { useInsight } from '../../hooks/useInsight';

/**
 * Key performance indicators component
 */
function CoreMetrics() {
  const { coreMetrics, selectedTimeFrame } = useInsight();
  const [isLoading, setIsLoading] = useState(false);
  const [displayedMetrics, setDisplayedMetrics] = useState(coreMetrics || []);

  // These are static and don't need to be recalculated on each render
  // Colors for the different metrics
  const metricColors = {
    'events-completed': {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      text: 'text-blue-700',
      accent: 'text-blue-500',
      iconBg: 'bg-blue-500',
    },
    'completion-rate': {
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      text: 'text-green-700',
      accent: 'text-green-500',
      iconBg: 'bg-green-500',
    },
    efficiency: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      text: 'text-purple-700',
      accent: 'text-purple-500',
      iconBg: 'bg-purple-500',
    },
    'steps-completed': {
      bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
      text: 'text-yellow-700',
      accent: 'text-yellow-500',
      iconBg: 'bg-yellow-500',
    },
    'time-spent': {
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
      text: 'text-amber-700',
      accent: 'text-amber-500',
      iconBg: 'bg-amber-500',
    },
    'avg-complexity': {
      bg: 'bg-gradient-to-br from-red-50 to-red-100',
      text: 'text-red-700',
      accent: 'text-red-500',
      iconBg: 'bg-red-500',
    },
  };

  // Icons for the different metrics
  const metricIcons = {
    'events-completed': (
      <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
        />
      </svg>
    ),
    'completion-rate': (
      <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
      </svg>
    ),
    efficiency: (
      <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M13 10V3L4 14h7v7l9-11h-7z' />
      </svg>
    ),
    'steps-completed': (
      <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
        />
      </svg>
    ),
    'time-spent': (
      <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />
      </svg>
    ),
    'avg-complexity': (
      <svg className='h-5 w-5' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
        <path
          strokeLinecap='round'
          strokeLinejoin='round'
          strokeWidth={1.5}
          d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
        />
      </svg>
    ),
  };

  // Filter metrics based on time frame and when core metrics change
  useEffect(() => {
    setIsLoading(true);

    // Ensure coreMetrics exists and is an array
    if (Array.isArray(coreMetrics) && coreMetrics.length > 0) {
      // Define which metrics to show based on time frame
      let metricsToShow: string[] = [];

      // For short-term views (week/month)
      if (selectedTimeFrame === 'week' || selectedTimeFrame === 'month') {
        metricsToShow = ['events-completed', 'avg-complexity', 'time-spent', 'steps-completed'];
      }
      // For long-term views (quarter/year)
      else if (selectedTimeFrame === 'quarter' || selectedTimeFrame === 'year') {
        metricsToShow = ['events-completed', 'avg-complexity', 'time-spent', 'steps-completed'];
      }
      // For custom time frames
      else {
        metricsToShow = ['events-completed', 'avg-complexity', 'time-spent', 'steps-completed'];
      }

      // Filter the metrics based on the selected time frame
      // Ensure each metric is a valid object with an id property
      const filtered = coreMetrics.filter((metric) => metric && typeof metric === 'object' && metric.id).filter((metric) => metricsToShow.includes(metric.id));

      setDisplayedMetrics(filtered);
    } else {
      // Set empty array if coreMetrics is invalid
      setDisplayedMetrics([]);
    }

    setIsLoading(false);
  }, [coreMetrics, selectedTimeFrame]);

  return (
    <div className='rounded-xl border border-gray-200 bg-white/80 p-6'>
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-medium text-gray-800'>Performance Overview</h3>
          <p className='text-sm text-gray-600'>Key performance indicators for this period</p>
        </div>
        <div className='rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700'>KPI</div>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {displayedMetrics.map((metric) => {
          // Determine colors based on backend data or fallback to our mapping
          const colorKey = metric.color || metric.id;
          // Use our predefined colors if we have them, otherwise generate based on backend color
          const colors =
            metricColors[metric.id] ||
            (metric.color
              ? {
                  bg: `bg-gradient-to-br from-${metric.color}-50 to-${metric.color}-100`,
                  text: `text-${metric.color}-700`,
                  accent: `text-${metric.color}-500`,
                  iconBg: `bg-${metric.color}-500`,
                }
              : {
                  bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
                  text: 'text-gray-700',
                  accent: 'text-gray-500',
                  iconBg: 'bg-gray-500',
                });

          return (
            <div key={metric.id} className={`${colors.bg} rounded-xl border border-gray-100 p-4 shadow-sm`}>
              <div className='mb-3 flex items-center'>
                <div className={`h-8 w-8 rounded-full ${colors.accent} flex items-center justify-center bg-white/80 shadow-sm`}>{metricIcons[metric.id]}</div>
                <h4 className='ml-2 text-sm font-medium text-gray-600'>{metric.name}</h4>
              </div>

              <div className='flex items-baseline'>
                <p className={`text-2xl font-bold ${colors.text}`}>{metric.value}</p>
                {metric.unit && <span className='ml-1 text-gray-600'>{metric.unit}</span>}
              </div>

              <div className='mt-2 flex items-center'>
                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${metric.isPositive ? 'bg-green-100' : 'bg-red-100'}`}>
                  <svg className={`h-3 w-3 ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`} fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2.5}
                      d={metric.isPositive ? 'M5 15l7-7m0 0l7 7m-7-7v18' : 'M19 9l-7 7m0 0l-7-7m7 7V2'}
                    />
                  </svg>
                </div>
                <span className={`ml-1.5 text-xs font-medium ${metric.isPositive ? 'text-green-600' : 'text-red-600'}`}>{Math.abs(metric.change)}%</span>
                <span className='ml-1.5 text-xs text-gray-500'>vs last period</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Progress overview component
 */
function ProgressOverview() {
  const { activeProcesses, dailyActivities, weeklyProgress, quarterlyProgress, selectedTimeFrame } = useInsight();

  const [isChartLoading, setIsChartLoading] = useState(true);
  const [progressData, setProgressData] = useState<{ label: string; value: number }[]>([]);

  // Sort processes by progress with null check
  const topProcesses = activeProcesses && activeProcesses.length > 0 ? [...activeProcesses].sort((a, b) => b.progress - a.progress).slice(0, 3) : [];

  // Get current progress data based on timeframe
  const currentProgress = selectedTimeFrame === 'week' ? weeklyProgress : quarterlyProgress;

  // Get data from context
  const { dailyBurnup, quarterlyBurnup } = useInsight();

  // Separate the data processing to improve performance
  useEffect(() => {
    setIsChartLoading(true);

    // Use requestAnimationFrame to schedule this work at an appropriate time
    const timerId = requestAnimationFrame(() => {
      let data: { label: string; value: number }[] = [];

      if (selectedTimeFrame === 'week') {
        // Make sure dailyBurnup exists and is an array
        if (dailyBurnup && Array.isArray(dailyBurnup)) {
          data = dailyBurnup.map((day) => ({
            label: day.day ? day.day.substring(0, 3) : 'Day',
            value: day.progress || 0,
          }));
        } else if (dailyActivities && Array.isArray(dailyActivities)) {
          // Fallback to dailyActivities if dailyBurnup is not available
          data = dailyActivities.map((day, index) => ({
            label: day.day ? day.day.substring(0, 3) : `Day ${index + 1}`,
            value: day.efficiency || 0,
          }));
        }
      } else {
        // Make sure quarterlyBurnup exists and is an array
        if (quarterlyBurnup && Array.isArray(quarterlyBurnup)) {
          data = quarterlyBurnup.map((week) => ({
            label: week.week ? week.week.replace('Week ', 'W') : 'W',
            value: week.progress || 0,
          }));
        }
      }

      setProgressData(data);
      setIsChartLoading(false);
    });

    return () => cancelAnimationFrame(timerId);
  }, [selectedTimeFrame, dailyBurnup, quarterlyBurnup, dailyActivities]);

  return (
    <div className='flex h-full flex-col rounded-lg border border-gray-200 bg-white/80 p-6'>
      <h3 className='mb-2 text-lg font-medium text-gray-800'>
        {selectedTimeFrame === 'week'
          ? 'Weekly Progress'
          : selectedTimeFrame === 'month'
          ? 'Monthly Progress'
          : selectedTimeFrame === 'quarter'
          ? 'Quarterly Progress'
          : selectedTimeFrame === 'year'
          ? 'Yearly Progress'
          : 'Custom Progress'}{' '}
        Overview
      </h3>
      <p className='mb-4 text-sm text-gray-600'>Progress toward your goals in this {selectedTimeFrame === 'custom' ? 'time period' : selectedTimeFrame}</p>

      <div className='mb-4 flex-1'>
        {isChartLoading ? (
          <div className='flex h-[200px] items-center justify-center'>
            <LoadingSpinner size='md' />
          </div>
        ) : (
          <AreaChart
            data={progressData}
            height='100%'
            areaColor='#10b981'
            areaGradientStart='rgba(16, 185, 129, 0.7)'
            areaGradientEnd='rgba(16, 185, 129, 0.1)'
            showTarget={true}
            yAxisLabel='Progress %'
            minValue={0}
            maxValue={100}
          />
        )}
      </div>

      <div className='mt-4'>
        <h4 className='mb-2 text-sm font-medium text-gray-700'>Top Active Processes</h4>
        <div className='space-y-3'>
          {topProcesses.map((process) => (
            <div key={process.id} className='space-y-1'>
              <div className='flex items-center justify-between'>
                <span className='truncate pr-2 text-sm'>{process.name}</span>
                <span className='text-xs text-gray-500'>{process.progress}%</span>
              </div>
              <ProgressBar
                label=''
                value={process.progress}
                color={
                  process.progress >= 75 ? 'bg-green-500' : process.progress >= 50 ? 'bg-blue-500' : process.progress >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                }
                showLabel={false}
                height='h-2'
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Time usage component
 */
function TimeUsage() {
  const { dailyActivities, effortDistribution, selectedTimeFrame, quarterlyProgress, weeklyProgress } = useInsight();

  const [isLoading, setIsLoading] = useState(true);
  const [timeData, setTimeData] = useState<{ label: string; value: number }[]>([]);
  const [timeMetrics, setTimeMetrics] = useState({
    totalHours: 0,
    avgPerPeriod: 0,
    maxHoursPerPeriod: 0,
  });

  // Process data separately to improve performance
  useEffect(() => {
    setIsLoading(true);

    // Use setTimeout to defer processing
    const timer = setTimeout(() => {
      let data: { label: string; value: number }[] = [];

      if (selectedTimeFrame === 'week') {
        // Ensure dailyActivities exists and is an array before filtering
        if (dailyActivities && Array.isArray(dailyActivities)) {
          // Filter out days with no activity
          const activeDays = dailyActivities.filter((day) => day && day.timeSpent && day.timeSpent > 0);

          data = activeDays.map((day) => ({
            label: day.day ? day.day.substring(0, 3) : 'Day',
            value: parseFloat(((day.timeSpent || 0) / 60).toFixed(1)), // Convert minutes to hours
          }));
        }
      } else {
        // For quarterly view - ensure weeks exists and is an array before mapping
        if (quarterlyProgress && quarterlyProgress.weeks && Array.isArray(quarterlyProgress.weeks)) {
          data = quarterlyProgress.weeks.map((week) => ({
            label: week.week ? week.week.replace('Week ', 'W') : 'W',
            value: parseFloat(((week.totalTimeSpent || 0) / 60).toFixed(1)), // Convert minutes to hours
          }));
        } else {
          // Default empty data if weeks is missing
          data = [];
        }
      }

      // Calculate time metrics
      const totalHours = data.reduce((sum, item) => sum + (item.value || 0), 0);

      // Calculate average - only count periods with data
      const periodsWithData = data.filter((item) => item.value > 0).length;
      const avgPerPeriod = periodsWithData > 0 ? totalHours / periodsWithData : 0;

      // Find maximum safely
      const maxHoursPerPeriod = data.length > 0 ? Math.max(...data.map((item) => item.value || 0)) : 0;

      setTimeData(data);
      setTimeMetrics({
        totalHours,
        avgPerPeriod,
        maxHoursPerPeriod,
      });
      setIsLoading(false);
    }, 200); // slight delay after the other charts

    return () => clearTimeout(timer);
  }, [selectedTimeFrame, dailyActivities, quarterlyProgress, weeklyProgress]);

  return (
    <div className='flex h-full flex-col rounded-lg border border-gray-200 bg-white/80 p-6'>
      <h3 className='mb-2 text-lg font-medium text-gray-800'>Time Usage</h3>
      <p className='mb-4 text-sm text-gray-600'>
        How your time is being spent during this {selectedTimeFrame === 'custom' ? 'time period' : selectedTimeFrame}
      </p>

      <div className='mb-4 grid grid-cols-3 gap-4'>
        <div className='rounded-md bg-gray-50 p-2 text-center'>
          <p className='text-xs text-gray-500'>Total Hours</p>
          <p className='text-xl font-semibold'>{timeMetrics.totalHours.toFixed(1)}</p>
        </div>
        <div className='rounded-md bg-gray-50 p-2 text-center'>
          <p className='text-xs text-gray-500'>
            {selectedTimeFrame === 'week'
              ? 'Avg. Daily'
              : selectedTimeFrame === 'month'
              ? 'Avg. Daily'
              : selectedTimeFrame === 'quarter'
              ? 'Avg. Weekly'
              : selectedTimeFrame === 'year'
              ? 'Avg. Monthly'
              : 'Avg. Per Day'}
          </p>
          <p className='text-xl font-semibold'>{timeMetrics.avgPerPeriod.toFixed(1)}</p>
        </div>
        <div className='rounded-md bg-gray-50 p-2 text-center'>
          <p className='text-xs text-gray-500'>Most Active</p>
          <p className='text-xl font-semibold'>{timeMetrics.maxHoursPerPeriod.toFixed(1)}</p>
        </div>
      </div>

      <div className='flex-1'>
        {isLoading ? (
          <div className='flex h-[200px] items-center justify-center'>
            <LoadingSpinner size='md' />
          </div>
        ) : (
          <LineChart
            data={timeData}
            height='100%'
            lineColor='#3b82f6'
            fillColor='rgba(59, 130, 246, 0.1)'
            yAxisLabel='Hours'
            xAxisLabel={
              selectedTimeFrame === 'week'
                ? 'Days of Week'
                : selectedTimeFrame === 'month'
                ? 'Days of Month'
                : selectedTimeFrame === 'quarter'
                ? 'Weeks of Quarter'
                : selectedTimeFrame === 'year'
                ? 'Months of Year'
                : 'Time Period'
            }
            minValue={0}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Efficiency trend component
 */
function EfficiencyTrend() {
  const { dailyActivities, selectedTimeFrame } = useInsight();
  const [isLoading, setIsLoading] = useState(true);
  const [efficiencyData, setEfficiencyData] = useState<{ label: string; value: number }[]>([]);

  // Process data separately to improve performance
  useEffect(() => {
    setIsLoading(true);

    // Use setTimeout with a longer delay for this chart since it's less critical
    const timer = setTimeout(() => {
      // Ensure dailyActivities exists and is an array
      const data = Array.isArray(dailyActivities)
        ? dailyActivities
            .filter((day) => day && day.timeSpent > 0) // Filter out days with no activity
            .map((day) => ({
              label: day.day ? day.day.substring(0, 3) : '',
              value: day.efficiency || 0,
            }))
        : [];

      setEfficiencyData(data);
      setIsLoading(false);
    }, 300); // Longer delay for this less critical chart

    return () => clearTimeout(timer);
  }, [dailyActivities]);

  return (
    <div className='flex h-full flex-col rounded-lg border border-gray-200 bg-white/80 p-6'>
      <h3 className='mb-2 text-lg font-medium text-gray-800'>Efficiency Trend</h3>
      <p className='mb-4 text-sm text-gray-600'>Your work efficiency throughout the week</p>

      {isLoading ? (
        <div className='flex h-[200px] items-center justify-center'>
          <LoadingSpinner size='md' />
        </div>
      ) : (
        <LineChart
          data={efficiencyData}
          height='200px'
          lineColor='#10b981' // green-500
          fillColor='rgba(16, 185, 129, 0.1)'
          yAxisLabel='Efficiency %'
          minValue={0}
          maxValue={100}
        />
      )}
    </div>
  );
}

/**
 * KPI tab component
 */
export function KPITab() {
  return (
    <div className='flex h-full flex-col'>
      <div className='mb-5'>
        <CoreMetrics />
      </div>

      <div className='grid flex-1 grid-cols-1 gap-5 lg:grid-cols-2'>
        <ProgressOverview />
        <TimeUsage />
      </div>
    </div>
  );
}
