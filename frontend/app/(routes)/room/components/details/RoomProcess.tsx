'use client';

import { ProcessProgress, ProcessStep } from '@/app/components/ui/process';
import { EventListStep } from '@/app/types/room';
import { useRoom } from '../../hooks';
import { RoomCard } from './RoomCard';

interface RoomProcessProps {
  onStartConversation?: () => void;
}

export function RoomProcess({ onStartConversation }: RoomProcessProps) {
  const { eventList, eventDetails, handleEventListUpdate, handleViewTemplate, handleStatusChange } = useRoom();

  // If eventList is undefined, render a placeholder
  if (!eventList) {
    return (
      <div className='w-full rounded-md border border-gray-200 bg-white/80 p-4 text-center'>
        <p className='text-gray-500'>Process details not available</p>
      </div>
    );
  }

  const handleStepChange = (stepId: string, completed: boolean) => {
    const currentTime = new Date().toISOString();

    const updatedSteps = eventList.steps.map((step) => {
      if (step.id === stepId) {
        // If completing a step, also complete all substeps
        const updatedSubSteps = step.subSteps?.map((subStep) => ({
          ...subStep,
          completed: completed ? true : subStep.completed,
          completedAt: completed ? currentTime : subStep.completed ? subStep.completedAt : undefined,
        }));

        return {
          ...step,
          completed,
          completedAt: completed ? currentTime : undefined, // Set timestamp when completed, clear it when uncompleted
          subSteps: updatedSubSteps,
        };
      }
      return step;
    });

    const updatedList = {
      ...eventList,
      steps: updatedSteps,
    };

    // Update all the changes in the backend
    handleEventListUpdate(updatedList);
  };

  const handleSubStepChange = (stepId: string, subStepId: string, completed: boolean) => {
    const currentTime = new Date().toISOString();

    const updatedSteps = eventList.steps.map((step) => {
      if (step.id === stepId) {
        // Update the specific substep
        const updatedSubSteps = step.subSteps?.map((subStep) => {
          if (subStep.id === subStepId) {
            return {
              ...subStep,
              completed,
              completedAt: completed ? currentTime : undefined, // Set timestamp when completed, clear it when uncompleted
            };
          }
          return subStep;
        });

        // Check if all substeps are completed to determine parent step status
        const allSubStepsCompleted = updatedSubSteps?.every((subStep) => subStep.completed) ?? false;

        return {
          ...step,
          completed: updatedSubSteps && updatedSubSteps.length > 0 ? allSubStepsCompleted : step.completed,
          // Only set completedAt if all substeps are completed and the step status is changing to completed
          completedAt:
            updatedSubSteps && updatedSubSteps.length > 0 && allSubStepsCompleted && !step.completed
              ? currentTime
              : updatedSubSteps && updatedSubSteps.length > 0 && !allSubStepsCompleted
              ? undefined
              : step.completedAt,
          subSteps: updatedSubSteps,
        };
      }
      return step;
    });

    const updatedList = {
      ...eventList,
      steps: updatedSteps,
    };

    handleEventListUpdate(updatedList);
  };

  // Convert EventListStep to ProcessStep for the ProcessProgress component
  const convertToProcessSteps = (steps: EventListStep[]): ProcessStep[] => {
    return steps.map((step) => {
      // Convert step with proper type handling

      // Define the convertible step
      const convertedStep: ProcessStep = {
        id: step.id,
        content: step.content,
        completed: step.completed,
      };

      // Make sure subSteps are properly handled
      if (step.subSteps && Array.isArray(step.subSteps) && step.subSteps.length > 0) {
        convertedStep.subSteps = step.subSteps.map((subStep) => ({
          id: subStep.id,
          content: subStep.content,
          completed: subStep.completed,
        }));
      }

      return convertedStep;
    });
  };

  return (
    <div className='w-full space-y-6'>
      <RoomCard onStartConversation={onStartConversation} />
      <ProcessProgress
        title={eventList.title}
        description={eventList.description}
        steps={convertToProcessSteps(eventList.steps)}
        onStepChange={handleStepChange}
        onSubStepChange={handleSubStepChange}
        templateId={eventList.process?.templateId}
        isTemplate={eventList.process?.isTemplate || false}
        onViewTemplate={eventList.process?.templateId ? handleViewTemplate : undefined}
        status={eventDetails.status}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
