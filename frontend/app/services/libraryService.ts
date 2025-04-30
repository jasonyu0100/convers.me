/**
 * Library service for handling room and library-related operations
 * This service uses Axios for API requests
 */

import { ApiClient, ApiResult } from './api';
import { TopicSchema } from '../types/schema';
import { Collection, LibraryProcess, ProcessDirectory, Category } from '../(routes)/library/types';
import { LIBRARY_ROUTES } from '../(routes)/library/utils/libraryRoutes';
import logger from '../lib/logger';

/**
 * Interface for a room/event in the library
 */
export interface RoomSchema {
  id: string;
  title: string;
  description?: string;
  status?: string;
  date?: string;
  time?: string;
  duration?: string;
  complexity?: number;
  color?: string;
  location?: string;
  is_recurring?: boolean;
  recording_url?: string;
  image_url?: string;
  tags?: string[];
  topic_ids?: string[];
  created_by_id?: string;
  createdById?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  room_metadata?: Record;
}

/**
 * Interface for Topic schema from API
 */
export interface TopicSchema {
  id: string;
  name: string;
  category?: string;
  color?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

/**
 * Interface for creating a new room/event
 */
export interface CreateRoomData {
  title: string;
  description?: string;
  status?: string;
  date?: string;
  time?: string;
  duration?: string;
  complexity?: number;
  color?: string;
  location?: string;
  is_recurring?: boolean;
  image_url?: string;
  tags?: string[];
  topic_ids?: string[];
  room_metadata?: Record;
}

/**
 * Interface for updating a room/event
 */
export interface UpdateRoomData {
  title?: string;
  description?: string;
  status?: string;
  date?: string;
  time?: string;
  duration?: string;
  complexity?: number;
  color?: string;
  location?: string;
  is_recurring?: boolean;
  image_url?: string;
  tags?: string[];
  topic_ids?: string[];
  room_metadata?: Record;
}

/**
 * Service for library-related operations
 */
export class LibraryService {
  /**
   * Get rooms with optional filtering
   * @param topic_ids - Filter by topic IDs (optional)
   * @param tags - Filter by tags (optional)
   * @param status - Filter by status (optional)
   * @param search - Search query (optional)
   * @param skip - Number of rooms to skip (pagination, default: 0)
   * @param limit - Maximum number of rooms to return (default: 100)
   * @returns Promise with API result containing rooms array
   */
  static async getRooms(topic_ids?: string[], tags?: string[], status?: string, search?: string, skip: number = 0, limit: number = 100): Promise {
    // Build query parameters
    const params: Record = {};

    if (topic_ids && topic_ids.length > 0) {
      params.topic_id = topic_ids;
    }

    if (tags && tags.length > 0) {
      params.tag = tags;
    }

    if (status) params.status = status;
    if (search) params.search = search;
    if (skip) params.skip = skip;
    if (limit) params.limit = limit;

    return ApiClient.get<RoomSchema[]>('/rooms', { params });
  }

  /**
   * Get a room by ID
   * @param roomId - Room ID
   * @returns Promise with API result containing room data
   */
  static async getRoomById(roomId: string): Promise {
    return ApiClient.get<RoomSchema>(`/rooms/${roomId}`);
  }

  /**
   * Create a new room
   * @param roomData - Room data to create
   * @returns Promise with API result containing created room data
   */
  static async createRoom(roomData: CreateRoomData): Promise {
    return ApiClient.post<RoomSchema>('/rooms', roomData);
  }

  /**
   * Update a room
   * @param roomId - Room ID
   * @param updateData - Room data to update
   * @returns Promise with API result containing updated room data
   */
  static async updateRoom(roomId: string, updateData: UpdateRoomData): Promise {
    return ApiClient.put<RoomSchema>(`/rooms/${roomId}`, updateData);
  }

  /**
   * Delete a room
   * @param roomId - Room ID
   * @returns Promise with API result
   */
  static async deleteRoom(roomId: string): Promise {
    return ApiClient.delete<void>(`/rooms/${roomId}`);
  }

  /**
   * Get all library rooms with topics for the user
   * This is a convenience method for the library view
   * @returns Promise with API result containing rooms and topics
   */
  static async getLibraryData(): Promise {
    return ApiClient.get<{ rooms: RoomSchema[]; topics: TopicSchema[] }>('/library');
  }

  /**
   * Get all topics
   * @returns Promise with API result containing topics array
   */
  static async getTopics(): Promise {
    return ApiClient.get<TopicSchema[]>('/topics');
  }

  /**
   * Get events for library by topic
   * @param topicIds - Array of topic IDs to filter by
   * @returns Promise with API result containing rooms/events
   */
  static async getEventsByTopics(topicIds: string[]): Promise {
    // Build query parameters
    const params: Record = {};

    if (topicIds && topicIds.length > 0) {
      params.topic_id = topicIds;
    }

    return ApiClient.get<RoomSchema[]>('/events', { params });
  }

