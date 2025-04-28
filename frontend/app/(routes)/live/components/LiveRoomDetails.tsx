'use client';

import { ProcessProgress, ProcessStep } from '@/app/components/ui/process';
import { useCallback, useEffect, useState } from 'react';
import { RoomListStep, EventStatus } from '@/app/types/room';
import { useRouter, useSearchParams } from 'next/navigation';
import { EventService } from '@/app/services/eventService';
import { PostService } from '@/app/services/postService';
import { useLive } from '../hooks';
import { StatusSelect } from '../../room/components/ui/StatusSelect';

export function LiveRoomDetails() {
  const searchParams = useSearchParams();
  const { isLoading, setIsLoading, error, clearError, eventId, templateId, handleViewTemplate } = useLive();
  const [currentRoomList, setCurrentRoomList] = useState({
    id: '',
    title: 'Loading...',
    description: 'Loading event details',
    status: 'Pending' as EventStatus,
    isTemplate: false,
    templateId: undefined,
    steps: [],
  });

  // Load event data based on the ID from the URL
  useEffect(() => {
    // Skip loading if no event ID available
    const id = searchParams?.get('id') || eventId;
    if (!id) {
      console.log('No event ID in URL, waiting for context');
      return;
    }

    let isMounted = true;
    const loadEventData = async () => {
      try {
        // Don't set global loading state to avoid flicker
        // Local loading state would be better but we're fixing minimal

        console.log(`Loading event with ID: ${id}`);

        // Load event data and steps in parallel to reduce loading time
        const [eventResult, stepsResult] = await Promise.all([EventService.getEventById(id), EventService.getEventSteps(id)]);

        // Check if component is still mounted before state updates
        if (!isMounted) return;

        // Check if both API calls were successful
        if (eventResult.data) {
          const steps = stepsResult.data || [];

          const eventListData = {
            id: id,
            title: eventResult.data.title,
            description: eventResult.data.description || '',
            status: eventResult.data?.status || ('Pending' as EventStatus),
            isTemplate: false,
            templateId: eventResult.data.processId || templateId || undefined,
            steps:
              steps.map((step) => ({
                id: step.id,
                content: step.content,
                completed: step.completed,
                subSteps:
                  step.subSteps?.map((subStep) => ({
                    id: subStep.id,
                    content: subStep.content,
                    completed: subStep.completed,
                  })) || [],
              })) || [],
          };

          setCurrentRoomList(eventListData);
          console.log('Loaded event data:', eventListData.title, 'Status:', eventListData.status, 'Steps:', eventListData.steps.length);
        } else {
          console.error('Error loading event details:', eventResult.error);
        }
      } catch (err) {
        console.error('Error in loadEventData:', err);
      }
    };

    loadEventData();

    // Cleanup function to prevent state updates if unmounted
    return () => {
      isMounted = false;
    };
  }, [eventId, templateId]);

  const handleStatusChange = useCallback(
    async (status: EventStatus) => {
      try {
        console.log(`Status changed to: ${status}`);

        // Get previous status before updating
        const previousStatus = currentRoomList.status;

        if (previousStatus === status) {
          console.log('Status unchanged, no update needed');
          return; // No need to update if the status is the same
        }

        // Optimistically update the UI first for better UX
        setCurrentRoomList((prev) => ({
          ...prev,
          status,
        }));

        // If we have an event ID, try to update the status on the server
        if (currentRoomList.id) {
          // Run status update first, then create post only if update succeeds
          try {
            // Try to update the status directly
            const updateResult = await EventService.updateEvent(currentRoomList.id, {
              status,
            });

            if (updateResult.error) {
              console.warn('Direct status update failed:', updateResult.error);
              throw new Error(updateResult.error);
            }

            console.log('Status updated successfully on the server');

            // Only create a post if the status update succeeds
            try {
              const postResult = await PostService.createPost({
                content: `Status updated: ${previousStatus} → ${status}`,
                event_id: currentRoomList.id,
              });

              if (postResult.error) {
                console.warn('Failed to create status update post:', postResult.error);
              } else {
                console.log('Feed post created for status change');
              }
            } catch (postError) {
              console.error('Error creating feed post:', postError);
              // Post creation failure shouldn't fail the whole operation
            }
          } catch (error) {
            console.error('Error updating event status:', error);
          }
        }
      } catch (error) {
        console.error('Error handling status change:', error);
        // Revert the optimistic update in case of catastrophic error
        setCurrentRoomList((prev) => ({
          ...prev,
          status: previousStatus,
        }));
      }
    },
    [currentRoomList.id, currentRoomList.status],
  );

  const handleStepChange = async (stepId: string, completed: boolean) => {
    try {
      const currentTime = new Date().toISOString();

      const updatedSteps = currentRoomList.steps.map((step) => {
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
        ...currentRoomList,
        steps: updatedSteps,
      };

      setCurrentRoomList(updatedList);

      // Update step in API
      if (currentRoomList.id) {
        // Update the step
        await EventService.updateStep(currentRoomList.id, stepId, {
          completed,
        });

        // If completing a step, update all substeps too
        if (completed) {
          const step = updatedList.steps.find((s) => s.id === stepId);
          if (step?.subSteps && step.subSteps.length > 0) {
            const updates = step.subSteps.map((subStep) => ({
              id: subStep.id,
              stepId: stepId,
              completed: true,
            }));

            // Batch update all substeps
            await EventService.batchUpdateSubSteps(currentRoomList.id, updates);
          }
        }
      }
    } catch (error) {
      console.error('Error updating step:', error);
    }
  };

  const handleSubStepChange = async (stepId: string, subStepId: string, completed: boolean) => {
    try {
      const currentTime = new Date().toISOString();

      const updatedSteps = currentRoomList.steps.map((step) => {
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
        ...currentRoomList,
        steps: updatedSteps,
      };

      setCurrentRoomList(updatedList);

      // Update substep in API
      if (currentRoomList.id) {
        // First update the substep
        const stepIndex = updatedList.steps.findIndex((s) => s.id === stepId);
        if (stepIndex !== -1) {
          const step = updatedList.steps[stepIndex];
          const allSubStepsCompleted = step.subSteps?.every((s) => s.completed) ?? false;

          // Batch update the substep with completed_at timestamp
          const updates = [
            {
              id: subStepId,
              stepId: stepId,
              completed,
            },
          ];

          // Update the parent step in the batch if needed
          if (step.subSteps && step.subSteps.length > 0 && step.completed !== allSubStepsCompleted) {
            // Update the step separately since it's a different endpoint
            await EventService.updateStep(currentRoomList.id, stepId, {
              completed: allSubStepsCompleted,
            });
          }

          // Send the substep update
          await EventService.batchUpdateSubSteps(currentRoomList.id, updates);
        }
      }
    } catch (error) {
      console.error('Error updating substep:', error);
    }
  };

  // Convert RoomListStep to ProcessStep for the ProcessProgress component
  const convertToProcessSteps = (steps: RoomListStep[]): ProcessStep[] => {
    return steps.map((step) => ({
      id: step.id,
      content: step.content,
      completed: step.completed,
      subSteps: step.subSteps?.map((subStep) => ({
        id: subStep.id,
        content: subStep.content,
        completed: subStep.completed,
      })),
    }));
  };

  return (
    <div className='flex h-full w-[350px] flex-shrink-0 flex-col overflow-y-auto border-l border-slate-200 bg-white/80 p-6'>
      <ProcessProgress
        title={currentRoomList.title}
        description={currentRoomList.description}
        steps={convertToProcessSteps(currentRoomList.steps)}
        onStepChange={handleStepChange}
        onSubStepChange={handleSubStepChange}
        templateId={currentRoomList.templateId}
        isTemplate={currentRoomList.isTemplate || false}
        status={currentRoomList.status}
        onStatusChange={handleStatusChange}
        onViewTemplate={currentRoomList.templateId ? handleViewTemplate : undefined}
      />
    </div>
  );
}
