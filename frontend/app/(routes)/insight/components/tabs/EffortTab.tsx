import { AreaChart } from '@/app/components/ui/charts';
import { useInsight } from '../../hooks/useInsight';

/**
 * Step Tracker component using AreaChart
 */
function StepTracker() {
  const { dailyActivities, weeklyProgress, quarterlyProgress, selectedTimeFrame } = useInsight();

  // Transform data based on selected time frame with null checks
  const getStepData = () => {
    if (selectedTimeFrame === 'week') {
      // Ensure dailyActivities exists and is an array
      if (!dailyActivities || !Array.isArray(dailyActivities) || dailyActivities.length === 0) {
        return [];
      }

      return dailyActivities.map((activity) => ({
        // Safely access properties with null checks
        label: activity && activity.day ? activity.day.substring(0, 3) : 'N/A', // Short day name (Mon, Tue, etc.)
        value: activity && activity.stepsCompleted !== undefined ? activity.stepsCompleted : 0,
      }));
    } else {
      // Ensure quarterlyProgress exists and contains weeks
      if (!quarterlyProgress || !quarterlyProgress.weeks || !Array.isArray(quarterlyProgress.weeks) || quarterlyProgress.weeks.length === 0) {
        return [];
      }

      return quarterlyProgress.weeks.map((week) => ({
        // Safely access properties with null checks
        label: week && week.week ? week.week.replace('Week ', 'W') : 'W?',
        value: week && week.stepsCompleted !== undefined ? week.stepsCompleted : 0,
      }));
    }
  };

  const stepData = getStepData();

  // Calculate metrics based on time frame with null checks
  const totalSteps =
    selectedTimeFrame === 'week'
      ? weeklyProgress && weeklyProgress.stepsCompleted !== undefined
        ? weeklyProgress.stepsCompleted
        : 0
      : quarterlyProgress && quarterlyProgress.stepsCompleted !== undefined
      ? quarterlyProgress.stepsCompleted
      : 0;

  // Find the day/week with most steps with null checks
  const getMostProductive = () => {
    if (selectedTimeFrame === 'week') {
      // Ensure dailyActivities exists and is an array
      if (!dailyActivities || !Array.isArray(dailyActivities) || dailyActivities.length === 0) {
        return null;
      }

      // Create a safe copy and sort
      const sorted = [...dailyActivities]
        .filter((item) => item && item.stepsCompleted !== undefined) // Filter out undefined items
        .sort((a, b) => (b.stepsCompleted || 0) - (a.stepsCompleted || 0));

      return sorted.length > 0 ? sorted[0] : null;
    } else {
      // Ensure quarterlyProgress exists and contains weeks
      if (!quarterlyProgress || !quarterlyProgress.weeks || !Array.isArray(quarterlyProgress.weeks) || quarterlyProgress.weeks.length === 0) {
        return null;
      }

      // Create a safe copy and sort
      const sorted = [...quarterlyProgress.weeks]
        .filter((item) => item && item.stepsCompleted !== undefined) // Filter out undefined items
        .sort((a, b) => (b.stepsCompleted || 0) - (a.stepsCompleted || 0));

      return sorted.length > 0 ? sorted[0] : null;
    }
  };

  const mostProductive = getMostProductive();

  // Calculate average steps with null checks
  const getAvgSteps = () => {
    if (selectedTimeFrame === 'week') {
      // Ensure dailyActivities exists and is an array
      if (!dailyActivities || !Array.isArray(dailyActivities) || dailyActivities.length === 0) {
        return 0;
      }

      // For weekly, exclude days with 0 steps (weekends)
      const workdays = dailyActivities.filter((day) => day && day.stepsCompleted && day.stepsCompleted > 0);

      return workdays.length > 0 ? workdays.reduce((sum, day) => sum + (day.stepsCompleted || 0), 0) / workdays.length : 0;
    } else {
      // Ensure quarterlyProgress exists and contains weeks
      if (!quarterlyProgress || !quarterlyProgress.weeks || !Array.isArray(quarterlyProgress.weeks) || quarterlyProgress.weeks.length === 0) {
        return 0;
      }

      // For quarterly, include all weeks
      const validWeeks = quarterlyProgress.weeks.filter((week) => week && week.stepsCompleted !== undefined);

      return validWeeks.length > 0 ? validWeeks.reduce((sum, week) => sum + (week.stepsCompleted || 0), 0) / validWeeks.length : 0;
    }
  };

  const avgSteps = getAvgSteps();

  // Find the max steps for chart scaling with null checks
  const maxSteps = (() => {
    if (selectedTimeFrame === 'week') {
      // Ensure dailyActivities exists and is an array
      if (!dailyActivities || !Array.isArray(dailyActivities) || dailyActivities.length === 0) {
        return 10; // Default value if no data
      }

      // Use map with null checks, and ensure Math.max has valid numbers
      const stepsValues = dailyActivities
        .map((day) => (day && day.stepsCompleted !== undefined ? day.stepsCompleted : 0))
        .filter((val) => !isNaN(val) && val !== null && val !== undefined);

      return stepsValues.length > 0 ? Math.max(...stepsValues) : 10;
    } else {
      // Ensure quarterlyProgress exists and contains weeks
      if (!quarterlyProgress || !quarterlyProgress.weeks || !Array.isArray(quarterlyProgress.weeks) || quarterlyProgress.weeks.length === 0) {
        return 10; // Default value if no data
      }

      // Use map with null checks, and ensure Math.max has valid numbers
      const stepsValues = quarterlyProgress.weeks
        .map((week) => (week && week.stepsCompleted !== undefined ? week.stepsCompleted : 0))
        .filter((val) => !isNaN(val) && val !== null && val !== undefined);

      return stepsValues.length > 0 ? Math.max(...stepsValues) : 10;
    }
  })();

  // Ensure we have a reasonable chart max with fallback
  const chartMax = maxSteps > 0 ? Math.ceil(maxSteps * 1.2) : 10; // Add 20% padding to the top

  return (
    <div className='flex h-full flex-col rounded-lg border border-gray-200 bg-white/80 p-6'>
      <div className='mb-4 flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-medium text-gray-800'>Step Tracker</h3>
          <p className='text-sm text-gray-600'>{selectedTimeFrame === 'week' ? 'Daily completion of process steps' : 'Weekly completion of process steps'}</p>
        </div>
        <div className='rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700'>{totalSteps} steps total</div>
      </div>

      {/* Step stats */}
      <div className='mb-6 grid grid-cols-1 gap-4 md:grid-cols-3'>
        <div className='flex flex-col items-center justify-center rounded-lg bg-blue-50 p-3'>
          <div className='mb-1 text-sm text-gray-600'>Most Productive</div>
          <div className='font-semibold text-blue-700'>{selectedTimeFrame === 'week' ? mostProductive?.day || 'N/A' : mostProductive?.week || 'N/A'}</div>
          <div className='text-xs text-gray-500'>{mostProductive?.stepsCompleted || 0} steps completed</div>
        </div>

        <div className='flex flex-col items-center justify-center rounded-lg bg-purple-50 p-3'>
          <div className='mb-1 text-sm text-gray-600'>{selectedTimeFrame === 'week' ? 'Daily Average' : 'Weekly Average'}</div>
          <div className='font-semibold text-purple-700'>{avgSteps.toFixed(1)}</div>
          <div className='text-xs text-gray-500'>Steps per {selectedTimeFrame === 'week' ? 'workday' : 'week'}</div>
        </div>

        <div className='flex flex-col items-center justify-center rounded-lg bg-green-50 p-3'>
          <div className='mb-1 text-sm text-gray-600'>Completion Rate</div>
          <div className='font-semibold text-green-700'>
            {selectedTimeFrame === 'week'
              ? weeklyProgress && weeklyProgress.efficiency !== undefined
                ? weeklyProgress.efficiency
                : 0
              : quarterlyProgress && quarterlyProgress.efficiency !== undefined
              ? quarterlyProgress.efficiency
              : 0}
            %
          </div>
          <div className='text-xs text-gray-500'>Efficiency score</div>
        </div>
      </div>

      {/* Area chart for steps */}
      <div className='mb-4 h-48'>
        <AreaChart
          data={stepData}
          height='100%'
          width='100%'
          areaColor='#3b82f6' // blue-500
          areaGradientStart='rgba(59, 130, 246, 0.6)'
          areaGradientEnd='rgba(59, 130, 246, 0.1)'
          showPoints={true}
          showGrid={true}
          yAxisLabel='Steps'
          minValue={0}
          maxValue={chartMax}
        />
      </div>

      {/* Period breakdown */}
      {selectedTimeFrame === 'week' ? (
        <div className='mt-4 space-y-2'>
          <h4 className='text-sm font-medium text-gray-700'>Daily Breakdown</h4>
          <div className='grid grid-cols-7 gap-1'>
            {Array.isArray(dailyActivities) &&
              dailyActivities.map(
                (day) =>
                  day && (
                    <div
                      key={day.date || day.day || 'unknown'}
                      className={`flex flex-col items-center rounded-md py-2 ${(day.stepsCompleted || 0) > 0 ? 'bg-blue-50' : 'bg-gray-50'}`}
                    >
                      <div className='text-xs font-medium text-gray-600'>{day.day ? day.day.substring(0, 3) : 'N/A'}</div>
                      <div className={`text-sm font-semibold ${(day.stepsCompleted || 0) > 0 ? 'text-blue-700' : 'text-gray-400'}`}>
                        {day.stepsCompleted || 0}
                      </div>
                    </div>
                  ),
              )}
          </div>
        </div>
      ) : (
        <div className='mt-4 space-y-2'>
          <h4 className='text-sm font-medium text-gray-700'>Weekly Progression</h4>
          <div className='flex flex-col space-y-2'>
            {quarterlyProgress &&
              quarterlyProgress.weeks &&
              Array.isArray(quarterlyProgress.weeks) &&
              quarterlyProgress.weeks.slice(0, 6).map(
                (week) =>
                  week && (
                    <div key={week.week || 'unknown'} className='flex items-center justify-between rounded-md bg-blue-50 px-3 py-2'>
                      <div className='text-xs font-medium text-gray-600'>{week.week || 'Week ?'}</div>
                      <div className='flex items-center'>
                        <div className='text-sm font-semibold text-blue-700'>{week.stepsCompleted || 0} steps</div>
                        <div className='ml-2 text-xs text-gray-500'>({week.efficiency || 0}% efficiency)</div>
                      </div>
                    </div>
                  ),
              )}
            {quarterlyProgress && quarterlyProgress.weeks && Array.isArray(quarterlyProgress.weeks) && quarterlyProgress.weeks.length > 6 && (
              <div className='text-center text-xs font-medium text-blue-600'>+ {quarterlyProgress.weeks.length - 6} more weeks</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Process complexity component
 */
function ProcessComplexity() {
  const { activeProcesses, completedProcesses, selectedTimeFrame } = useInsight();

  // Get the appropriate data based on selected time frame with safe fallbacks
  const currentActiveProcesses = selectedTimeFrame === 'week' ? activeProcesses || [] : []; // mockQuarterlyActiveProcesses doesn't exist in context

  const currentCompletedProcesses = selectedTimeFrame === 'week' ? completedProcesses || [] : []; // mockQuarterlyCompletedProcesses doesn't exist in context

  // Calculate total time spent on processes with null checks
  const getTotalTimeSpent = () => {
    const activeTime = Array.isArray(currentActiveProcesses)
      ? currentActiveProcesses.reduce((sum, proc) => sum + (proc && proc.timeSpent ? proc.timeSpent : 0), 0)
      : 0;

    const completedTime = Array.isArray(currentCompletedProcesses)
      ? currentCompletedProcesses.reduce((sum, proc) => sum + (proc && proc.timeSpent ? proc.timeSpent : 0), 0)
      : 0;

    return activeTime + completedTime;
  };

  const totalTime = getTotalTimeSpent();

  // Group processes by complexity with null checks
  const complexityGroups = [1, 2, 3, 4, 5].map((complexity) => {
    // Safely combine arrays with null checks
    const allProcesses = [];
    if (Array.isArray(currentActiveProcesses)) {
      allProcesses.push(...currentActiveProcesses);
    }
    if (Array.isArray(currentCompletedProcesses)) {
      allProcesses.push(...currentCompletedProcesses);
    }

    // Filter with null checks
    const matchingProcesses = allProcesses.filter((proc) => proc && proc.complexity === complexity);

    // Safe reduce with null checks
    const timeSpent = matchingProcesses.reduce((sum, proc) => sum + (proc && proc.timeSpent ? proc.timeSpent : 0), 0);
    const percentage = totalTime > 0 ? (timeSpent / totalTime) * 100 : 0;

    return {
      complexity,
      processes: matchingProcesses,
      count: matchingProcesses.length,
      timeSpent,
      percentage,
    };
  });

  // Create data for bar chart
  const complexityData = complexityGroups.map((group) => ({
    label: `Complexity ${group.complexity}`,
    value: group.timeSpent / 60, // Convert to hours
    color:
      group.complexity === 5
        ? '#ef4444' // red
        : group.complexity === 4
        ? '#f59e0b' // yellow
        : group.complexity === 3
        ? '#3b82f6' // blue
        : group.complexity === 2
        ? '#10b981' // green
        : '#6b7280', // gray
  }));

  return (
    <div className='flex h-full flex-col rounded-lg border border-gray-200 bg-white/80 p-6'>
      <h3 className='mb-2 text-lg font-medium text-gray-800'>{selectedTimeFrame === 'week' ? 'Process Complexity' : 'Quarterly Process Complexity'}</h3>
      <p className='mb-4 text-sm text-gray-600'>Time allocation across different complexity levels</p>

      <div className='mt-4 h-40'>
        <BarChart data={complexityData} height='100%' showLabels={true} showValues={true} yAxisLabel='Hours Spent' xAxisLabel='Complexity Level' minValue={0} />
      </div>

      <div className='mt-6 grid grid-cols-5 gap-2'>
        {complexityGroups.map((group) => (
          <div key={group.complexity} className='text-center'>
            <div
              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full ${
                group.complexity === 5
                  ? 'bg-red-100 text-red-600'
                  : group.complexity === 4
                  ? 'bg-yellow-100 text-yellow-600'
                  : group.complexity === 3
                  ? 'bg-blue-100 text-blue-600'
                  : group.complexity === 2
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {group.complexity}
            </div>
            <p className='mt-1 text-xs font-medium'>{group.count} processes</p>
            <p className='text-xs text-gray-500'>{group.percentage.toFixed(1)}% of time</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Effort tab component
 */
export function EffortTab() {
  return (
    <div className='flex h-full flex-col'>
      <div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
        <StepTracker />
        <ProcessComplexity />
      </div>
    </div>
  );
}
