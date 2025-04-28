'use client';

import { useApp } from '@/app/components/app/hooks';
import { createRouteContext } from '@/app/components/router/createRouteContext';
import { useRouteComponent } from '@/app/components/router/useRouteComponent';
import logger from '@/app/lib/logger';
import { QueryKeys, useApiMutation, useApiQuery } from '@/app/lib/reactQuery';
import { DirectoryService, ProcessService } from '@/app/services';
import { ApiClient } from '@/app/services/api';
import {
  CreateProcessData,
  CreateProcessStepData,
  CreateProcessSubStepData,
  UpdateProcessData,
  UpdateProcessStepData,
  UpdateProcessSubStepData,
} from '@/app/services/processService';
import { DirectorySchema, EventSchema, ProcessSchema, StepSchema } from '@/app/types/schema';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DirectoryWithProcessIds, ProcessesContextType } from '../types';

/**
 * Create standardized route context for processes
 */
const { Provider, useRouteContext } = createRouteContext<ProcessesContextType>('Process', {
  // Default values will never be used directly as we use the Provider
  currentUser: null,
  processes: [],
  allDirectories: [],
  allProcesses: [],
  favoriteProcesses: [],
  selectedList: null,
  isCreatingNewList: false,
  isCreatingNewDirectory: false,
  selectedDirectoryId: null,
  expandedStepIds: new Set(),
  isLoading: false,
  error: null,
  handleProcessesSelect: () => {},
  handleCreateNewList: () => {},
  handleSaveList: () => {},
  handleDeleteList: () => {},
  setSelectedDirectoryId: () => {},
  handleCompleteStep: () => {},
  handleCompleteSubStep: () => {},
  handleToggleStepExpanded: () => {},
  isStepExpanded: () => false,
  hasSubSteps: () => false,
  handleAddStep: () => {},
  handleEditStep: () => {},
  handleEditSubStep: () => {},
  handleDeleteStep: () => {},
  handleDeleteSubStep: () => {},
  handleDuplicateList: () => {},
  handleAddSubStep: () => {},
  toggleFavorite: () => {},
  clearError: () => {},
  setIsCreatingNewDirectory: () => {},
  handleCreateDirectory: () => {},
});

interface ProcessProviderProps {
  children: ReactNode;
}

// Default directories that will be loaded if none exist in the database
const defaultDirectories: DirectoryWithProcessIds[] = [
  {
    id: 'my-processes',
    name: 'My Processes',
    color: 'bg-blue-500',
    processes: [],
  },
  {
    id: 'shared',
    name: 'Shared Processes',
    color: 'bg-purple-500',
    processes: [],
  },
  {
    id: 'archive',
    name: 'Archived',
    color: 'bg-gray-500',
    processes: [],
  },
];

