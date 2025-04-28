/**
 * Library service for handling room and library-related operations
 * This service uses Axios for API requests
 */

import { ApiClient, ApiResult } from './api';
import { TopicSchema } from '../types/schema';

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
}
