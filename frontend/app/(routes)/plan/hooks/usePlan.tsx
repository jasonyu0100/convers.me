'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute, createRouteContext, useRouteComponent } from '@/app/components/router';
import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { PlanFormData } from '@/app/types/plan';
import { plan } from '@/app/types/api-types';

import { PlanService } from '@/app/services';

interface PlanContextValue {
  // Form state
  formState: PlanFormData;
  errors: Partial;
  isSubmitting: boolean;
  isLoading?: boolean;
  error?: string | null;

  // Generated plan
  generatedEvents: plan.PlanEvent[];
  hasGeneratedPlan: boolean;

  // Actions
  handleInputChange: (e: React.ChangeEvent) => void;
  handleTemplateToggle: (templateId: string) => void;
  handleGeneratePlan: () => void;
  handleSavePlan: () => void;
  clearError?: () => void;
}

// Create the context using the standardized factory function
const { Provider, useRouteContext } = createRouteContext<PlanContextValue>('Plan', {
  // Default values that will never be used directly
  formState: {
    description: '',
    goals: '',
    effort: 'medium',
    hoursAllocation: 20,
    directories: [],
    templates: [],
    timeAllocation: 50,
    autoGenerateProcess: false,
  },
  errors: {},
  isSubmitting: false,
  isLoading: false,
  error: null,
  generatedEvents: [],
  hasGeneratedPlan: false,
  handleInputChange: () => {},
  handleTemplateToggle: () => {},
  handleGeneratePlan: () => {},
  handleSavePlan: () => {},
  clearError: () => {},
});

interface PlanProviderProps {
  children: ReactNode;
}

/**
 * Provider component for planning functionality
 */
export function PlanProvider({ children }: PlanProviderProps) {
  const app = useApp();
  const router = useRouter();
  const { isLoading, error, handleError, clearError } = useRouteComponent();

  const [formState, setFormState] = useState<PlanFormData>({
    description: '',
    goals: '',
    effort: 'medium',
    hoursAllocation: 20,
    directories: [],
    templates: [],
    timeAllocation: 50,
    autoGenerateProcess: false,
  });
  const [errors, setErrors] = useState<Partial>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedEvents, setGeneratedEvents] = useState<plan.PlanEvent[]>([]);
  const [hasGeneratedPlan, setHasGeneratedPlan] = useState(false);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent) => {
      try {
        const { name, value } = e.target;

        // Handle numeric values
        if (name === 'hoursAllocation' || name === 'timeAllocation') {
          const numericValue = parseInt(value);
          setFormState((prev) => ({
            ...prev,
            [name]: isNaN(numericValue) ? 0 : numericValue,
          }));
        } else {
          // Update form state for other fields
          setFormState((prev) => ({
            ...prev,
            [name]: value,
          }));
        }

        // Clear error when field is updated
        if (errors[name as keyof PlanFormData]) {
          setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
      } catch (error) {
        handleError(error);
      }
    },
    [errors, handleError],
  );

  const handleTemplateToggle = useCallback((directoryId: string) => {
    setFormState((prev) => {
      const directories = [...prev.directories];

      if (directories.includes(directoryId)) {
        // Remove directory if it's already selected
        return {
          ...prev,
          directories: directories.filter((id) => id !== directoryId),
        };
      } else {
        // Add directory if not already selected
        return {
          ...prev,
          directories: [...directories, directoryId],
        };
      }
    });
  }, []);

  const validateForm = useCallback((): boolean => {
    try {
      const newErrors: Partial = {};

      // Check description
      if (!formState.description.trim()) {
        newErrors.description = 'Description is required';
      }

      // Check goals
      if (!formState.goals.trim()) {
        newErrors.goals = 'Goals are required';
      }

      // Check hours allocation makes sense
      if (formState.hoursAllocation <= 0 || formState.hoursAllocation > 40) {
        newErrors.hoursAllocation = 'Hours allocation must be between 1-40';
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    } catch (error) {
      handleError(error);
      return false;
    }
  }, [formState, handleError]);

  // Generate plan mutation
  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      if (!validateForm()) {
        console.log('Form validation failed with errors:', errors);
        return false;
      }

      // Call the plan service to generate a plan
      const response = await PlanService.generatePlan({
        description: formState.description,
        goals: formState.goals,
        effort: formState.effort,
        hoursAllocation: formState.hoursAllocation,
        directoryIds: formState.directories,
        templateIds: formState.templates,
        autoGenerateProcess: formState.autoGenerateProcess,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data;
    },
    onSuccess: (data) => {
      if (data && data.events) {
        setGeneratedEvents(data.events);
        setHasGeneratedPlan(true);
      }
    },
    onError: (error) => {
      handleError(error);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  /**
   * Generate a weekly plan based on inputs
   */
  const handleGeneratePlan = useCallback(() => {
    // Reset any existing plan data
    if (hasGeneratedPlan) {
      setGeneratedEvents([]);
      setHasGeneratedPlan(false);
    }

    // Show loading state
    setIsSubmitting(true);

    // Start generation with a small delay to allow UI to update
    setTimeout(() => {
      generatePlanMutation.mutate();
    }, 100);
  }, [generatePlanMutation, hasGeneratedPlan]);

  // Save plan mutation
  const savePlanMutation = useMutation({
    mutationFn: async () => {
      if (!hasGeneratedPlan) {
        console.error('No plan has been generated yet');
        return false;
      }

      // Call the plan service to save the generated plan
      const response = await PlanService.savePlan({
        events: generatedEvents,
      });

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data;
    },
    onSuccess: (data) => {
      if (data && data.success) {
        // Redirect to calendar page
        app.setMainView(AppRoute.CALENDAR);
        router.push('/calendar');
      }
    },
    onError: (error) => {
      handleError(error);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  /**
   * Save the generated plan to the calendar
   */
  const handleSavePlan = useCallback(() => {
    setIsSubmitting(true);

    // Show feedback during save
    setTimeout(() => {
      savePlanMutation.mutate();
    }, 100);
  }, [savePlanMutation]);

  // Context value
  const contextValue: PlanContextValue = {
    // State
    formState,
    errors,
    isSubmitting: isSubmitting || generatePlanMutation.isPending || savePlanMutation.isPending,
    isLoading,
    error,

    // Generated plan
    generatedEvents,
    hasGeneratedPlan,

    // Actions
    handleInputChange,
    handleTemplateToggle,
    handleGeneratePlan,
    handleSavePlan,
    clearError,
  };

  return <Provider value={contextValue}>{children}</Provider>;
}

// Export the hook with the standard name
export const usePlan = useRouteContext;
