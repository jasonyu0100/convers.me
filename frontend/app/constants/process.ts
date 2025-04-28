/**
 * Constants for process-related functionality
 */

export const DEFAULT_DIRECTORIES = [
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

export const DEFAULT_STEP_CONTENT = 'New step';
export const DEFAULT_SUBSTEP_CONTENT = 'New subtask';

export const STATUS_PROGRESS_MAP = {
  done: 1, // 100%
  in_progress: 0.6, // 60%
  in_progress_upper: 0.6, // 60%
  active: 0.6, // 60%
  started: 0.3, // 30%
  planning: 0.15, // 15%
  pending: 0, // 0%
  not_started: 0, // 0%
  not_started_upper: 0, // 0%
};

export const LOCAL_STORAGE_KEYS = {
  SELECTED_DIRECTORY: 'process_selected_directory',
  SELECTED_PROCESS: 'process_selected_process',
};

export const MAX_RETRIES = 2;
export const RETRY_DELAY = 500; // ms

export const ERROR_MESSAGES = {
  PROCESS_NOT_FOUND: 'Process not found',
  STEP_NOT_FOUND: 'Step not found',
  FAILED_TO_CREATE_DIRECTORY: 'Failed to create directory',
  FAILED_TO_FETCH_TEMPLATE: 'Failed to fetch template details',
  FAILED_TO_CREATE_PROCESS: 'Failed to create new process',
};
