import { AppHeader } from '@/app/components/app/AppHeader';
import { ErrorDisplay } from '@/app/components/ui/errors';
import { PageLoading } from '@/app/components/ui/loading';
import { PerformanceTabType } from '../../types/insight';
import { EffortTab } from './components/tabs/EffortTab';
import { HelpTab } from './components/tabs/HelpTab';
import { KPITab } from './components/tabs/KPITab';
import { TimeTab } from './components/tabs/TimeTab';
import { WorkTab } from './components/tabs/WorkTab';
import { useInsight } from './hooks/useInsight';
import { useInsightHeader } from './hooks/useInsightHeader';

/**
 * Tab buttons component
 */
function TabSelector() {
  const { selectedTab, setSelectedTab } = useInsight();

  const tabs: { id: PerformanceTabType; label: string }[] = [
    { id: 'kpi', label: 'KPI' },
    { id: 'work', label: 'Work' },
    { id: 'time', label: 'Time' },
    { id: 'effort', label: 'Effort' },
    { id: 'help', label: 'Help' },
  ];

  return (
    <div className='border-t border-gray-200 bg-white/80 py-2'>
      <div className='px-6'>
        <nav className='flex justify-center space-x-10' aria-label='Tabs'>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`border-t-2 px-4 py-4 text-base font-medium ${
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
 * Time frame selector component
 */
function TimeFrameSelector() {
  const { selectedTimeFrame, setSelectedTimeFrame, selectedTab } = useInsight();

  // Don't show time frame selector on help tab
  if (selectedTab === 'help') return null;

  return (
    <div className='flex space-x-3'>
      <button
        className={`rounded-full px-6 py-2 text-base font-medium transition-colors ${
          selectedTimeFrame === 'week' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        onClick={() => setSelectedTimeFrame('week')}
      >
        Weekly
      </button>
      <button
        className={`rounded-full px-6 py-2 text-base font-medium transition-colors ${
          selectedTimeFrame === 'quarter' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
        onClick={() => setSelectedTimeFrame('quarter')}
      >
        Quarterly
      </button>
    </div>
  );
}

/**
 * Performance body component to display the selected tab
 */
function InsightBody() {
  const { selectedTab, isLoading, error, clearError } = useInsight();

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorDisplay error={error} title='Insight Error' onRetry={clearError} />;
  }

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'kpi':
        return <KPITab />;
      case 'work':
        return <WorkTab />;
      case 'time':
        return <TimeTab />;
      case 'effort':
        return <EffortTab />;
      case 'help':
        return <HelpTab />;
      default:
        return <KPITab />;
    }
  };

  return (
    <div className='flex w-full flex-1 flex-col overflow-auto p-6 pb-2'>
      <div className='mb-6 flex items-center justify-center'>
        {selectedTab !== 'help' && <TimeFrameSelector />}
        {selectedTab === 'help' && <h2 className='text-xl font-bold text-gray-800'>Performance Help</h2>}
      </div>
      <div className='flex-1'>{renderTabContent()}</div>
    </div>
  );
}

/**
 * Main content for the insight view
 */
export function InsightView() {
  const headerProps = useInsightHeader();
  const { isLoading, error } = useInsight();

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
        <InsightBody />
        {!isLoading && !error && <TabSelector />}
      </div>
    </>
  );
}
