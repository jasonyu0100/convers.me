import { PlanGenerateRequest, PlanGenerateResponse, PlanSaveRequest, PlanSaveResponse } from '@/app/types/plan';
import { ApiResponse } from './api';
import { apiClient } from './apiMiddleware';
import { DirectoryService } from './directoryService';

/**
 * Service for handling plan-related API operations
 */
export const PlanService = {
  /**
   * Generate a weekly plan based on provided parameters
   */
  generatePlan: async (params: PlanGenerateRequest): Promise => {
    return apiClient.post('/plan/generate', params);
  },

  /**
   * Save a generated plan to the calendar
   */
  savePlan: async (params: PlanSaveRequest): Promise => {
    return apiClient.post('/plan/save', params);
  },

  /**
   * Get available directories with templates for planning
   */
  getDirectoriesWithTemplates: async (): Promise => {
    // First try to use the dedicated plan API endpoint
    try {
      const response = await apiClient.get('/plan/directories');

      if (!response.error) {
        return response;
      }

      // If the dedicated endpoint fails, fall back to processing directory data manually
      console.warn('Plan directories endpoint failed, falling back to manual processing');
    } catch (error) {
      console.warn('Plan directories endpoint unavailable:', error);
    }

    // Fallback implementation
    try {
      // Get all directories
      const directoriesResult = await DirectoryService.getDirectories();

      if (directoriesResult.error) {
        return {
          error: directoriesResult.error,
          data: null,
        };
      }

      // Process directories to include template information
      // Only include directories created by the current user
      const directoriesWithTemplates = directoriesResult.data
        .map((directory) => {
          // Check if directory has user ownership information
          // and filter out directories not created by current user
          if (directory.createdById && directory.createdById !== localStorage.getItem('userId')) {
            return null;
          }

          const templates = (directory.processes || [])
            .filter((process) => process.is_template)
            .map((process) => ({
              id: process.id,
              name: process.title,
              templateCount: 1,
            }));

          return {
            id: directory.id,
            name: directory.name,
            description: directory.description || 'No description available',
            color: directory.color || 'blue',
            templates: templates,
          };
        })
        .filter(Boolean) // Remove null entries
        .filter((dir) => dir.templates.length > 0); // Only include directories with templates

      return {
        data: directoriesWithTemplates,
        error: null,
      };
    } catch (error) {
      console.error('Error fetching directories with templates:', error);
      return {
        error: error.message || 'Failed to fetch directories with templates',
        data: null,
      };
    }
  },
};
