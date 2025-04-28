'use client';

import { LiveContext, LiveMessage, LiveOperation, LiveProcessContext, LiveResponse } from '@/app/types/live';
import { ApiResponse, handleApiError } from './api';
import { apiClient } from './apiMiddleware';

/**
 * Service for interacting with the live API endpoints
 */
export class LiveService {
  /**
   * Create a new live context
   */
  async createContext(data: { processId?: string; eventId?: string; templateId?: string; messages?: LiveMessage[]; metadata?: Record }): Promise {
    try {
      const response = await apiClient.post('/live/contexts', data);
      return { data: response.data, error: null };
    } catch (error) {
      return handleApiError(error, 'Failed to create live context');
    }
  }

  /**
   * Get a specific live context by ID
   */
  async getContext(contextId: string): Promise {
    try {
      const response = await apiClient.get(`/live/contexts/${contextId}`);
      return { data: response.data, error: null };
    } catch (error) {
      return handleApiError(error, 'Failed to get live context');
    }
  }

  /**
   * Update a live context
   */
  async updateContext(
    contextId: string,
    data: {
      processId?: string;
      eventId?: string;
      templateId?: string;
      messages?: LiveMessage[];
      metadata?: Record;
    },
  ): Promise {
    try {
      const response = await apiClient.put(`/live/contexts/${contextId}`, data);
      return { data: response.data, error: null };
    } catch (error) {
      return handleApiError(error, 'Failed to update live context');
    }
  }

  /**
   * Delete a live context
   */
  async deleteContext(contextId: string): Promise {
    try {
      const response = await apiClient.delete(`/live/contexts/${contextId}`);
      return { data: response.data, error: null };
    } catch (error) {
      return handleApiError(error, 'Failed to delete live context');
    }
  }

  /**
   * Get all live contexts for the current user, with optional filtering
   */
  async getContexts(
    params: {
      processId?: string;
      eventId?: string;
      templateId?: string;
      limit?: number;
    } = {},
  ): Promise {
    try {
      const response = await apiClient.get('/live/contexts', { params });
      return { data: response.data, error: null };
    } catch (error) {
      return handleApiError(error, 'Failed to get live contexts');
    }
  }

  /**
   * Process a live message and get AI response
   */
  async processMessage(data: { message: string; contextId?: string; processId?: string; eventId?: string; metadata?: Record }): Promise {
    try {
      const response = await apiClient.post('/live/message', data);
      return { data: response.data, error: null };
    } catch (error) {
      return handleApiError(error, 'Failed to process message');
    }
  }

  /**
   * Perform an operation on a process, step, or substep
   */
  async performOperation(data: LiveOperation): Promise {
    try {
      const response = await apiClient.post('/live/operation', data);
      return { data: response.data, error: null };
    } catch (error) {
      return handleApiError(error, 'Failed to perform operation');
    }
  }

  /**
   * Get context information about a process for use in live sessions
   */
  async getProcessContext(processId: string): Promise {
    try {
      const response = await apiClient.get(`/live/process-context/${processId}`);
      return { data: response.data, error: null };
    } catch (error) {
      return handleApiError(error, 'Failed to get process context');
    }
  }
}

// Export a singleton instance
export const liveService = new LiveService();

export default liveService;
