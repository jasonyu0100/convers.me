import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { CalendarDaysIcon, PlusIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { useProcess } from '../hooks';
import { ConnectedEventsList } from './connected-events';
import { ProcessHeader } from './common/ProcessHeader';
import { ProcessGridView } from './grid-view';
import { ProcessListView } from './list-view';
import { ProcessEditor } from './process-editor';

/**
 * ProcessDetail component for displaying process details
 */
function ProcessDetail({ selectedList, onToggleFavorite, onCreateEvent, onAddStep }) {
  return (
    <>
      {/* Title and button */}
      <div className='mb-6 flex items-center justify-between'>
        <div className='flex items-center'>
          <h1 className='mr-3 text-2xl font-bold text-gray-800'>{selectedList?.title || 'Process'}</h1>
          <button onClick={onToggleFavorite} className='text-slate-400 hover:text-yellow-500'>
            {selectedList?.favorite ? <StarIconSolid className='h-5 w-5 text-yellow-500' /> : <StarIcon className='h-5 w-5' />}
          </button>
        </div>
        <button onClick={onCreateEvent} className='flex items-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-white'>
          <CalendarDaysIcon className='mr-2 h-4 w-4' />
          <span>Create Event from Template</span>
        </button>
      </div>

      {/* Description */}
      <div className='mb-8 rounded-xl border border-slate-200/70 bg-white/80 p-6 shadow-sm'>
        <p className='text-slate-700'>{selectedList?.description || 'No description provided for this process template.'}</p>
      </div>

      {/* Steps */}
      <div className='mb-8'>
        <div className='mb-4 flex items-center justify-between'>
          <div className='flex items-center text-lg font-semibold text-gray-800'>
            <span className='mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-600'>
              {selectedList?.steps?.length || 0}
            </span>
            Process Steps
          </div>
          <button className='flex items-center rounded-full border border-blue-200 px-4 py-1.5 text-sm font-medium text-blue-600' onClick={onAddStep}>
            <PlusIcon className='mr-1.5 h-4 w-4' />
            Add Step
          </button>
        </div>

        <div className='rounded-xl border border-slate-200/70 bg-white/80 shadow-sm'>
          <ProcessListView />
        </div>
      </div>
    </>
  );
}

/**
 * Main content component for the Process section
 * Handles rendering the appropriate view based on selection state
 */
export function ProcessContent() {
  const {
    processes,
    selectedList,
    selectedDirectoryId,
    setSelectedDirectoryId,
    isCreatingNewList,
    handleCreateNewList,
    handleDeleteList,
    handleAddStep,
    handleDuplicateList,
    handleProcessesSelect,
    allDirectories,
    toggleFavorite,
  } = useProcess();
  const router = useRouter();
  const app = useApp();

  // Get the selected directory
  const selectedDirectory = allDirectories?.find((dir) => dir.id === selectedDirectoryId);

  // Handle creating an event from template
  const handleCreateEvent = () => {
    router.push(`/schedule?processId=${selectedList?.id || ''}`);
    app.setMainView(AppRoute.SCHEDULE);
  };

  // If no process is selected and not creating a new list, show the directory/process grid view
  if (!selectedList && !isCreatingNewList) {
    return (
      <ProcessGridView
        directories={allDirectories}
        processes={processes}
        onSelectDirectory={setSelectedDirectoryId}
        onSelectProcess={handleProcessesSelect}
        onCreateProcess={handleCreateNewList}
        selectedDirectoryId={selectedDirectoryId}
        onBackFromDirectory={() => {
          /* Handle back navigation from directory view if needed */
          router.back();
        }}
      />
    );
  }

  // Get the directory color if available
  const dirColor = selectedDirectory?.color || 'from-blue-500 to-indigo-500';

  // If creating a new process or editing existing process
  return (
    <div className='flex h-full w-full flex-col overflow-hidden'>
      {/* Header */}
      <ProcessHeader
        directoryName={selectedDirectory?.name}
        processName={isCreatingNewList ? 'New Process Template' : selectedList?.title}
        isDetailView={true}
        onDuplicate={() => selectedList && handleDuplicateList(selectedList.id)}
        onEdit={handleCreateNewList}
        onDelete={() => selectedList && handleDeleteList(selectedList.id)}
        color={dirColor}
      />

      {/* Content */}
      <div className='flex-1 overflow-auto p-8'>
        {isCreatingNewList ? (
          <ProcessEditor />
        ) : selectedList ? (
          <div>
            <ProcessDetail
              selectedList={selectedList}
              onToggleFavorite={() => selectedList && toggleFavorite(selectedList.id)}
              onCreateEvent={handleCreateEvent}
              onAddStep={() => selectedList && handleAddStep(selectedList.id)}
            />

            {/* Related Events */}
            {selectedList?.connectedEvents && selectedList.connectedEvents.length > 0 && <ConnectedEventsList events={selectedList.connectedEvents} />}
          </div>
        ) : null}
      </div>
    </div>
  );
}
