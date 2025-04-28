import { BarChart, LineChart } from '@/app/components/ui/charts';
import { useInsight } from '../../hooks/useInsight';

/**
 * Time usage breakdown component
 */
function TimeUsageBreakdown() {
  const { dailyActivities, weeklyProgress, quarterlyProgress, selectedTimeFrame } = useInsight();

  // Create data for time spent chart
  const getTimeSpentData = () => {
    // Check for valid data and provide defaults if needed
    if (selectedTimeFrame === 'week') {
      // Ensure dailyActivities exists and is an array
      if (!dailyActivities || !Array.isArray(dailyActivities) || dailyActivities.length === 0) {
        return [];
      }

      return dailyActivities
        .filter((day) => day !== null && day !== undefined) // Filter out null/undefined entries
        .map((day) => ({
          // Safely access properties with null checks
          label: day && day.day ? day.day.substring(0, 3) : 'N/A',
          value: day && typeof day.timeSpent === 'number' ? parseFloat((day.timeSpent / 60).toFixed(1)) : 0, // Convert minutes to hours
          day: day && day.day ? day.day : 'Unknown',
          date: day && day.date ? day.date : '',
        }));
    } else {
      // Ensure quarterlyProgress exists and contains weeks
      if (!quarterlyProgress || !quarterlyProgress.weeks || !Array.isArray(quarterlyProgress.weeks) || quarterlyProgress.weeks.length === 0) {
        return [];
      }

      return quarterlyProgress.weeks
        .filter((week) => week !== null && week !== undefined) // Filter out null/undefined entries
        .map((week) => ({
          // Safely access properties with null checks
          label: week && week.week ? week.week.replace('Week ', 'W') : 'W?',
          value: week && typeof week.totalTimeSpent === 'number' ? parseFloat((week.totalTimeSpent / 60).toFixed(1)) : 0, // Convert minutes to hours
          week: week && week.week ? week.week : 'Unknown',
          startDate: week && week.startDate ? week.startDate : '',
          endDate: week && week.endDate ? week.endDate : '',
        }));
    }
  };

  const timeSpentData = getTimeSpentData();

  const totalHours = timeSpentData.reduce((sum, item) => sum + (item.value || 0), 0);
  const activeDays = timeSpentData.filter((item) => item && item.value && item.value > 0).length;
  const avgHours = activeDays > 0 ? totalHours / activeDays : 0;

  // Handle empty data case for maxHours
  const maxHours = timeSpentData.length > 0 ? Math.max(...timeSpentData.map((item) => item.value || 0)) : 0;

  const maxDay = timeSpentData.find((item) => item.value === maxHours);

  return (
    <div className='flex h-full flex-col rounded-lg border border-gray-200 bg-white/80 p-6'>
      <div className='flex flex-col items-start justify-between md:flex-row md:items-center'>
        <div>
          <h3 className='text-lg font-medium text-gray-800'>{selectedTimeFrame === 'week' ? 'Time Allocation' : 'Quarterly Time Usage'}</h3>
          <p className='text-sm text-gray-600'>Hours invested across days with key metrics</p>
        </div>

        <div className='mt-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 md:mt-0'>{totalHours.toFixed(1)} total hours</div>
      </div>

      <div className='mt-4 grid grid-cols-3 gap-4'>
        <div className='rounded-lg bg-blue-50 p-3 text-center'>
          <div className='mb-1 text-xs text-gray-600'>Average Hours</div>
          <div className='text-xl font-semibold text-blue-700'>{avgHours.toFixed(1)}</div>
          <div className='text-xs text-gray-500'>per active day</div>
        </div>

        <div className='rounded-lg bg-green-50 p-3 text-center'>
          <div className='mb-1 text-xs text-gray-600'>Most Active</div>
          <div className='text-xl font-semibold text-green-700'>{maxDay?.day || 'N/A'}</div>
          <div className='text-xs text-gray-500'>{maxHours.toFixed(1)} hours</div>
        </div>

        <div className='rounded-lg bg-purple-50 p-3 text-center'>
          <div className='mb-1 text-xs text-gray-600'>Active Days</div>
          <div className='text-xl font-semibold text-purple-700'>{activeDays}</div>
          <div className='text-xs text-gray-500'>this {selectedTimeFrame}</div>
        </div>
      </div>

      <div className='mt-4 flex-1 rounded-xl border border-gray-100 bg-gray-50 p-4'>
        <BarChart
          data={timeSpentData}
          height='100%'
          barColor='#3b82f6' // blue-500
          showLabels={true}
          showValues={true}
          yAxisLabel='Hours'
          xAxisLabel={selectedTimeFrame === 'week' ? 'Days of Week' : 'Weeks of Quarter'}
          minValue={0}
        />
      </div>
    </div>
  );
}

