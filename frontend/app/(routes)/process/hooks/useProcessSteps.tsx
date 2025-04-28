'use client';

import { QueryKeys, useApiMutation } from '@/app/lib/reactQuery';
import { ProcessService } from '@/app/services';
import { CreateProcessStepData, UpdateProcessStepData } from '@/app/services/processService';
import { ProcessSchema, StepSchema } from '@/app/types/schema';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

/**
 * Hook for managing steps functionality extracted from useProcess
 */
export function useProcessSteps(handleError: (error: any) => void) {
  const queryClient = useQueryClient();
  const [expandedStepIds, setExpandedStepIds] = useState(new Set<string>());

  // Complete step mutation
  const completeStepMutation = useApiMutation(
    async ({ processId, stepId, completed }: { processId: string; stepId: string; completed: boolean }) => {
      // Find the step
      // Need to get current processes from the cache or props
      const processes = queryClient.getQueryData<ProcessSchema[]>(QueryKeys.process.all) || [];
      const process = processes.find((p) => p.id === processId);
      const step = process?.steps?.find((s) => s.id === stepId);

      if (!process || !step) {
        throw new Error('Process or step not found');
      }

      // Update step in backend
      const updateData: UpdateProcessStepData = {
        completed,
      };

      const result = await ProcessService.updateStep(stepId, updateData);

      // Also update substeps in backend
      if (result.data && step.subSteps?.length) {
        const subStepUpdates = step.subSteps.map(async (subStep) => {
          return ProcessService.updateSubStep(subStep.id, { completed });
        });

        await Promise.all(subStepUpdates);
      }

      return result;
    },
    {
      onSuccess: (_, { processId, stepId, completed }) => {
        // Update process in cache
        queryClient.setQueryData(QueryKeys.process.all, (old: ProcessSchema[] = []) =>
          old.map((p) => {
            if (p.id !== processId) return p;

            return {
              ...p,
              steps: p.steps?.map((s) => {
                if (s.id !== stepId) return s;

                // Also update substeps to match parent completion status
                const updatedSubSteps = s.subSteps?.map((ss) => ({
                  ...ss,
                  completed,
                }));

                return {
                  ...s,
                  completed,
                  subSteps: updatedSubSteps,
                };
              }),
            };
          }),
        );
      },
      onError: handleError,
    },
  );

  const handleCompleteStep = useCallback(
    async (processId: string, stepId: string, completed: boolean) => {
      await completeStepMutation.mutateAsync({ processId, stepId, completed });
    },
    [completeStepMutation],
  );

  const handleToggleStepExpanded = useCallback(
    (stepId: string) => {
      try {
        setExpandedStepIds((prev) => {
          const newSet = new Set(prev);
          if (newSet.has(stepId)) {
            newSet.delete(stepId);
          } else {
            newSet.add(stepId);
          }
          return newSet;
        });
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  const isStepExpanded = useCallback(
    (stepId: string) => {
      return expandedStepIds.has(stepId);
    },
    [expandedStepIds],
  );

  // Add step mutation
  const addStepMutation = useApiMutation(
    async (processId: string) => {
      // Create step data
      const stepData: CreateProcessStepData = {
        content: 'New step',
        completed: false,
        order: 0, // Will be adjusted by the backend
        processId: processId,
      };

      // Create step in backend
      return ProcessService.createStep(processId, stepData);
    },
    {
      onSuccess: (result, processId) => {
        const newStep = result;
        if (!newStep) return;

        // Update process in cache
        queryClient.setQueryData(QueryKeys.process.all, (old: ProcessSchema[] = []) =>
          old.map((p) => {
            if (p.id !== processId) return p;

            // Add step to process
            const currentSteps = p.steps || [];
            return {
              ...p,
              steps: [...currentSteps, newStep],
            };
          }),
        );

        // Expand the new step
        setExpandedStepIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(newStep.id);
          return newSet;
        });
      },
      onError: handleError,
    },
  );

  const handleAddStep = useCallback(
    async (processId: string) => {
      await addStepMutation.mutateAsync(processId);
    },
    [addStepMutation],
  );

  // Edit step mutation
  const editStepMutation = useApiMutation(
    async ({ processId, stepId, content }: { processId: string; stepId: string; content: string }) => {
      // Update step in backend
      const updateData: UpdateProcessStepData = {
        content,
      };

      return ProcessService.updateStep(stepId, updateData);
    },
    {
      onSuccess: (_, { processId, stepId, content }) => {
        // Update process in cache
        queryClient.setQueryData(QueryKeys.process.all, (old: ProcessSchema[] = []) =>
          old.map((p) => {
            if (p.id !== processId) return p;

            return {
              ...p,
              steps: p.steps?.map((s) => (s.id === stepId ? { ...s, content } : s)),
            };
          }),
        );
      },
      onError: handleError,
    },
  );

  const handleEditStep = useCallback(
    async (processId: string, stepId: string, content: string) => {
      await editStepMutation.mutateAsync({ processId, stepId, content });
    },
    [editStepMutation],
  );

  // Delete step mutation
  const deleteStepMutation = useApiMutation(
    async ({ processId, stepId }: { processId: string; stepId: string }) => {
      // Delete step from backend
      return ProcessService.deleteStep(stepId);
    },
    {
      onSuccess: (_, { processId, stepId }) => {
        // Update process in cache
        queryClient.setQueryData(QueryKeys.process.all, (old: ProcessSchema[] = []) =>
          old.map((p) => {
            if (p.id !== processId) return p;

            return {
              ...p,
              steps: p.steps?.filter((s) => s.id !== stepId),
            };
          }),
        );
      },
      onError: handleError,
    },
  );

  const handleDeleteStep = useCallback(
    async (processId: string, stepId: string) => {
      await deleteStepMutation.mutateAsync({ processId, stepId });
    },
    [deleteStepMutation],
  );

  // Initialize step expansion state based on whether steps have substeps
  const initializeExpandedSteps = useCallback((processes: ProcessSchema[]) => {
    setExpandedStepIds((prev) => {
      const initialExpanded = new Set<string>(prev);

      processes.forEach((process) => {
        if (process.steps) {
          process.steps.forEach((step) => {
            if (step.subSteps && step.subSteps.length > 0) {
              initialExpanded.add(step.id);
            }
          });
        }
      });

      return initialExpanded;
    });
  }, []);

  return {
    expandedStepIds,
    handleCompleteStep,
    handleToggleStepExpanded,
    isStepExpanded,
    handleAddStep,
    handleEditStep,
    handleDeleteStep,
    initializeExpandedSteps,
  };
}
