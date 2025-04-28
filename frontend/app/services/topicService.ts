/**
 * Topic service for handling topic-related operations
 * This service uses Axios for API requests
 */

import { TopicSchema } from '@/app/types/schema';
import { ApiClient, ApiResult } from './api';

/**
 * Interface for creating a new topic
 */
export interface CreateTopicData {
  name: string;
  category?: string;
  color?: string;
}

/**
 * Interface for updating a topic
 */
export interface UpdateTopicData {
  name?: string;
  category?: string;
  color?: string;
}

/**
 * Service for topic-related operations
 */
export class TopicService {
  /**
   * Create a new topic
   * @param topicData - Topic data to create
   * @returns Promise with API result containing created topic data
   */
  static async createTopic(topicData: CreateTopicData): Promise {
    return ApiClient.post<TopicSchema>('/topics', topicData);
  }

  /**
   * Get topics with optional filtering
   * @param category - Filter by category (optional)
   * @param skip - Number of topics to skip (pagination, default: 0)
   * @param limit - Maximum number of topics to return (default: 100)
   * @returns Promise with API result containing topics array
   */
  static async getTopics(category?: string, skip: number = 0, limit: number = 100): Promise {
    // Build query parameters using Axios params object
    const params: Record = {};
    if (category) params.category = category;
    if (skip) params.skip = skip;
    if (limit) params.limit = limit;

    return ApiClient.get<TopicSchema[]>('/topics', { params });
  }

  /**
   * Get a topic by ID
   * @param topicId - Topic ID
   * @returns Promise with API result containing topic data
   */
  static async getTopicById(topicId: string): Promise {
    return ApiClient.get<TopicSchema>(`/topics/${topicId}`);
  }

  /**
   * Update a topic
   * @param topicId - Topic ID
   * @param updateData - Topic data to update
   * @returns Promise with API result containing updated topic data
   */
  static async updateTopic(topicId: string, updateData: UpdateTopicData): Promise {
    return ApiClient.put<TopicSchema>(`/topics/${topicId}`, updateData);
  }

  /**
   * Delete a topic
   * @param topicId - Topic ID
   * @returns Promise with API result
   */
  static async deleteTopic(topicId: string): Promise {
    return ApiClient.delete<void>(`/topics/${topicId}`);
  }

  /**
   * Group topics by category
   * @param topics - Array of topics to group
   * @returns Object with category keys and arrays of topics as values
   */
  static groupByCategory(topics: TopicSchema[]): Record {
    const grouped: Record = {};

    topics.forEach((topic) => {
      const category = topic.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(topic);
    });

    return grouped;
  }
}