export function ProcessProvider({ children }: ProcessProviderProps) {
  const app = useApp();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Use standardized route component hook for loading and error states
  const { error, handleError, clearError } = useRouteComponent();

  /**
   * LocalStorage selection persistence helpers
   */
  // Get initial values from localStorage
  const getInitialSelections = () => {
    if (typeof window !== 'undefined') {
      return {
        directoryId: localStorage.getItem('process_selected_directory'),
        processId: localStorage.getItem('process_selected_process'),
      };
    }
    return { directoryId: null, processId: null };
  };

  // Get initial values
  const initialSelections = getInitialSelections();

  // State
  const [selectedListId, setSelectedListId] = useState<string | null>(initialSelections.processId);
  const [isCreatingNewList, setIsCreatingNewList] = useState(false);
  const [isCreatingNewDirectory, setIsCreatingNewDirectory] = useState(false);
  const [selectedDirectoryId, setSelectedDirectoryId] = useState<string | null>(initialSelections.directoryId);
  const [expandedStepIds, setExpandedStepIds] = useState<Set>(new Set());

  // Persist directory selection to localStorage
  const persistAndSetDirectoryId = useCallback((dirId: string | null) => {
    if (typeof window !== 'undefined') {
      if (dirId) {
        localStorage.setItem('process_selected_directory', dirId);
      } else {
        localStorage.removeItem('process_selected_directory');
      }
    }
    setSelectedDirectoryId(dirId);
  }, []);

  // Persist process selection to localStorage
  const persistAndSetListId = useCallback((processId: string | null) => {
    if (typeof window !== 'undefined') {
      if (processId) {
        localStorage.setItem('process_selected_process', processId);
      } else {
        localStorage.removeItem('process_selected_process');
      }
    }
    setSelectedListId(processId);
  }, []);

  // Get current user from app context instead of making a separate API call
  const currentUser = app.currentUser;

  // Track if initial selection has been made to avoid repeated selections
  const initialSelectionMadeRef = useRef(false);

  // Handle URL parameters for prefilling process data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const createParam = urlParams.get('create');
      const prefillParam = urlParams.get('prefill');

      if (createParam === 'true') {
        setIsCreatingNewList(true);

        // If prefill data is provided, store it for the editor component
        if (prefillParam) {
          try {
            // Store prefill data in sessionStorage to be picked up by the editor
            const prefillData = JSON.parse(decodeURIComponent(prefillParam));
            sessionStorage.setItem('process_prefill_data', JSON.stringify(prefillData));
          } catch (error) {
            console.error('Error parsing prefill data:', error);
          }
        }
      }
    }
  }, []);

  // Fetch directories with React Query
  const { data: allDirectories = defaultDirectories, isLoading: isLoadingDirectories } = useApiQuery(
    QueryKeys.directory.all,
    async () => DirectoryService.getDirectories(),
    {
      staleTime: 0, // Always refetch fresh data
      cacheTime: 0, // Don't cache this query
      refetchOnMount: true, // Always refetch when component mounts
      refetchOnWindowFocus: true, // Refetch when window regains focus
      onSuccess: (data) => {
        if (data.length === 0) {
          console.log('No directories found, using default directories');
          return;
        }

        // Set that initialization has happened but don't auto-select anything
        initialSelectionMadeRef.current = true;
      },
      onError: handleError,
    },
  );

  // Fetch all process templates
  const fetchProcessesWithDetails = useCallback(async () => {
    // This will store all processes from directories and templates
    let allLoadedProcesses: ProcessSchema[] = [];

    // Fetch templates explicitly to ensure we have all available processes
    const templatesResult = await ProcessService.getTemplates();
    if (!templatesResult.error && templatesResult.data) {
      // Get template details in parallel for better performance
      const templateDetails = await Promise.all(
        templatesResult.data.map(async (template) => {
          try {
            // Try to get detailed template with steps - with retry logic
            const MAX_RETRIES = 2;
            let detailResult = null;
            let retryCount = 0;

            while (retryCount <= MAX_RETRIES) {
              try {
                detailResult = await ProcessService.getTemplateById(template.id);
                // Break the loop if successful
                if (!detailResult.error && detailResult.data) {
                  break;
                }
                retryCount++;
                // Add a small delay between retries
                if (retryCount <= MAX_RETRIES) {
                  await new Promise((resolve) => setTimeout(resolve, 500));
                }
              } catch (retryError) {
                console.warn(`Retry ${retryCount}/${MAX_RETRIES} failed for template ${template.id}:`, retryError);
                retryCount++;
                // Add a small delay between retries
                if (retryCount <= MAX_RETRIES) {
                  await new Promise((resolve) => setTimeout(resolve, 500));
                }
              }
            }

            if (detailResult && !detailResult.error && detailResult.data) {
              // Verify steps and substeps data
              const processWithSteps = detailResult.data;

              if (!processWithSteps.steps || processWithSteps.steps.length === 0) {
                console.warn(`Template ${template.id} returned with no steps, might be missing data`);
              }

              return {
                ...processWithSteps,
                isTemplate: true,
              };
            } else {
              throw new Error(`Failed to fetch template details after ${MAX_RETRIES} retries`);
            }
          } catch (error) {
            console.warn(`Error fetching template ${template.id} details:`, error);

            // Fallback to basic template data if detailed fetch fails, but mark it as incomplete
            return {
              ...template,
              isTemplate: true,
              steps: template.steps || [], // Use any steps data already available
              _fetchFailed: true, // Mark as incomplete so we can potentially retry later
            };
          }
        }),
      );

      // Add templates to the processes list
      allLoadedProcesses = [...templateDetails.filter(Boolean)];
    }

    // We've already fetched all templates from the templates endpoint,
    // so there's no need to fetch them again from the directory endpoint.
    // This avoids duplicate API calls and prevents template processes from
    // being loaded multiple times.

    return { data: allLoadedProcesses };
  }, [allDirectories]);

  // Fetch all processes with React Query
  const { data: allProcesses = [], isLoading: isLoadingProcesses } = useApiQuery(QueryKeys.process.all, fetchProcessesWithDetails, {
    staleTime: 0, // Always refetch fresh data
    cacheTime: 1000 * 60, // Only cache for 1 minute
    refetchOnMount: true, // Always refetch when component mounts
    onSuccess: (data) => {
      // Initialize expandedStepIds with all step IDs that have substeps
      setExpandedStepIds((prev) => {
        const initialExpanded = new Set<string>(prev);
        data.forEach((process) => {
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

      // If no processes found, don't continue with selection
      if (data.length === 0) {
        console.log('No processes found in data');
        return;
      }

      // Auto-selection functionality has been removed
    },
    onError: handleError,
    enabled: !!allDirectories, // Only run this query once directories are loaded
  });

  // Combined loading state
  const isLoading = isLoadingDirectories || isLoadingProcesses;

  // Fetch connected events for selected process
  const { data: connectedEvents = [] } = useApiQuery(
    selectedListId ? [...QueryKeys.event.byProcess(selectedListId)] : ['connectedEvents'],
    async () => {
      if (!selectedListId) return { data: [] };

      // Find the process
      const process = allProcesses.find((p) => p.id === selectedListId);
      if (!process) return { data: [] };

      // Only fetch if the process is a template
      if (!process.isTemplate) return { data: [] };

      // Fetch events connected to this template
      try {
        // Get events that use this process as a template using the template_process_id parameter
        const params = new URLSearchParams();
        params.append('template_process_id', process.id);

        // This endpoint returns events with process reference but no steps
        let eventResult = await ApiClient.get<EventSchema[]>(`/events?${params}`);

        // If no events found, log information but continue
        if (!eventResult.data || eventResult.data.length === 0) {
          logger.info(`No events found that use template process ${process.id}`);
        }

        // Format the connected events
        if (!eventResult.error && eventResult.data) {
          return {
            data: eventResult.data.map((event) => {
              // Calculate progress based on status
              let progress = 0;

              // Determine progress based on status
              switch (event.status?.toLowerCase()) {
                case 'done':
                  progress = 1; // 100%
                  break;
                case 'in_progress':
                case 'in progress':
                case 'active':
                  progress = 0.6; // 60%
                  break;
                case 'started':
                  progress = 0.3; // 30%
                  break;
                case 'planning':
                  progress = 0.15; // 15%
                  break;
                case 'pending':
                case 'not_started':
                case 'not started':
                  progress = 0; // 0%
                  break;
                default:
                  // Use a moderate default
                  progress = 0.25; // 25%
              }

              return {
                id: event.id,
                name: event.title,
                date: event.date,
                time: event.time || undefined,
                imageUrl: event.color ? undefined : undefined,
                participants: event.participantCount || 0,
                progress,
                status: event.status?.toLowerCase(),
              };
            }),
          };
        }

        return { data: [] };
      } catch (error) {
        logger.error('Failed to load connected events:', error);
        return { data: [] };
      }
    },
    {
      enabled: !!selectedListId && !!allProcesses.length,
    },
  );

  // Get filtered processes based on selected directory
  const filteredProcesses = useMemo(() => {
    // If we're still loading, return an empty array to prevent initial flash of all processes
    if (isLoadingDirectories || isLoadingProcesses) {
      return [];
    }

    if (!selectedDirectoryId) {
      // If no directory is selected but initialization has happened, show an empty list
      // This prevents showing all processes when we're about to auto-select a directory
      if (initialSelectionMadeRef.current) {
        return [];
      }
      // During first render before auto-selection, still return an empty array
      return [];
    }

    const directory = allDirectories.find((dir) => dir.id === selectedDirectoryId);
    if (!directory) return [];

    // Check if directory.processes exists before filtering
    if (!directory.processes || !Array.isArray(directory.processes)) {
      return []; // Return empty array if no processes array is found
    }

    console.log(`Filtering processes for directory ${selectedDirectoryId} with ${directory.processes.length} process IDs`);

    // Filter processes and make sure we have the correct process IDs
    const filtered = allProcesses.filter((process) => {
      const processId = typeof process.id === 'string' ? process.id : String(process.id);
      return directory.processes.some((dirProcessId) => {
        const dirId = typeof dirProcessId === 'string' ? dirProcessId : String(dirProcessId);
        return dirId === processId;
      });
    });

    console.log(`Found ${filtered.length} processes in directory ${selectedDirectoryId}`);
    return filtered;
  }, [allProcesses, allDirectories, selectedDirectoryId, isLoadingDirectories, isLoadingProcesses]);

  // Compute favorite processes
  const favoriteProcesses = useMemo(() => {
    return allProcesses.filter((process) => process.favorite);
  }, [allProcesses]);

  // Get selected process with connected events
  const selectedList = useMemo(() => {
    if (!selectedListId) return null;

    const process = allProcesses.find((list) => list.id === selectedListId);
    if (!process) return null;

    // Check if this process was marked as incomplete fetch and needs steps
    if (process._fetchFailed && !process.steps) {
      // Trigger a background refresh of the template
      const refreshTemplate = async () => {
        try {
          console.log(`Attempting background refresh of template ${process.id} that's missing steps`);
          const refreshResult = await ProcessService.getTemplateById(process.id);

          if (!refreshResult.error && refreshResult.data && refreshResult.data.steps) {
            console.log(`Successfully refreshed template ${process.id}, updating with ${refreshResult.data.steps.length} steps`);

            // Update the process in the cache with the refreshed data
            queryClient.setQueryData(QueryKeys.process.all, (old: ProcessSchema[] = []) =>
              old.map((p) => (p.id === process.id ? { ...p, ...refreshResult.data, _fetchFailed: false } : p)),
            );
          }
        } catch (error) {
          console.warn(`Background refresh failed for template ${process.id}:`, error);
        }
      };

      // Execute the refresh in the background
      refreshTemplate();
    }

    // Include connected events if we have them
    return {
      ...process,
      connectedEvents: connectedEvents.length > 0 ? connectedEvents : undefined,
    };
  }, [selectedListId, allProcesses, connectedEvents, queryClient]);

  // Track step IDs with substeps to prevent infinite re-rendering
  const stepsWithSubstepsRef = useRef<string[]>([]);

  // Effect to expand all steps with substeps when selected list changes
  useEffect(() => {
    // Only run this effect when selectedListId changes
    if (!selectedListId || !selectedList || !selectedList.steps) {
      return;
    }

    // Identify steps with substeps
    const stepsWithSubsteps = selectedList.steps.filter((step) => step && step.subSteps && step.subSteps.length > 0).map((step) => step.id);

    // Check if the list of steps with substeps has changed
    const prevStepsString = stepsWithSubstepsRef.current.sort().join(',');
    const currStepsString = [...stepsWithSubsteps].sort().join(',');

    // Only update state if the list of steps with substeps has changed
    if (prevStepsString !== currStepsString) {
      stepsWithSubstepsRef.current = stepsWithSubsteps;

      // Update the expandedStepIds state
      setExpandedStepIds((prev) => {
        const newSet = new Set(prev);
        stepsWithSubsteps.forEach((stepId) => newSet.add(stepId));
        return newSet;
      });
    }
  }, [selectedListId, selectedList]); // It's safe to include selectedList here with our ref-based check

  // Track which directories we've already processed to prevent infinite loops
  const processedDirectoriesRef = useRef<Record>({});

  // Effect to handle directory changes and update selected process
  // Auto-selection logic has been removed

  // MUTATIONS AND ACTIONS

  // Track process selection to prevent recursive updates
  const previousSelectionRef = useRef<{ listId: string | null; directoryId: string | null }>({
    listId: null,
    directoryId: null,
  });

  // Process selection mutation
  const handleProcessesSelect = useCallback(
    (listId: string) => {
      try {
        // Check if we're trying to make the same selection again
        if (listId === previousSelectionRef.current.listId) {
          console.log(`Process ${listId} is already selected, no change needed`);
          return;
        }

        // If empty string is passed, just clear the process selection
        // but keep the directory selection
        if (listId === '') {
          console.log('Clearing process selection but keeping directory');
          persistAndSetListId(null);
          setIsCreatingNewList(false);

          // Update ref to track this selection
          previousSelectionRef.current = {
            listId: null,
            directoryId: selectedDirectoryId,
          };
          return;
        }

        // Update the previous selection ref
        previousSelectionRef.current = {
          listId: listId,
          directoryId: selectedDirectoryId,
        };

        // Set the selected list ID and persist to localStorage
        persistAndSetListId(listId);
        setIsCreatingNewList(false);
      } catch (error) {
        handleError(error);
      }
    },
    [selectedDirectoryId, handleError],
  );

  const handleCreateNewList = useCallback(() => {
    try {
      // Update tracking ref to show we're creating a new list (no selectedListId)
      previousSelectionRef.current.listId = null;

      setIsCreatingNewList(true);
      persistAndSetListId(null);

      // Make sure we have a directory selected
      if (!selectedDirectoryId && allDirectories.length > 0) {
        // If no directory is selected, select the first one
        console.log('No directory selected when creating new process, selecting first directory');
        const firstDirId = allDirectories[0].id;
        previousSelectionRef.current.directoryId = firstDirId;
        persistAndSetDirectoryId(firstDirId);
      }
    } catch (error) {
      handleError(error);
    }
  }, [handleError, selectedDirectoryId, allDirectories]);

  // Create directory mutation
  const createDirectoryMutation = useApiMutation(
    async ({ name, description, color, parentId }: { name: string; description?: string; color?: string; parentId?: string }) => {
      return DirectoryService.createDirectory({
        name,
        description,
        color,
        parent_id: parentId,
      });
    },
    {
      onSuccess: (result) => {
        if (result.error) {
          handleError(new Error(result.error));
          return;
        }

        const newDirectory = result.data;
        if (!newDirectory) {
          handleError(new Error('Failed to create directory'));
          return;
        }

        // Update directories in cache
        queryClient.setQueryData(QueryKeys.directory.all, (old: DirectorySchema[] = []) => [...old, newDirectory]);

        // Select the new directory
        setSelectedDirectoryId(newDirectory.id);

        // Close the create directory modal
        setIsCreatingNewDirectory(false);
      },
      onError: handleError,
    },
  );

  const handleCreateDirectory = useCallback(
    async ({ name, description, color, parentId }: { name: string; description?: string; color?: string; parentId?: string }) => {
      await createDirectoryMutation.mutateAsync({ name, description, color, parentId });
    },
    [createDirectoryMutation],
  );

  // Save process mutation
  const saveProcessMutation = useApiMutation(
    async (list: ProcessSchema) => {
      // Determine if this is a new process or an update
      const isNewProcess = !allProcesses.some((p) => p.id === list.id);

      if (isNewProcess) {
        // Create new process
        const newProcessData: CreateProcessData = {
          title: list.title,
          description: list.description,
          color: list.color,
          category: list.category,
          favorite: list.favorite,
          isTemplate: true, // Always create as a template in the process view
          directoryId: selectedDirectoryId || undefined, // Assign to current directory
        };

        console.log(`Creating new process in directory: ${selectedDirectoryId || 'none'}`);

        return ProcessService.createTemplate(newProcessData);
      } else {
        // Update existing process
        const updateData: UpdateProcessData = {
          title: list.title,
          description: list.description,
          color: list.color,
          category: list.category,
          favorite: list.favorite,
        };

        // Update directory if changed
        if (selectedDirectoryId && (!list.directoryId || list.directoryId !== selectedDirectoryId)) {
          updateData.directory_id = selectedDirectoryId;
        }

        return ProcessService.updateTemplate(list.id, updateData);
      }
    },
    {
      onSuccess: (result, variables) => {
        // After saving the process, update cache and UI
        const isNewProcess = !allProcesses.some((p) => p.id === result.id);
        const process = result;
        const oldDirectoryId = variables.directoryId;

        if (isNewProcess) {
          // Add to processes list
          queryClient.setQueryData(QueryKeys.process.all, (old: ProcessSchema[] = []) => [...old, process]);

          // Add to current directory
          if (selectedDirectoryId) {
            queryClient.setQueryData(QueryKeys.directory.all, (old: DirectoryWithProcessIds[] = []) =>
              old.map((dir) =>
                dir.id === selectedDirectoryId
                  ? {
                      ...dir,
                      processes: [...dir.processes, process.id],
                    }
                  : dir,
              ),
            );
          }

          // Set as selected
          setSelectedListId(process.id);
        } else {
          // Update in the processes list
          queryClient.setQueryData(QueryKeys.process.all, (old: ProcessSchema[] = []) => old.map((p) => (p.id === process.id ? process : p)));

          // If directory changed, update directory assignments
          if (oldDirectoryId !== process.directoryId) {
            queryClient.setQueryData(QueryKeys.directory.all, (old: DirectoryWithProcessIds[] = []) => {
              // Remove from old directory
              const updatedDirs = old.map((dir) => {
                if (dir.id === oldDirectoryId) {
                  return {
                    ...dir,
                    processes: dir.processes.filter((id) => id !== process.id),
                  };
                }
                return dir;
              });

              // Add to new directory
              return updatedDirs.map((dir) => {
                if (dir.id === process.directoryId) {
                  // Check if it's already in the directory
                  if (!dir.processes.includes(process.id)) {
                    return {
                      ...dir,
                      processes: [...dir.processes, process.id],
                    };
                  }
                }
                return dir;
              });
            });
          }
        }

        setIsCreatingNewList(false);
      },
      onError: handleError,
    },
  );

  const handleSaveList = useCallback(
    async (list: ProcessSchema) => {
      await saveProcessMutation.mutateAsync(list);
    },
    [saveProcessMutation],
  );

  // Delete process mutation
  const deleteProcessMutation = useApiMutation(async (processId: string) => ProcessService.deleteTemplate(processId), {
    onSuccess: (_, processId) => {
      // Remove from the processes array
      queryClient.setQueryData(QueryKeys.process.all, (old: ProcessSchema[] = []) => old.filter((p) => p.id !== processId));

      // Remove from directories
      queryClient.setQueryData(QueryKeys.directory.all, (old: DirectoryWithProcessIds[] = []) =>
        old.map((dir) => ({
          ...dir,
          processes: dir.processes.filter((id) => id !== processId),
        })),
      );

      // Update selection if needed
      if (selectedListId === processId) {
        // Find the directory and select another process if available
        const directory = allDirectories.find((dir) => dir.processes.includes(processId));

        if (directory) {
          const remainingProcesses = directory.processes.filter((id) => id !== processId);
          setSelectedListId(remainingProcesses.length > 0 ? remainingProcesses[0] : null);
        } else {
          // Fallback to first process of any directory
          setSelectedListId(allProcesses.length > 0 ? allProcesses[0].id : null);
        }
      }
    },
    onError: handleError,
  });

  const handleDeleteList = useCallback(
    async (processId: string) => {
      await deleteProcessMutation.mutateAsync(processId);
    },
    [deleteProcessMutation],
  );

  // Complete step mutation
  const completeStepMutation = useApiMutation(
    async ({ processId, stepId, completed }: { processId: string; stepId: string; completed: boolean }) => {
      // Find the step
      const process = allProcesses.find((p) => p.id === processId);
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
                  }).catch((e) => {});
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

  const hasSubSteps = useCallback((step: StepSchema) => {
    // Safely check for substeps
    if (!step) return false;
    if (!step.subSteps) return false;

    // Handle case where subSteps is not in the expected format
    if (!Array.isArray(step.subSteps)) {
      return false;
    }

    // Verify the array has content
    return step.subSteps.length > 0;
  }, []);

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

        // Make sure step is expanded
        setExpandedStepIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(stepId);
          return newSet;
        });
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

  // Duplicate process mutation
  const duplicateProcessMutation = useApiMutation(
    async (processId: string) => {
      // Get the process to duplicate
      const processToDuplicate = allProcesses.find((p) => p.id === processId);
      if (!processToDuplicate) {
        throw new Error('Process not found');
      }

      // Create a new process based on the existing one
      const newProcessData: CreateProcessData = {
        title: `${processToDuplicate.title} (Copy)`,
        description: processToDuplicate.description,
        color: processToDuplicate.color,
        category: processToDuplicate.category,
        favorite: processToDuplicate.favorite,
        // Use the current directory or the same as the original process
        directoryId: selectedDirectoryId || processToDuplicate.directoryId,
      };

      // Create in backend
      const result = await ProcessService.createProcess(newProcessData);
      if (result.error) {
        throw new Error(result.error);
      }

      const newProcess = result.data;
      if (!newProcess) throw new Error('Failed to create new process');

      // Copy steps if original process had them
      if (processToDuplicate.steps?.length) {
        for (const originalStep of processToDuplicate.steps) {
          // Create new step
          const stepData: any = {
            content: originalStep.content,
            completed: originalStep.completed,
            order: originalStep.order,
            dueDate: originalStep.dueDate,
          };

          const stepResult = await ProcessService.createStep(newProcess.id, stepData);

          if (stepResult.data && originalStep.subSteps?.length) {
            const newStepId = stepResult.data.id;

            // Create substeps for this step
            for (const originalSubStep of originalStep.subSteps) {
              const subStepData: CreateProcessSubStepData = {
                content: originalSubStep.content,
                completed: originalSubStep.completed,
                order: originalSubStep.order,
              };

              await ProcessService.createSubStep(newStepId, subStepData);
            }
          }
        }

        // Refresh the process to get updated steps
        const refreshResult = await ProcessService.getTemplateById(newProcess.id);
        if (refreshResult?.data) {
          return { ...refreshResult.data, directoryId: newProcess.directoryId };
        }
      }

      return newProcess;
    },
    {
      onSuccess: (newProcess) => {
        if (!newProcess) return;

        // Add to processes list
        queryClient.setQueryData(QueryKeys.process.all, (old: ProcessSchema[] = []) => [...old, newProcess]);

        // Add to the appropriate directory
        const directoryId = newProcess.directoryId || selectedDirectoryId;
        if (directoryId) {
          queryClient.setQueryData(QueryKeys.directory.all, (old: DirectoryWithProcessIds[] = []) =>
            old.map((dir) => (dir.id === directoryId ? { ...dir, processes: [...dir.processes, newProcess.id] } : dir)),
          );
        }

        // Set as selected
        setSelectedListId(newProcess.id);
      },
      onError: handleError,
    },
  );

  const handleDuplicateList = useCallback(
    async (processId: string) => {
      await duplicateProcessMutation.mutateAsync(processId);
    },
    [duplicateProcessMutation],
  );

  // Toggle favorite mutation
  const toggleFavoriteMutation = useApiMutation(
    async (processId: string) => {
      // Find current process
      const process = allProcesses.find((p) => p.id === processId);
      if (!process) throw new Error('Process not found');

      // Toggle favorite status in backend
      const updateData: UpdateProcessData = {
        favorite: !process.favorite,
      };

      return ProcessService.updateTemplate(processId, updateData);
    },
    {
      onSuccess: (result, processId) => {
        // Find current process to get favorite status
        const process = allProcesses.find((p) => p.id === processId);
        if (!process) return;

        const favorite = !process.favorite;

        // Update process in cache
        queryClient.setQueryData(QueryKeys.process.all, (old: ProcessSchema[] = []) =>
          old.map((p) => {
            if (p.id === processId) {
              return {
                ...p,
                favorite,
              };
            }
            return p;
          }),
        );
      },
      onError: handleError,
    },
  );

  const toggleFavorite = useCallback(
    async (processId: string) => {
      await toggleFavoriteMutation.mutateAsync(processId);
    },
    [toggleFavoriteMutation],
  );

  // Context value
  const contextValue: ProcessesContextType = {
    currentUser,
    processes: filteredProcesses,
    allDirectories: allDirectories,
    allProcesses, // Add all processes to the context
    favoriteProcesses,
    selectedList,
    isCreatingNewList,
    isCreatingNewDirectory,
    selectedDirectoryId,
    setSelectedDirectoryId: persistAndSetDirectoryId, // Use the localStorage-aware version
    expandedStepIds,
    isLoading,
    error,
    clearError,
    handleProcessesSelect,
    handleCreateNewList,
    handleSaveList,
    handleDeleteList,
    handleCompleteStep,
    handleCompleteSubStep,
    handleToggleStepExpanded,
    isStepExpanded,
    hasSubSteps,
    handleAddStep,
    handleEditStep,
    handleEditSubStep,
    handleDeleteStep,
    handleDeleteSubStep,
    handleDuplicateList,
    handleAddSubStep,
    toggleFavorite,
    setIsCreatingNewDirectory,
    handleCreateDirectory,
  };

  return <Provider value={contextValue}>{children}</Provider>;
}

/**
 * Hook for accessing processes context
 */
export function useProcess() {
  return useRouteContext();
}
