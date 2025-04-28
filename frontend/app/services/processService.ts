/**
 * Process service for handling process-related operations
 * Implements a clean, maintainable API for process management
 */

import { ProcessSchema, StepSchema, SubStepSchema } from '@/app/types/schema';
import { ApiClient, ApiResult, PaginationParams, buildParams } from './api';

// Common interfaces
type ProcessMetadata = Record;

/**
 * Base interface for process data
 */
interface ProcessDataBase {
  title: string;
  description?: string;
  color?: string;
  category?: string;
  favorite?: boolean;
  directoryId?: string;
  metadata?: ProcessMetadata;
}

/**
 * Interface for creating a new process
 */
export interface CreateProcessData extends ProcessDataBase {
  steps?: CreateProcessStepData[];
  isTemplate?: boolean; // Whether this is a template process
  templateId?: string; // Reference to the template process if this is an instance
}

/**
 * Interface for updating a process
 */
export interface UpdateProcessData extends Partial {
  isTemplate?: boolean;
  templateId?: string;
}

/**
 * Interface for process filtering options
 */
export interface ProcessFilterOptions extends PaginationParams {
  category?: string;
  favorite?: boolean;
  isTemplate?: boolean;
  templateId?: string;
}

/**
 * Base interface for step data
 */
interface StepDataBase {
  content: string;
  completed?: boolean;
  order: number;
  dueDate?: string;
}

/**
 * Interface for creating a new process step
 */
export interface CreateProcessStepData extends StepDataBase {
  processId: string;
  subSteps?: CreateProcessSubStepData[];
}

/**
 * Interface for creating a new process sub-step
 */
export interface CreateProcessSubStepData {
  content: string;
  completed?: boolean;
  order: number;
}

/**
 * Interface for updating a process step
 */
export interface UpdateProcessStepData extends Partial {}

/**
 * Interface for updating a process sub-step
 */
export interface UpdateProcessSubStepData {
  content?: string;
  completed?: boolean;
  order?: number;
}

/**
 * Service for process-related operations
 */
export class ProcessService {
  /**
   * PROCESS CREATION
   */

  /**
   * Create a template process
   */
  static async createTemplate(processData: CreateProcessData): Promise {
    return ApiClient.post<ProcessSchema>('/templates', {
      ...processData,
      isTemplate: true,
    });
  }

  /**
   * Create a live process
   */
  static async createLiveProcess(processData: CreateProcessData): Promise {
    return ApiClient.post<ProcessSchema>('/live-processes', {
      ...processData,
      isTemplate: false,
    });
  }

  /**
   * Create a process (for backwards compatibility)
   */
  static async createProcess(processData: CreateProcessData): Promise {
    return processData.isTemplate ? this.createTemplate(processData) : this.createLiveProcess(processData);
  }

  /**
   * PROCESS RETRIEVAL
   */

  /**
   * Get template processes with optional filtering
   */
  static async getTemplates(options: ProcessFilterOptions = {}): Promise {
    const { skip = 0, limit = 100, category, favorite } = options;

    const params = buildParams({
      skip,
      limit,
      category,
      favorite,
    });

    return ApiClient.get<ProcessSchema[]>('/templates', { params });
  }

  /**
   * Get live processes with optional filtering
   */
  static async getLiveProcesses(options: ProcessFilterOptions = {}): Promise {
    const { skip = 0, limit = 100, category, favorite, templateId } = options;

    const params = buildParams({
      skip,
      limit,
      category,
      favorite,
      templateId,
    });

    return ApiClient.get<ProcessSchema[]>('/live-processes', { params });
  }

  /**
   * Get processes with optional filtering (for backwards compatibility)
   */
  static async getProcesses(options: ProcessFilterOptions = {}): Promise {
    const { isTemplate, ...otherOptions } = options;

    // Use the appropriate endpoint based on isTemplate
    if (isTemplate === true) {
      return this.getTemplates(otherOptions);
    } else if (isTemplate === false) {
      return this.getLiveProcesses(otherOptions);
    }

    // For generic endpoint
    const params = buildParams({
      ...otherOptions,
      isTemplate,
    });

    return ApiClient.get<ProcessSchema[]>('/processes', { params });
  }

  /**
   * PROCESS RETRIEVAL BY ID
   */

  /**
   * Get a template by ID
   */
  static async getTemplateById(templateId: string): Promise {
    return ApiClient.get<ProcessSchema>(`/templates/${templateId}`);
  }

  /**
   * Get a live process by ID
   */
  static async getLiveProcessById(processId: string): Promise {
    return ApiClient.get<ProcessSchema>(`/live-processes/${processId}`);
  }

  /**
   * Get a process by ID (for backwards compatibility)
   * This method will try different endpoints if the process type is unknown
   */
  static async getProcessById(processId: string, isTemplate?: boolean): Promise {
    // If isTemplate is explicitly provided, use the appropriate endpoint
    if (isTemplate === true) {
      return this.getTemplateById(processId);
    } else if (isTemplate === false) {
      return this.getLiveProcessById(processId);
    }

    // Otherwise try the general endpoint that can retrieve both types
    try {
      return await ApiClient.get<ProcessSchema>(`/processes/${processId}`);
    } catch (error) {
      // If the general endpoint fails, try the specific endpoints
      console.log('Error with general process endpoint, trying specific endpoints', error);

      try {
        return await this.getTemplateById(processId);
      } catch (templateError) {
        try {
          return await this.getLiveProcessById(processId);
        } catch (liveError) {
          // If all attempts fail, throw the original error
          throw error;
        }
      }
    }
  }

