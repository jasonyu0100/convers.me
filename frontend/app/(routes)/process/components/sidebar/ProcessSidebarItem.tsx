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
  const processColor = list.color || 'from-blue-500 to-indigo-500';
  const isTemplate = list.isTemplate === true;

  return (
    <button
      className={`relative flex w-full flex-col rounded-lg border text-left ${
        isSelected ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:border-blue-200 hover:shadow-sm'
      } overflow-hidden transition-all`}
      onClick={() => handleProcessSelect(list.id)}
    >
      {/* Top colored bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${processColor}`}></div>

      <div className='p-3'>
        {/* Process header */}
        <div className='flex items-center justify-between'>
          <h3 className={`text-sm font-medium ${isSelected ? 'text-blue-700' : 'text-slate-700'} truncate`}>{list.title}</h3>
          {isTemplate && <span className='ml-1 rounded-full bg-blue-100 px-1.5 py-0.5 text-xs text-blue-600'>Template</span>}
        </div>

        {/* Process description if available */}
        {list.description && (
          <p className='mt-1 line-clamp-1 text-xs text-slate-500' title={list.description}>
            {list.description}
          </p>
        )}

        {/* Process steps and progress */}
        {totalSteps > 0 && (
          <div className='mt-2'>
            <div className='flex items-center justify-between text-xs'>
              <div className='flex items-center text-slate-500'>
                <DocumentTextIcon className='mr-1 h-3 w-3' />
                <span>
                  {totalSteps} {totalSteps === 1 ? 'step' : 'steps'}
                </span>
              </div>
              <span className={`font-medium ${completion === 100 ? 'text-green-600' : 'text-blue-600'}`}>{completion}%</span>
            </div>

            <div className='mt-1.5 h-1 w-full overflow-hidden rounded-full bg-slate-100'>
              <div
                className={`h-1 rounded-full ${completion === 100 ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'} transition-all`}
                style={{ width: `${completion}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
