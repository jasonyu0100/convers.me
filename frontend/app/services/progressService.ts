import { ApiResponse } from '@/app/types/api';
import { ApiClient } from './api';
// Import types from progress
import { ProgressTabType, TimeFrameType } from '../types/progress';

interface ProgressRequest {
  timeFrame: TimeFrameType;
  tab?: ProgressTabType;
  tag?: string | null;
  startDate?: string;
  endDate?: string;
}

/**
 * Progress service for interacting with the progress API
 */
export class ProgressService {
  /**
   * Get progress data for the dashboard
   * @param request Progress request parameters
   */
  static async getProgress(request: ProgressRequest): Promise {
    try {
      // Use the new progress endpoint
      const response = await ApiClient.post('/progress', request);
      return { data: response.data, error: null };
    } catch (error: any) {
      console.error('Error fetching progress data:', error);
      return {
        data: null,
        error: error.response?.data?.detail || 'Failed to fetch progress data',
      };
    }
  }

  /**
   * Get user timeline data
   */
  static async getTimeline(): Promise {
    try {
      // Use the new progress/timeline endpoint
      const response = await ApiClient.get('/progress/timeline');
      return { data: response.data, error: null };
    } catch (error: any) {
      console.error('Error fetching timeline data:', error);
      return {
        data: null,
        error: error.response?.data?.detail || 'Failed to fetch timeline data',
      };
    }
  }
}
