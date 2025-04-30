/**
 * Event service for handling event-related operations
 * Implements a clean, maintainable API for calendar and event management
 */

import { EventParticipantSchema, EventSchema, StatusLogSchema, StepSchema, SubStepSchema } from '@/app/types/schema';
import { ApiClient, ApiResult, buildParams } from './api';

/**
 * Type for event metadata
 */
type EventMetadata = Record;

/**
 * Interface for creating a new event
 */
export interface CreateEventData {
  title: string;
  description?: string;
  startTime: string; // ISO date-time string
  endTime: string; // ISO date-time string
  // Legacy fields kept for backwards compatibility
  date?: string; // ISO date string
  time?: string;
  duration?: string;
  status?: string; // 'pending', 'confirmed', 'cancelled', etc.
  complexity?: number;
  color?: string;
  location?: string;
  processId?: string; // Process ID to use for this event
  templateProcessId?: string; // Template process ID to create an instance from
  topics?: string[]; // Array of topic IDs
  participantIds?: string[]; // Array of user IDs to invite
  metadata?: EventMetadata;
}

/**
 * Interface for updating an event
 */
export interface UpdateEventData {
  title?: string;
  description?: string;
  startTime?: string; // ISO date-time string
  endTime?: string; // ISO date-time string
  // Legacy fields kept for backwards compatibility
  date?: string;
  time?: string;
  duration?: string;
  status?: string;
  complexity?: number;
  color?: string;
  location?: string;
  recordingUrl?: string;
  processId?: string;
  topics?: string[];
  metadata?: EventMetadata;
}

/**
 * Options for event filtering and pagination
 */
export interface EventFilterOptions {
  processId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  skip?: number;
  limit?: number;
}

/**
 * Interface for creating a new step
 */
export interface CreateStepData {
  content: string;
  completed?: boolean;
  order: number;
  dueDate?: string;
  subSteps?: CreateSubStepData[];
}

/**
 * Interface for updating a step
 */
export interface UpdateStepData {
  content?: string;
  completed?: boolean;
  completedAt?: string | null; // ISO date when completed, null when uncompleted
  order?: number;
  dueDate?: string;
}

/**
 * Interface for creating a new sub-step
 */
export interface CreateSubStepData {
  content: string;
  completed?: boolean;
  order: number;
}

/**
 * Interface for updating a sub-step
 */
export interface UpdateSubStepData {
  content?: string;
  completed?: boolean;
  completedAt?: string | null; // ISO date when completed, null when uncompleted
  order?: number;
}

/**
 * Interface for creating a new participant
 */
export interface CreateParticipantData {
  userId: string;
  role?: string;
  status?: string;
}

/**
 * Service for event-related operations
 */
export class EventService {
  /**
   * EVENT MANAGEMENT
   */

  /**
   * Create a new event
   * @param eventData - Event data to create
   */
  static async createEvent(eventData: CreateEventData): Promise {
    return ApiClient.post<EventSchema>('/events', eventData);
  }

  /**
   * Get events with optional filtering
   * @param options - Filter and pagination options
   */
  static async getEvents(options: EventFilterOptions = {}): Promise {
    const { processId, status, startDate, endDate, skip = 0, limit = 100 } = options;

    const params = buildParams({
      processId,
      status,
      startDate,
      endDate,
      skip,
      limit,
    });

    return ApiClient.get<EventSchema[]>('/events', { params });
  }

