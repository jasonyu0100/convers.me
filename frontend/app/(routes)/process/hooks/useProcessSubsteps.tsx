'use client';

import { QueryKeys, useApiMutation } from '@/app/lib/reactQuery';
import { ProcessService } from '@/app/services';
import { CreateProcessSubStepData, UpdateProcessSubStepData } from '@/app/services/processService';
import { ProcessSchema, StepSchema } from '@/app/types/schema';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Hook for managing process substeps functionality
 * Handles substep operations like add, edit, delete, and completion tracking
 */
export function useProcessSubsteps(handleError: (error: any) => void) {
  const queryClient = useQueryClient();

  // Complete substep mutation
  const completeSubStepMutation = useApiMutation(
    async ({ processId, stepId, subStepId, completed }: { processId: string; stepId: string; subStepId: string; completed: boolean }) => {
      // Update substep in backend
      const updateData: UpdateProcessSubStepData = {
        completed,
      };

      return ProcessService.updateSubStep(subStepId, updateData);
    },
    {
      onSuccess: (_, { processId, stepId, subStepId, completed }) => {
        // Update process in cache
        queryClient.setQueryData(QueryKeys.process.all, (old: ProcessSchema[] = []) =>
          old.map((p) => {
            if (p.id !== processId) return p;

            return {
              ...p,
              steps: p.steps?.map((s) => {
                if (s.id !== stepId) return s;

                // Update the specific substep
                const updatedSubSteps = s.subSteps?.map((ss) => {
                  if (ss.id !== subStepId) return ss;
                  return { ...ss, completed };
                });

                // Check if all substeps are completed to determine parent step status
                const allSubStepsCompleted = updatedSubSteps?.every((ss) => ss.completed) ?? false;

                // If needed, update parent step status
                if (s.completed !== allSubStepsCompleted) {
                  ProcessService.updateStep(stepId, {
                    completed: allSubStepsCompleted,
                  }).catch((e) => handleError(e));
                }

                return {
                  ...s,
                  completed: updatedSubSteps && updatedSubSteps.length > 0 ? allSubStepsCompleted : s.completed,
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

  const handleCompleteSubStep = useCallback(
    async (processId: string, stepId: string, subStepId: string, completed: boolean) => {
      await completeSubStepMutation.mutateAsync({ processId, stepId, subStepId, completed });
    },
    [completeSubStepMutation],
  );

  // Edit substep mutation
  const editSubStepMutation = useApiMutation(
    async ({ processId, stepId, subStepId, content }: { processId: string; stepId: string; subStepId: string; content: string }) => {
      // Update substep in backend
      const updateData: UpdateProcessSubStepData = {
        content,
      };

      return ProcessService.updateSubStep(subStepId, updateData);
    },
    {
      onSuccess: (_, { processId, stepId, subStepId, content }) => {
        // Update process in cache
        queryClient.setQueryData(QueryKeys.process.all, (old: ProcessSchema[] = []) =>
          old.map((p) => {
            if (p.id !== processId) return p;

            return {
              ...p,
              steps: p.steps?.map((s) => {
                if (s.id !== stepId) return s;

                return {
                  ...s,
                  subSteps: s.subSteps?.map((ss) => (ss.id === subStepId ? { ...ss, content } : ss)),
                };
              }),
            };
          }),
        );
      },
      onError: handleError,
    },
  );

  const handleEditSubStep = useCallback(
    async (processId: string, stepId: string, subStepId: string, content: string) => {
      await editSubStepMutation.mutateAsync({ processId, stepId, subStepId, content });
    },
    [editSubStepMutation],
  );

  // Delete substep mutation
  const deleteSubStepMutation = useApiMutation(
    async ({ processId, stepId, subStepId }: { processId: string; stepId: string; subStepId: string }) => {
      // Delete substep from backend
      return ProcessService.deleteSubStep(subStepId);
    },
    {
      onSuccess: (_, { processId, stepId, subStepId }) => {
        // Update process in cache
        queryClient.setQueryData(QueryKeys.process.all, (old: ProcessSchema[] = []) =>
          old.map((p) => {
            if (p.id !== processId) return p;

            return {
              ...p,
              steps: p.steps?.map((s) => {
                if (s.id !== stepId) return s;

                const updatedSubSteps = s.subSteps?.filter((ss) => ss.id !== subStepId) || [];

                return {
                  ...s,
                  subSteps: updatedSubSteps.length > 0 ? updatedSubSteps : undefined,
                };
              }),
            };
          }),
        );
      },
      onError: handleError,
    },
  );

  const handleDeleteSubStep = useCallback(
    async (processId: string, stepId: string, subStepId: string) => {
      await deleteSubStepMutation.mutateAsync({ processId, stepId, subStepId });
    },
    [deleteSubStepMutation],
  );

  // Add substep mutation
  const addSubStepMutation = useApiMutation(
    async ({ processId, stepId }: { processId: string; stepId: string }) => {
      // Create substep data
      const subStepData: CreateProcessSubStepData = {
        content: 'New subtask',
        completed: false,
        order: 0, // Will be adjusted by backend
      };

      // Create substep in backend
      return ProcessService.createSubStep(stepId, subStepData);
    },
    {
      onSuccess: (result, { processId, stepId }) => {
        const newSubStep = result;
        if (!newSubStep) return;

        // Update process in cache
        queryClient.setQueryData(QueryKeys.process.all, (old: ProcessSchema[] = []) =>
          old.map((p) => {
            if (p.id !== processId) return p;

            return {
              ...p,
              steps: p.steps?.map((s) => {
                if (s.id !== stepId) return s;

                const currentSubSteps = s.subSteps || [];

                return {
                  ...s,
                  subSteps: [...currentSubSteps, newSubStep],
                };
              }),
            };
          }),
        );
      },
      onError: handleError,
    },
  );

  const handleAddSubStep = useCallback(
    async (processId: string, stepId: string) => {
      await addSubStepMutation.mutateAsync({ processId, stepId });
    },
    [addSubStepMutation],
  );

  /**
   * Checks if a step has substeps
   */
  const hasSubSteps = useCallback((step: StepSchema) => {
    if (!step) return false;
    if (!step.subSteps) return false;
    if (!Array.isArray(step.subSteps)) return false;

    return step.subSteps.length > 0;
  }, []);

  return {
    handleCompleteSubStep,
    handleEditSubStep,
    handleDeleteSubStep,
    handleAddSubStep,
    hasSubSteps,
  };
}