  /**
   * PROCESS UPDATES
   */

  /**
   * Update a template
   */
  static async updateTemplate(templateId: string, updateData: UpdateProcessData): Promise {
    return ApiClient.put<ProcessSchema>(`/templates/${templateId}`, updateData);
  }

  /**
   * Update a live process
   */
  static async updateLiveProcess(processId: string, updateData: UpdateProcessData): Promise {
    return ApiClient.put<ProcessSchema>(`/live-processes/${processId}`, updateData);
  }

  /**
   * Update a process (for backwards compatibility)
   * This method will try to determine the process type if not specified
   */
  static async updateProcess(processId: string, updateData: UpdateProcessData, isTemplate?: boolean): Promise {
    // Determine the process type if not provided
    if (isTemplate === undefined) {
      try {
        const processResult = await this.getProcessById(processId);
        if (processResult.data?.isTemplate !== undefined) {
          isTemplate = processResult.data.isTemplate;
        }
      } catch (error) {
        console.warn('Error determining if process is template:', error);
      }
    }

    // Route to the appropriate endpoint
    if (isTemplate === true) {
      return this.updateTemplate(processId, updateData);
    } else if (isTemplate === false) {
      return this.updateLiveProcess(processId, updateData);
    }

    // Fall back to the generic endpoint
    return ApiClient.put<ProcessSchema>(`/processes/${processId}`, updateData);
  }

  /**
   * PROCESS DELETION
   */

  /**
   * Delete a template
   */
  static async deleteTemplate(templateId: string): Promise {
    return ApiClient.delete<void>(`/templates/${templateId}`);
  }

  /**
   * Delete a live process
   */
  static async deleteLiveProcess(processId: string): Promise {
    return ApiClient.delete<void>(`/live-processes/${processId}`);
  }

  /**
   * Delete a process (for backwards compatibility)
   * This method will try to determine the process type if not specified
   */
  static async deleteProcess(processId: string, isTemplate?: boolean): Promise {
    // Determine the process type if not provided
    if (isTemplate === undefined) {
      try {
        const processResult = await this.getProcessById(processId);
        if (processResult.data?.isTemplate !== undefined) {
          isTemplate = processResult.data.isTemplate;
        }
      } catch (error) {
        console.warn('Error determining if process is template:', error);
      }
    }

    // Route to the appropriate endpoint
    if (isTemplate === true) {
      return this.deleteTemplate(processId);
    } else if (isTemplate === false) {
      return this.deleteLiveProcess(processId);
    }

    // Fall back to the generic endpoint
    return ApiClient.delete<void>(`/processes/${processId}`);
  }

  /**
   * STEP MANAGEMENT
   */

  /**
   * Create a process step
   */
  static async createStep(processId: string, stepData: Omit): Promise {
    return ApiClient.post<StepSchema>(`/processes/${processId}/steps`, {
      ...stepData,
      processId,
    });
  }

  /**
   * Get steps for a process
   */
  static async getProcessSteps(processId: string): Promise {
    return ApiClient.get<StepSchema[]>(`/processes/${processId}/steps`);
  }

  /**
   * Update a step
   */
  static async updateStep(stepId: string, updateData: UpdateProcessStepData): Promise {
    return ApiClient.put<StepSchema>(`/processes/steps/${stepId}`, updateData);
  }

  /**
   * Delete a step
   */
  static async deleteStep(stepId: string): Promise {
    return ApiClient.delete<void>(`/processes/steps/${stepId}`);
  }

  /**
   * SUB-STEP MANAGEMENT
   */

  /**
   * Create a sub-step for a step
   */
  static async createSubStep(stepId: string, subStepData: CreateProcessSubStepData): Promise {
    return ApiClient.post<SubStepSchema>(`/processes/steps/${stepId}/substeps`, subStepData);
  }

  /**
   * Get sub-steps for a step
   */
  static async getStepSubSteps(stepId: string): Promise {
    return ApiClient.get<SubStepSchema[]>(`/processes/steps/${stepId}/substeps`);
  }

  /**
   * Update a sub-step
   */
  static async updateSubStep(subStepId: string, updateData: UpdateProcessSubStepData): Promise {
    return ApiClient.put<SubStepSchema>(`/processes/substeps/${subStepId}`, updateData);
  }

  /**
   * Batch update multiple sub-steps at once
   */
  static async batchUpdateSubSteps(updates: Array): Promise {
    return ApiClient.post<SubStepSchema[]>(`/processes/batch/substeps/update`, updates);
  }

  /**
   * Delete a sub-step
   */
  static async deleteSubStep(subStepId: string): Promise {
    return ApiClient.delete<void>(`/processes/substeps/${subStepId}`);
  }
}
