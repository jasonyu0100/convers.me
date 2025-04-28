import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { ArrowLeftIcon, CalendarDaysIcon, DocumentDuplicateIcon, FolderIcon, PencilIcon, PlusIcon, StarIcon, TrashIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useRouter } from 'next/navigation';
import { useProcess } from '../hooks';
import { ConnectedEventsList } from './connected-events';
import { DirectoryMapView } from './DirectoryMapView';
import { ProcessListView } from './list-view';
import { ProcessEditor } from './process-editor';

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

  // Get process IDs from the selected directory
  const filteredProcessIds = selectedDirectory && Array.isArray(selectedDirectory.processes) ? selectedDirectory.processes : [];

  // The processes are already filtered in the context, but we keep the variable
  // name for clarity in the code
  const directoryProcesses = processes;

  // If no process is selected and not creating a new list, show the directory/process map view
  if (!selectedList && !isCreatingNewList) {
    return <DirectoryMapView />;
  }

  // If we're creating a new template or have a selected process,
  // show the process detail view with template editor or process content

  return (
    <div className='flex h-full w-full flex-col overflow-hidden'>
      {/* Header */}
      <div className='sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-8 py-4 backdrop-blur-sm'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <button
              onClick={() => {
                // Clear process selection but keep directory selection
                handleProcessesSelect('');
              }}
              className='mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200'
              title='Back to Directory'
            >
              <ArrowLeftIcon className='h-4 w-4' />
            </button>

            {selectedDirectory && (
              <div className='flex items-center'>
                <div
                  className={`mr-2 flex h-6 w-6 items-center justify-center rounded-full ${
                    selectedDirectory.color || 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}
                >
                  <FolderIcon className='h-3 w-3 text-white' />
                </div>
                <span className='mr-2 text-sm font-medium text-slate-600'>{selectedDirectory.name} /</span>
                <span className='text-sm font-medium text-slate-900'>{isCreatingNewList ? 'New Process Template' : selectedList?.title}</span>
                {!isCreatingNewList && selectedList?.isTemplate && (
                  <span className='ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800'>Template</span>
                )}
              </div>
            )}
          </div>

          {selectedList && !isCreatingNewList && (
            <div className='flex space-x-2'>
              <button
                onClick={() => handleDuplicateList(selectedList.id)}
                className='rounded-full p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                title='Duplicate'
              >
                <DocumentDuplicateIcon className='h-4.5 w-4.5' />
              </button>
              <button onClick={() => handleCreateNewList()} className='rounded-full p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-600' title='Edit'>
                <PencilIcon className='h-4.5 w-4.5' />
              </button>
              <button
                onClick={() => handleDeleteList(selectedList.id)}
                className='rounded-full p-2 text-slate-500 hover:bg-red-50 hover:text-red-600'
                title='Delete'
              >
                <TrashIcon className='h-4.5 w-4.5' />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 overflow-auto p-8'>
        {isCreatingNewList ? (
          <ProcessEditor />
        ) : selectedList ? (
          <div>
            {/* Title and button */}
            <div className='mb-6 flex items-center justify-between'>
              <div className='flex items-center'>
                <h1 className='mr-3 text-2xl font-bold text-gray-800'>{selectedList?.title || 'Process'}</h1>
                <button onClick={() => toggleFavorite(selectedList?.id || '')} className='text-slate-400 hover:text-yellow-500'>
                  {selectedList?.favorite ? <StarIconSolid className='h-5 w-5 text-yellow-500' /> : <StarIcon className='h-5 w-5' />}
                </button>
              </div>
              <button
                onClick={() => {
                  router.push(`/schedule?processId=${selectedList?.id || ''}`);
                  app.setMainView(AppRoute.SCHEDULE);
                }}
                className='flex items-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-white'
              >
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
                <button
                  className='flex items-center rounded-full border border-blue-200 px-4 py-1.5 text-sm font-medium text-blue-600'
                  onClick={() => handleAddStep(selectedList?.id || '')}
                >
                  <PlusIcon className='mr-1.5 h-4 w-4' />
                  Add Step
                </button>
              </div>

              <div className='rounded-xl border border-slate-200/70 bg-white/80 shadow-sm'>
                <ProcessListView />
              </div>
            </div>

            {/* Related Events */}
            {selectedList?.connectedEvents && selectedList.connectedEvents.length > 0 && <ConnectedEventsList events={selectedList.connectedEvents} />}
          </div>
        ) : null}
      </div>
    </div>
  );
}