  /**
   * Get events for calendar view
   * @param startDate - Start date in ISO format (YYYY-MM-DD)
   * @param endDate - End date in ISO format (YYYY-MM-DD)
   */
  static async getCalendarEvents(startDate: string, endDate: string): Promise {
    try {
      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return {
          error: 'Invalid date format - must be YYYY-MM-DD',
          status: 400,
        };
      }

      const params = buildParams({
        startDate,
        endDate,
      });

      return ApiClient.get<EventSchema[]>('/calendar/events', { params });
    } catch (error) {
      return {
        error: 'Error fetching calendar events',
        status: 500,
      };
    }
  }

  /**
   * Debug calendar events - useful for troubleshooting
   * @param startDate - Start date in ISO format (YYYY-MM-DD)
   * @param endDate - End date in ISO format (YYYY-MM-DD)
   */
  static async debugCalendarEvents(startDate: string, endDate: string): Promise {
    const params = buildParams({
      startDate,
      endDate,
    });

    return ApiClient.get<any>('/calendar/events/debug', { params });
  }

  /**
   * Get an event by ID
   * @param eventId - Event ID
   */
  static async getEventById(eventId: string): Promise {
    return ApiClient.get<EventSchema>(`/events/${eventId}`);
  }

  /**
   * Update an event
   * @param eventId - Event ID
   * @param updateData - Event data to update
   */
  static async updateEvent(eventId: string, updateData: UpdateEventData): Promise {
    return ApiClient.put<EventSchema>(`/events/${eventId}`, updateData);
  }

  /**
   * Delete an event
   * @param eventId - Event ID
   */
  static async deleteEvent(eventId: string): Promise {
    return ApiClient.delete<void>(`/events/${eventId}`);
  }

  /**
   * PARTICIPANT MANAGEMENT
   */

  /**
   * Add a participant to an event
   * @param eventId - Event ID
   * @param participantData - Participant data to add
   */
  static async addParticipant(eventId: string, participantData: CreateParticipantData): Promise {
    return ApiClient.post<EventParticipantSchema>(`/events/${eventId}/participants`, participantData);
  }

  /**
   * Get participants of an event
   * @param eventId - Event ID
   */
  static async getParticipants(eventId: string): Promise {
    return ApiClient.get<EventParticipantSchema[]>(`/events/${eventId}/participants`);
  }

  /**
   * STEP MANAGEMENT
   */

  /**
   * Create a step for an event
   * @param eventId - Event ID
   * @param stepData - Step data to create
   */
  static async createStep(eventId: string, stepData: CreateStepData): Promise {
    try {
      // Get the event to find its linked process
      const eventResult = await ApiClient.get<EventSchema>(`/events/${eventId}`);

      if (eventResult.error) {
        return eventResult;
      }

      // Use the process service to create a step in the linked process
      const processId = eventResult.data.processId;
      const processService = (await import('./processService')).ProcessService;

      // Convert event step to process step format
      const processStepData = {
        ...stepData,
        processId: processId,
      };

      return processService.createStep(processId, processStepData);
    } catch (error) {
      return { error: 'Failed to create event step', status: 500 };
    }
  }

  /**
   * Update a step
   * @param eventId - Event ID
   * @param stepId - Step ID
   * @param updateData - Step data to update
   */
  static async updateStep(eventId: string, stepId: string, updateData: UpdateStepData): Promise {
    try {
      // We don't need the event since we have the stepId which can be updated directly
      const processService = (await import('./processService')).ProcessService;
      return processService.updateStep(stepId, updateData);
    } catch (error) {
      return { error: 'Failed to update event step', status: 500 };
    }
  }

  /**
   * Delete a step
   * @param eventId - Event ID
   * @param stepId - Step ID
   */
  static async deleteStep(eventId: string, stepId: string): Promise {
    // Get the event to find its process
    const eventResult = await ApiClient.get<EventSchema>(`/events/${eventId}`);

    if (eventResult.error) {
      return eventResult;
    }

    // Use the process service to delete the step
    const processService = (await import('./processService')).ProcessService;
    return processService.deleteStep(stepId);
  }

  /**
   * Get all steps for an event
   * IMPORTANT: This follows the architecture: event -> process -> steps
   * It retrieves steps from the event's associated process whenever possible
   * @param eventId - Event ID
   */
  static async getEventSteps(eventId: string): Promise {
    try {
      // Get the event to find its linked process
      const eventResult = await ApiClient.get<EventSchema>(`/events/${eventId}`);

      if (eventResult.error) {
        return eventResult;
      }

      // Use the process service to get steps from the linked process
      const processId = eventResult.data.processId;

      // If processId is null or undefined, return an empty steps array
      if (!processId) {
        return {
          data: [],
          status: 200,
        };
      }

      const processService = (await import('./processService')).ProcessService;
      return processService.getProcessSteps(processId);
    } catch (error) {
      return { error: 'Failed to get event steps', status: 500 };
    }
  }

  /**
   * SUB-STEP MANAGEMENT
   */

  /**
   * Create a sub-step for a step
   * @param eventId - Event ID
   * @param stepId - Step ID
   * @param subStepData - Sub-step data to create
   */
  static async createSubStep(eventId: string, stepId: string, subStepData: CreateSubStepData): Promise {
    // Use the process service to create the substep
    const processService = (await import('./processService')).ProcessService;
    return processService.createSubStep(stepId, subStepData);
  }

  /**
   * Update a sub-step
   * @param eventId - Event ID
   * @param stepId - Step ID
   * @param subStepId - Sub-step ID
   * @param updateData - Sub-step data to update
   */
  static async updateSubStep(eventId: string, stepId: string, subStepId: string, updateData: UpdateSubStepData): Promise {
    // Use the process service to update the substep
    const processService = (await import('./processService')).ProcessService;
    return processService.updateSubStep(subStepId, updateData);
  }

  /**
   * Batch update multiple sub-steps at once
   * @param eventId - Event ID
   * @param updates - Array of sub-step updates, each containing id, step_id, and fields to update
   */
  static async batchUpdateSubSteps(eventId: string, updates: Array): Promise {
    // Use the process service to batch update the substeps
    const processService = (await import('./processService')).ProcessService;
    return processService.batchUpdateSubSteps(updates);
  }

  /**
   * Delete a sub-step
   * @param eventId - Event ID
   * @param stepId - Step ID
   * @param subStepId - Sub-step ID
   */
  static async deleteSubStep(eventId: string, stepId: string, subStepId: string): Promise {
    // Use the process service to delete the substep
    const processService = (await import('./processService')).ProcessService;
    return processService.deleteSubStep(subStepId);
  }

  /**
   * EVENT DATA RETRIEVAL
   */

  // getEventList method has been removed - use getEventSteps instead

  /**
   * Get status logs for an event
   * @param eventId - Event ID
   */
  static async getStatusLogs(eventId: string): Promise {
    return ApiClient.get<StatusLogSchema[]>(`/events/${eventId}/status-logs`);
  }
}

