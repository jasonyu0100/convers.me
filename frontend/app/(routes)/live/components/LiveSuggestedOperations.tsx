'use client';

import { LiveOperation } from '@/app/types/live';
import { CheckCircleIcon, PlusCircleIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface LiveSuggestedOperationsProps {
  operations: LiveOperation[];
  onExecuteOperation?: (operation: LiveOperation) => void;
}

export function LiveSuggestedOperations({ operations, onExecuteOperation }: LiveSuggestedOperationsProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (!operations || operations.length === 0) {
    return null;
  }

  const getOperationIcon = (operation: LiveOperation) => {
    switch (operation.operation) {
      case 'complete_step':
        return <CheckCircleIcon className='h-5 w-5 text-green-500' />;
      case 'add_step':
      case 'add_substep':
        return <PlusCircleIcon className='h-5 w-5 text-blue-500' />;
      case 'update_step':
        return <PencilIcon className='h-5 w-5 text-amber-500' />;
      default:
        return null;
    }
  };

  const getOperationLabel = (operation: LiveOperation) => {
    switch (operation.operation) {
      case 'complete_step':
        return 'Mark step as complete';
      case 'add_step':
        return 'Add new step';
      case 'add_substep':
        return 'Add new subtask';
      case 'update_step':
        return 'Update step';
      default:
        return 'Execute operation';
    }
  };

  const getOperationBg = (operation: LiveOperation, isHovered: boolean) => {
    switch (operation.operation) {
      case 'complete_step':
        return isHovered ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200';
      case 'add_step':
      case 'add_substep':
        return isHovered ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200';
      case 'update_step':
        return isHovered ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200';
      default:
        return isHovered ? 'bg-slate-50 border-slate-300' : 'bg-white border-slate-200';
    }
  };

  // Group operations by priority
  const highPriorityOps = operations.filter((op) => op.priority === 'high');
  const mediumPriorityOps = operations.filter((op) => op.priority === 'medium');
  const lowPriorityOps = operations.filter((op) => op.priority === 'low' || !op.priority);

  return (
    <div className='mt-2 mb-4'>
      <h4 className='mb-2 text-sm font-medium text-slate-600'>Suggested Actions</h4>

      {highPriorityOps.length > 0 && (
        <div>
          <h5 className='mb-1.5 text-xs font-semibold text-amber-600 uppercase'>Priority Actions</h5>
          <div className='mb-3 space-y-2'>
            {highPriorityOps.map((operation) => {
              const isHovered = hoveredId === operation.stepId;
              const bgClass = getOperationBg(operation, isHovered);

              return (
                <div
                  key={`${operation.operation}-${operation.stepId || operation.subStepId}`}
                  className={`flex cursor-pointer items-center rounded-lg border p-2.5 transition-all ${bgClass}`}
                  onClick={() => onExecuteOperation?.(operation)}
                  onMouseEnter={() => setHoveredId(operation.stepId || '')}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className='mr-3 flex-shrink-0'>{getOperationIcon(operation)}</div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-slate-800'>{getOperationLabel(operation)}</p>
                    {operation.description && <p className='line-clamp-2 text-xs text-slate-500'>{operation.description}</p>}
                    {operation.rationale && <p className='mt-1 line-clamp-1 text-xs text-slate-400 italic'>{operation.rationale}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(mediumPriorityOps.length > 0 || lowPriorityOps.length > 0) && (
        <div>
          <h5 className='mb-1.5 text-xs font-semibold text-slate-500 uppercase'>Available Actions</h5>
          <div className='space-y-2'>
            {[...mediumPriorityOps, ...lowPriorityOps].map((operation) => {
              const isHovered = hoveredId === operation.stepId;
              const bgClass = getOperationBg(operation, isHovered);

              return (
                <div
                  key={`${operation.operation}-${operation.stepId || operation.subStepId}`}
                  className={`flex cursor-pointer items-center rounded-lg border p-2.5 transition-all ${bgClass}`}
                  onClick={() => onExecuteOperation?.(operation)}
                  onMouseEnter={() => setHoveredId(operation.stepId || '')}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className='mr-3 flex-shrink-0'>{getOperationIcon(operation)}</div>
                  <div className='flex-1'>
                    <p className='text-sm font-medium text-slate-800'>{getOperationLabel(operation)}</p>
                    {operation.description && <p className='line-clamp-2 text-xs text-slate-500'>{operation.description}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
