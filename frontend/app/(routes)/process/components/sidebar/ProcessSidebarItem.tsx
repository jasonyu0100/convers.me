import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Process } from '../../../../types/process';
import { useProcess } from '../../hooks';

interface ProcessSidebarItemProps {
  list: Process;
  isSelected: boolean;
}

export function ProcessSidebarItem({ list, isSelected }: ProcessSidebarItemProps) {
  const { handleProcessesSelect: handleProcessSelect } = useProcess();

  // Handle the case where steps might be undefined
  const totalSteps = list.steps?.length || 0;

  // Calculate completion percentage
  const calculateCompletion = () => {
    if (!list.steps || list.steps.length === 0) return 0;

    let totalItems = list.steps.length;
    let completedItems = list.steps.filter((step) => step.completed).length;

    // Count substeps
    list.steps.forEach((step) => {
      if (step.subSteps && step.subSteps.length > 0) {
        totalItems += step.subSteps.length;
        completedItems += step.subSteps.filter((subStep) => subStep.completed).length;
      }
    });

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const completion = calculateCompletion();

  return (
    <button
      className={`group w-full rounded-xl px-3 py-2.5 text-left transition-all ${
        isSelected
          ? 'border border-blue-200 bg-blue-50 text-blue-700 shadow-sm'
          : 'border border-transparent text-slate-700 hover:border-slate-200/80 hover:bg-white/80 hover:shadow-sm'
      }`}
      onClick={() => handleProcessSelect(list.id)}
    >
      <div className='mb-1.5 flex items-center'>
        <div className={`mr-2.5 h-3 w-3 flex-shrink-0 rounded-full ${list.color || 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}></div>
        <div className='min-w-0 flex-1'>
          <h3 className='truncate text-sm font-medium'>{list.title}</h3>
        </div>
      </div>

      {totalSteps > 0 && (
        <>
          <div className='mb-1.5 flex items-center gap-2 pl-1.5'>
            <div className='flex items-center text-xs text-slate-500'>
              <DocumentTextIcon className='mr-1 h-3 w-3' />
              {totalSteps} {totalSteps === 1 ? 'step' : 'steps'}
            </div>

            {completion > 0 && <div className={`h-1.5 w-1.5 rounded-full ${completion === 100 ? 'bg-green-500' : 'bg-amber-400'}`}></div>}
          </div>

          <div className='h-1 w-full overflow-hidden rounded-full bg-slate-100'>
            <div className='h-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all' style={{ width: `${completion}%` }}></div>
          </div>
        </>
      )}
    </button>
  );
}