  /**
   * Get events for the current week
   * @returns Promise with API result containing events for the current week
   */
  static async getEventsForCurrentWeek(): Promise {
    // Get current date
    const today = new Date();
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay();

    // Set to the beginning of the current week (Sunday)
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    // End of week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Format dates as ISO strings (YYYY-MM-DD)
    const startDate = startOfWeek.toISOString().split('T')[0];
    const endDate = endOfWeek.toISOString().split('T')[0];

    // Build query parameters using Axios params object
    const params: Record = {
      start_date: startDate,
      end_date: endDate,
    };

    return ApiClient.get<RoomSchema[]>('/events', { params });
  }

  /**
   * Get all collections available in the library
   * @param category - Optional category to filter by
   * @returns Promise with API result containing collections data
   */
  static async getCollections(category?: string): Promise {
    const params: Record = {};
    if (category && category !== 'all') {
      params.category = category;
    }
    try {
      return await ApiClient.get<Collection[]>(LIBRARY_ROUTES.COLLECTIONS, { params });
    } catch (error) {
      // Log the error with more context
      logger.error('Failed to fetch library collections', {
        category,
        endpoint: LIBRARY_ROUTES.COLLECTIONS,
        error,
      });
      // Re-throw to allow component error handling
      throw error;
    }
  }

  /**
   * Get a collection by ID
   * @param collectionId - Collection ID
   * @returns Promise with API result containing collection data
   */
  static async getCollectionById(collectionId: string): Promise {
    try {
      return await ApiClient.get<Collection>(LIBRARY_ROUTES.COLLECTION(collectionId));
    } catch (error) {
      // Log detailed error information
      logger.error('Failed to fetch collection by ID', {
        collectionId,
        endpoint: LIBRARY_ROUTES.COLLECTION(collectionId),
        error,
      });
      // Re-throw to allow component error handling
      throw error;
    }
  }

  /**
   * Create a new collection
   * @param collection - Collection data to create
   * @returns Promise with API result containing created collection data
   */
  static async createCollection(collection: Collection): Promise {
    return ApiClient.post<Collection>(LIBRARY_ROUTES.COLLECTIONS, collection);
  }

  /**
   * Update a collection
   * @param collectionId - Collection ID
   * @param updateData - Collection data to update
   * @returns Promise with API result containing updated collection data
   */
  static async updateCollection(collectionId: string, updateData: Partial): Promise {
    return ApiClient.put<Collection>(LIBRARY_ROUTES.COLLECTION(collectionId), updateData);
  }

  /**
   * Delete a collection
   * @param collectionId - Collection ID
   * @returns Promise with API result
   */
  static async deleteCollection(collectionId: string): Promise {
    return ApiClient.delete<void>(LIBRARY_ROUTES.COLLECTION(collectionId));
  }

  /**
   * Save (duplicate) a collection to the user's library
   * This creates a complete copy including all directories, processes, steps and substeps
   * @param collectionId - Collection ID
   * @returns Promise with API result containing the duplicated collection
   */
  static async saveCollection(collectionId: string): Promise {
    return ApiClient.post<Collection>(`/library/collections/${collectionId}/save`);
  }

  /**
   * Initialize site-wide collections from mock data
   * This is typically used by administrators to set up the initial library
   * @returns Promise with API result
   */
  static async initializeCollections(): Promise {
    return ApiClient.post<{ success: boolean; message: string }>(LIBRARY_ROUTES.INITIALIZE);
  }

  /**
   * Get all directories in the library
   * @returns Promise with API result containing directories data
   */
  static async getDirectories(): Promise {
    return ApiClient.get<ProcessDirectory[]>(LIBRARY_ROUTES.DIRECTORIES);
  }

  /**
   * Get directories associated with a specific collection
   * @param collectionId - Collection ID to filter directories by
   * @returns Promise with API result containing directories data
   */
  static async getDirectoriesByCollectionId(collectionId: string): Promise {
    try {
      return await ApiClient.get<ProcessDirectory[]>(`${LIBRARY_ROUTES.COLLECTIONS}/${collectionId}/directories`);
    } catch (error) {
      // Log detailed error information
      logger.error('Failed to fetch directories by collection', {
        collectionId,
        error,
      });
      // Re-throw to allow component error handling
      throw error;
    }
  }

  /**
   * Get all processes in the library
   * @param category - Optional category to filter by
   * @returns Promise with API result containing processes data
   */
  static async getProcesses(category?: string): Promise {
    if (category && category !== 'all') {
      return ApiClient.get<LibraryProcess[]>(LIBRARY_ROUTES.PROCESS_BY_CATEGORY(category));
    }
    return ApiClient.get<LibraryProcess[]>(LIBRARY_ROUTES.PROCESSES);
  }
}
