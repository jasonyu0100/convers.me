import { ProcessSchema, StepSchema, DirectorySchema, UserSchema } from '@/app/types/schema';

/**
 * Directory with process IDs
 */
export interface DirectoryWithProcessIds {
  id: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  processes: string[]; // Array of process IDs
}

/**
 * Process List View Type
 */
export type ProcessListViewType = 'list' | 'editor';

/**
 * Connected event type for processes
 */
export interface ConnectedEvent {
  id: string;
  name: string;
  date: string;
  time?: string;
  imageUrl?: string;
  participants: number;
  progress: number; // 0-1
}

/**
 * Process with additional client-side properties
 */
export interface ProcessWithClientProps extends ProcessSchema {
  connectedEvents?: ConnectedEvent[];
}

/**
 * Context type for Process route
 */
export interface ProcessesContextType {
  currentUser: UserSchema | null;
  processes: ProcessSchema[];
  favoriteProcesses: ProcessSchema[];
  allDirectories: DirectoryWithProcessIds[];
  allProcesses: ProcessSchema[]; // All processes across all directories
  selectedList: ProcessWithClientProps | null;
  isCreatingNewList: boolean;
  isCreatingNewDirectory: boolean;
  selectedDirectoryId: string | null;
  expandedStepIds: Set;
  isLoading: boolean;
  error: Error | null;
  clearError: () => void;
  handleProcessesSelect: (listId: string) => void;
  handleCreateNewList: () => void;
  handleSaveList: (list: ProcessSchema) => Promise;
  handleDeleteList: (listId: string) => Promise;
  setSelectedDirectoryId: (directoryId: string | null) => void;
  handleCompleteStep: (processId: string, stepId: string, completed: boolean) => Promise;
  handleCompleteSubStep: (processId: string, stepId: string, subStepId: string, completed: boolean) => Promise;
  handleToggleStepExpanded: (stepId: string) => void;
  isStepExpanded: (stepId: string) => boolean;
  hasSubSteps: (step: StepSchema) => boolean;
  handleAddStep: (processId: string) => Promise;
  handleEditStep: (processId: string, stepId: string, content: string) => Promise;
  handleEditSubStep: (processId: string, stepId: string, subStepId: string, content: string) => Promise;
  handleDeleteStep: (processId: string, stepId: string) => Promise;
  handleDeleteSubStep: (processId: string, stepId: string, subStepId: string) => Promise;
  handleDuplicateList: (processId: string) => Promise;
  handleAddSubStep: (processId: string, stepId: string) => Promise;
  toggleFavorite: (processId: string) => Promise;
  setIsCreatingNewDirectory: (isCreating: boolean) => void;
  handleCreateDirectory: (params: { name: string; description?: string; color?: string; parentId?: string }) => Promise;
}

// Component-specific props types
export interface ProcessContentProps {
  process: ProcessSchema | null;
  isCreatingNew: boolean;
}

export interface ProcessListViewProps {
  process: ProcessSchema;
  onCompleteStep: (stepId: string, completed: boolean) => void;
  onCompleteSubStep: (stepId: string, subStepId: string, completed: boolean) => void;
  onToggleExpand: (stepId: string) => void;
  isExpanded: (stepId: string) => boolean;
  hasSubSteps: (step: StepSchema) => boolean;
}

export interface ProcessStepItemProps {
  step: StepSchema;
  onComplete: (completed: boolean) => void;
  onToggleExpand: () => void;
  isExpanded: boolean;
  hasSubSteps: boolean;
  onCompleteSubStep: (subStepId: string, completed: boolean) => void;
}

export interface ProcessSubStepItemProps {
  subStep: any; // SubStep type
  onComplete: (completed: boolean) => void;
}

export interface ProcessEditorProps {
  process: ProcessSchema | null;
  onSave: (process: ProcessSchema) => void;
  isCreatingNew: boolean;
}

export interface ConnectedEventsListProps {
  connectedEvents?: ConnectedEvent[]; // Connected events from Process
}

export interface ConnectedEventCardProps {
  event: ConnectedEvent; // Connected event type
}
