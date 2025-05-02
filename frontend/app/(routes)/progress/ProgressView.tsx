import { AppHeader } from '@/app/components/app/AppHeader';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { ProgressTabType } from '../../types/progress';
import { EffortTab } from './components/tabs/EffortTab';
import { GoalsTab } from './components/tabs/GoalsTab';
import { ProgressTab } from './components/tabs/ProgressTab';
import { TimeTab } from './components/tabs/TimeTab';
import { useProgress } from './hooks/useProgress';
import { useProgressHeader } from './hooks/useProgressHeader';

/**
 * Tab buttons component
 */
function TabSelector() {
  const { selectedTab, setSelectedTab } = useProgress();

  const tabs: { id: ProgressTabType; label: string }[] = [
    { id: 'goals', label: 'Goals' },
    { id: 'progress', label: 'Progress' },
    { id: 'effort', label: 'Effort' },
    { id: 'time', label: 'Time' },
  ];

  return (
    <div className='border-t border-gray-200 bg-white/80 py-2'>
      <div className='px-6'>
        <nav className='flex justify-center space-x-10' aria-label='Tabs'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`border-t-2 px-4 py-4 font-medium text-base ${
                selectedTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

/**
 * Progress body component to display the selected tab
 */
function ProgressBody() {
  const { selectedTab, isLoading, error, clearError } = useProgress();

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorDisplay error={error} title='Progress Error' onRetry={clearError} />;
  }

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'progress':
        return <ProgressTab />;
      case 'time':
        return <TimeTab />;
      case 'effort':
        return <EffortTab />;
      case 'goals':
        return <GoalsTab />;
      default:
        return <ProgressTab />;
    }
  };

  return (
    <div className='flex w-full flex-1 flex-col overflow-auto p-6 pb-2'>
      <div className='flex-1'>{renderTabContent()}</div>
    </div>
  );
}

/**
 * Main content for the progress view
 */
export function ProgressView() {
  const headerProps = useProgressHeader();
  const { isLoading, error } = useProgress();

  return (
    <>
      <AppHeader
        title={headerProps.title}
        searchPlaceholder={headerProps.searchPlaceholder}
        searchValue={headerProps.searchValue}
        onSearchChange={headerProps.onSearchChange}
        onSearchSubmit={headerProps.onSearchSubmit}
      />
      <div className='flex flex-1 flex-col overflow-auto'>
        <ProgressBody />
        {!isLoading && !error && <TabSelector />}
      </div>
    </>
  );
}
