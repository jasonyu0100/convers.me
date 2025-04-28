import { UUID, DateTime } from '@/app/types/api-types';

/**
 * Plan event interface for generated weekly plans
 */
export interface PlanEvent {
  id: UUID;
  title: string;
  description: string;
  processId: UUID;
  startTime: DateTime;
  endTime: DateTime;
  effort: 'low' | 'medium' | 'high';
}

/**
 * Form data for weekly plan generation
 */
export interface PlanFormData {
  description: string;
  goals: string;
  effort: 'low' | 'medium' | 'high';
  hoursAllocation: number;
  directories: UUID[];
  templates: string[];
  timeAllocation: number;
  autoGenerateProcess?: boolean;
}

/**
 * Plan generation request sent to API
 */
export interface PlanGenerateRequest {
  description: string;
  goals: string;
  effort: 'low' | 'medium' | 'high';
  hoursAllocation: number;
  directoryIds: UUID[];
  templateIds?: string[];
  autoGenerateProcess?: boolean;
}

/**
 * Plan generation response from API
 */
export interface PlanGenerateResponse {
  events: PlanEvent[];
  summary?: string;
}

/**
 * Plan save request sent to API
 */
export interface PlanSaveRequest {
  events: PlanEvent[];
}

/**
 * Plan save response from API
 */
export interface PlanSaveResponse {
  success: boolean;
  savedEvents: UUID[];
}
