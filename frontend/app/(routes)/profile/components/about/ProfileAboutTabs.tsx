import { ProfileTabProps, ProfileViewType } from '../../../../types/profile';
import { useProfile } from '../../hooks/useProfile';

/**
 * Individual profile tab component with count
 */
function ProfileTab({ isActive, onClick, label, count }: ProfileTabProps & { count: number }) {
  return (
    <button
      className={`flex-1 py-3 text-center font-medium transition-colors ${
        isActive ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500 hover:text-gray-700'
      }`}
      onClick={onClick}
      role='tab'
      aria-selected={isActive}
      aria-controls={`${label.toLowerCase()}-panel`}
    >
      <span className='flex items-center justify-center'>
        {label}
        <span className={`ml-2 rounded-full px-2 py-1 text-xs ${isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>{count}</span>
      </span>
    </button>
  );
}

/**
 * Profile navigation tabs component
 */
export function ProfileTabs() {
  const { viewType, setViewType, activities, events, reports, timelineData } = useProfile();

  // Calculate counts from actual data
  const activitiesCount = activities.length;
  const eventsCount = events.length;
  const reportsCount = reports?.length || 0;

  // Alternative count calculation from timeline data
  const totalActivityCount = timelineData.reduce((acc, year) => acc + year.activityCount, 0);
  const totalEventCount = timelineData.reduce((acc, year) => acc + year.eventCount, 0);

  // Use timeline data counts if they're higher (likely more accurate)
  const finalActivitiesCount = Math.max(activitiesCount, totalActivityCount);
  const finalEventsCount = Math.max(eventsCount, totalEventCount);

  const tabs: { label: string; value: ProfileViewType; count: number }[] = [
    { label: 'Activity', value: 'activity', count: finalActivitiesCount },
    { label: 'Events', value: 'events', count: finalEventsCount },
    { label: 'Reports', value: 'reports', count: reportsCount },
  ];

  const handleTabClick = (value: ProfileViewType) => {
    setViewType(value);
  };

  return (
    <div className='grid w-full grid-cols-3 border-b border-slate-200' role='tablist'>
      {tabs.map((tab) => (
        <ProfileTab key={tab.value} label={tab.label} count={tab.count} isActive={viewType === tab.value} onClick={() => handleTabClick(tab.value)} />
      ))}
    </div>
  );
}
