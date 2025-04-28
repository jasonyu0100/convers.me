export interface PlanEvent {
  id: string;
  title: string;
  description: string;
  processId: string;
  startTime: string;
  endTime: string;
  effort: 'low' | 'medium' | 'high';
}

export interface PlanFormData {
  description: string;
  goals: string;
  effort: 'low' | 'medium' | 'high';
  timeAllocation: number;
  templates: string[];
  directories: string[];
  hoursAllocation: number;
  autoGenerateProcess?: boolean;
}