/**
 * Calendar-specific service for the calendar view
 * Provides advanced caching and date range management
 */
export class CalendarService {
  // In-memory cache for calendar events
  private static eventCache: {
    [key: string]: {
      timestamp: number;
      data: EventSchema[];
    };
  } = {};

  /**
   * Get calendar events for a date range with caching and chunking support
   * @param startDate - Start date in ISO format (YYYY-MM-DD)
   * @param endDate - End date in ISO format (YYYY-MM-DD)
   */
  static async getCalendarEvents(startDate: string, endDate: string): Promise {
    try {
      const cacheKey = `${startDate}-${endDate}`;

      // Check cache first (valid for 5 minutes)
      const now = Date.now();
      const cachedData = this.eventCache[cacheKey];
      if (cachedData && now - cachedData.timestamp < 5 * 60 * 1000) {
        return {
          data: cachedData.data,
          status: 200,
          fromCache: true,
        };
      }

      // Check the date range - backend has a limit of 62 days
      const start = new Date(startDate);
      const end = new Date(endDate);
      const dateDifferenceInDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 3600 * 24));

      // If the range is more than 60 days (being safe), split into multiple requests
      if (dateDifferenceInDays > 60) {
        // Create chunks of 60 days
        const allEvents: EventSchema[] = [];
        let currentStart = new Date(start);
        let chunkCount = 0;

        while (currentStart < end) {
          // Calculate chunk end date (current start + 59 days)
          let chunkEnd = new Date(currentStart);
          chunkEnd.setDate(chunkEnd.getDate() + 59);

          // If chunk end is after the overall end date, use the overall end date
          if (chunkEnd > end) {
            chunkEnd = end;
          }

          // Format dates for API request
          const chunkStartStr = currentStart.toISOString().split('T')[0];
          const chunkEndStr = chunkEnd.toISOString().split('T')[0];
          const chunkCacheKey = `${chunkStartStr}-${chunkEndStr}`;

          // Check if this chunk is cached
          const chunkCache = this.eventCache[chunkCacheKey];
          if (chunkCache && now - chunkCache.timestamp < 5 * 60 * 1000) {
            allEvents.push(...chunkCache.data);
          } else {
            chunkCount++;

            // Make request for this chunk
            const params = buildParams({
              startDate: chunkStartStr,
              endDate: chunkEndStr,
            });

            // Call the API directly
            const chunkResult = await ApiClient.get<EventSchema[]>('/calendar/events', { params });

            if (chunkResult.error) {
            } else if (chunkResult.data && Array.isArray(chunkResult.data)) {
              // Add events from this chunk to our collection
              allEvents.push(...chunkResult.data);

              // Cache this chunk
              this.eventCache[chunkCacheKey] = {
                timestamp: now,
                data: chunkResult.data,
              };
            }
          }

          // Move to next chunk
          currentStart = new Date(chunkEnd);
          currentStart.setDate(currentStart.getDate() + 1);
        }

        // Cache the combined result
        this.eventCache[cacheKey] = {
          timestamp: now,
          data: allEvents,
        };

        // Return combined results
        return {
          data: allEvents,
          status: 200,
        };
      }

      // For smaller date ranges, make a single request

      const params = buildParams({
        startDate,
        endDate,
      });

      const result = await ApiClient.get<EventSchema[]>('/calendar/events', { params });

      if (result.error) {
        return {
          data: [],
          status: 200,
        };
      }

      // Cache the result
      if (result.data) {
        this.eventCache[cacheKey] = {
          timestamp: now,
          data: result.data,
        };
      }

      return result;
    } catch (error) {
      return {
        data: [],
        status: 200,
      };
    }
  }
}