/**
 * Time distribution component
 */
function TimeDistribution() {
  const { effortDistribution, selectedTimeFrame, quarterlyProgress } = useInsight();

  // Get the appropriate data based on time frame
  const currentEffortData = selectedTimeFrame === 'week' ? effortDistribution || [] : []; // Since mockQuarterlyEffortDistribution doesn't exist in the context

  // Get total hours with null check
  const totalHours = Array.isArray(currentEffortData) ? currentEffortData.reduce((total, item) => total + (item && item.value ? item.value / 60 : 0), 0) : 0;

  // Get the category with most time spent
  // Safely get top category with null check
  const topCategory =
    currentEffortData && Array.isArray(currentEffortData) && currentEffortData.length > 0
      ? [...currentEffortData].sort((a, b) => (b.percentage || 0) - (a.percentage || 0))[0]
      : null;

  // Get color for category
  const getCategoryColor = (category) => {
    switch (category.toLowerCase()) {
      case 'planning':
        return {
          bg: 'bg-blue-500',
          light: 'bg-blue-50',
          text: 'text-blue-700',
        };
      case 'execution':
        return {
          bg: 'bg-green-500',
          light: 'bg-green-50',
          text: 'text-green-700',
        };
      case 'review':
        return {
          bg: 'bg-yellow-500',
          light: 'bg-yellow-50',
          text: 'text-yellow-700',
        };
      case 'administrative':
        return {
          bg: 'bg-gray-500',
          light: 'bg-gray-50',
          text: 'text-gray-700',
        };
      default:
        return {
          bg: 'bg-purple-500',
          light: 'bg-purple-50',
          text: 'text-purple-700',
        };
    }
  };

  // Sort by percentage descending with null safety
  const sortedEffortDistribution =
    currentEffortData && Array.isArray(currentEffortData) && currentEffortData.length > 0
      ? [...currentEffortData].sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
      : [];

  // Get second most time category for comparison
  const secondCategory = sortedEffortDistribution.length > 1 ? sortedEffortDistribution[1] : null;

  // Calculate ratio between top and second category
  const ratio =
    topCategory && secondCategory && secondCategory.percentage && secondCategory.percentage > 0
      ? Math.round(((topCategory.percentage || 0) / secondCategory.percentage) * 10) / 10
      : 0;

  return (
    <div className='flex h-full flex-col rounded-lg border border-gray-200 bg-white/80 p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-medium text-gray-800'>{selectedTimeFrame === 'week' ? 'Time Distribution' : 'Quarterly Time Distribution'}</h3>
          <p className='text-sm text-gray-600'>How your time is allocated across activity types</p>
        </div>
        <div className='rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700'>{totalHours.toFixed(1)} hrs total</div>
      </div>

      {/* Category comparison stats */}
      <div className='mb-4 grid grid-cols-2 gap-4'>
        <div className='rounded-lg border border-gray-100 bg-white/80 p-3'>
          <div className='mb-2 flex items-center'>
            <div className={`h-4 w-4 rounded-sm ${topCategory ? topCategory.color : 'bg-blue-500'} mr-2`}></div>
            <span className='text-sm font-medium text-gray-800'>Primary Focus</span>
          </div>

          <div className='flex items-baseline justify-between'>
            <span className='text-xl font-semibold text-gray-900'>{topCategory ? topCategory.category : 'N/A'}</span>
            <span className='text-sm font-medium text-gray-500'>{topCategory ? topCategory.percentage.toFixed(1) : 0}%</span>
          </div>

          <div className='mt-1 text-xs text-gray-500'>{topCategory ? (topCategory.value / 60).toFixed(1) : 0} hours</div>
        </div>

        <div className='rounded-lg border border-gray-100 bg-white/80 p-3'>
          <div className='mb-2 flex items-center justify-between'>
            <div className='flex items-center'>
              <div className={`h-4 w-4 rounded-sm ${secondCategory ? secondCategory.color : 'bg-purple-500'} mr-2`}></div>
              <span className='text-sm font-medium text-gray-800'>Balance Ratio</span>
            </div>
            <span className='text-sm font-medium text-gray-500'>{ratio}:1</span>
          </div>

          <div className='flex items-baseline justify-between'>
            <span className='text-xl font-semibold text-gray-900'>{secondCategory ? secondCategory.category : 'N/A'}</span>
            <span className='text-sm font-medium text-gray-500'>{secondCategory ? secondCategory.percentage.toFixed(1) : 0}%</span>
          </div>

          <div className='mt-1 text-xs text-gray-500'>{secondCategory ? (secondCategory.value / 60).toFixed(1) : 0} hours</div>
        </div>
      </div>

      {/* Visual distribution bar */}
      <div className='mb-4'>
        <div className='flex h-8 w-full overflow-hidden rounded-md'>
          {sortedEffortDistribution.map((effort) => (
            <div key={effort.category || 'unknown'} className={`${effort.color || 'bg-gray-500'} relative`} style={{ width: `${effort.percentage || 0}%` }}>
              {(effort.percentage || 0) > 10 && (
                <span className='absolute inset-0 flex items-center justify-center text-xs font-medium text-white'>{effort.category || 'Unknown'}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Distribution bars with details */}
      <div className='max-h-80 space-y-3 overflow-y-auto pr-2'>
        {sortedEffortDistribution.map((effort) => (
          <div key={effort.category || 'unknown'} className='rounded-lg bg-gray-50 p-3'>
            <div className='mb-2 flex items-center justify-between'>
              <div className='flex items-center'>
                <div className={`mr-2 h-4 w-2 rounded-full ${effort.color || 'bg-gray-500'}`}></div>
                <span className='text-sm font-medium text-gray-800'>{effort.category || 'Unknown'}</span>
              </div>
              <div>
                <span className='text-sm font-medium'>{((effort.value || 0) / 60).toFixed(1)} hrs</span>
                <span className='ml-2 text-sm text-gray-500'>({(effort.percentage || 0).toFixed(1)}%)</span>
              </div>
            </div>
            <div className='h-2.5 w-full overflow-hidden rounded-full bg-gray-200'>
              <div className={`h-2.5 rounded-full ${effort.color || 'bg-gray-500'}`} style={{ width: `${effort.percentage || 0}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Time efficiency component
 */
function TimeEfficiency() {
  const { dailyActivities, weeklyProgress, quarterlyProgress, selectedTimeFrame } = useInsight();

  // Create data for efficiency chart
  const getEfficiencyData = () => {
    if (selectedTimeFrame === 'week') {
      // Ensure dailyActivities exists and is an array
      if (!dailyActivities || !Array.isArray(dailyActivities) || dailyActivities.length === 0) {
        return [];
      }

      return dailyActivities
        .filter((day) => day && day.timeSpent && day.timeSpent > 0) // Filter out days with no activity
        .map((day) => ({
          label: day && day.day ? day.day.substring(0, 3) : 'N/A',
          value: day && day.efficiency !== undefined ? day.efficiency : 0,
        }));
    } else {
      // Ensure quarterlyProgress exists and contains weeks
      if (!quarterlyProgress || !quarterlyProgress.weeks || !Array.isArray(quarterlyProgress.weeks) || quarterlyProgress.weeks.length === 0) {
        return [];
      }

      return quarterlyProgress.weeks.map((week) => ({
        label: week && week.week ? week.week.replace('Week ', 'W') : 'W?',
        value: week && week.efficiency !== undefined ? week.efficiency : 0,
      }));
    }
  };

  const efficiencyData = getEfficiencyData();

  // Safely generate title with fallbacks
  const title =
    selectedTimeFrame === 'week'
      ? `Efficiency: ${weeklyProgress && weeklyProgress.week ? weeklyProgress.week : 'Current Week'}`
      : `Efficiency: ${quarterlyProgress && quarterlyProgress.quarter ? quarterlyProgress.quarter : 'Current Quarter'}`;

  // Safely get average efficiency with fallbacks
  const avgEfficiency =
    selectedTimeFrame === 'week'
      ? weeklyProgress && weeklyProgress.efficiency !== undefined
        ? weeklyProgress.efficiency
        : 0
      : quarterlyProgress && quarterlyProgress.efficiency !== undefined
      ? quarterlyProgress.efficiency
      : 0;

  return (
    <div className='flex h-full flex-col rounded-lg border border-gray-200 bg-white/80 p-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-medium text-gray-800'>{title}</h3>
        <div className='text-sm font-medium text-blue-600'>Avg: {avgEfficiency}%</div>
      </div>

      <div className='mt-4 flex-1'>
        <LineChart
          data={efficiencyData}
          height='100%'
          lineColor='#10b981' // green-500
          fillColor='rgba(16, 185, 129, 0.1)'
          yAxisLabel='Efficiency %'
          xAxisLabel={selectedTimeFrame === 'week' ? 'Days of Week' : 'Weeks of Quarter'}
          minValue={0}
          maxValue={100}
        />
      </div>
    </div>
  );
}

/**
 * Time tab component for performance view
 */
export function TimeTab() {
  return (
    <div className='flex h-full flex-col'>
      <div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
        <div className='flex-1'>
          <TimeUsageBreakdown />
        </div>
        <div className='flex-1'>
          <TimeDistribution />
        </div>
      </div>
    </div>
  );
}
