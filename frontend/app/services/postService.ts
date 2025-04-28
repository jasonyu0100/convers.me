/**
 * Post service for handling post-related operations
 * This service uses Axios for API requests
 */

import { MediaSchema, PostSchema } from '@/app/types/schema';
import type { components } from '@/app/types/api';
import { ApiClient, ApiResult, axiosInstance } from './api';
import { handleApiError } from './api';

/**
 * Enhanced post response with author information and media
 */
export interface EnhancedPostResponse extends PostSchema {
  authorId?: string;
  authorName?: string;
  authorHandle?: string;
  authorImage?: string;
  authorEmail?: string;
  authorBio?: string;
  author?: {
    id: string;
    name: string;
    handle: string;
    profileImage?: string;
    email?: string;
    bio?: string;
  };
  media?: MediaSchema;
}

/**
 * Interface for creating a new post
 */
export interface CreatePostData {
  content: string;
  visibility?: 'public' | 'private' | 'team';
  eventId?: string;
}

/**
 * Interface for updating a post
 */
export interface UpdatePostData {
  content?: string;
  visibility?: 'public' | 'private' | 'team';
}

/**
 * Interface for creating media for a post
 */
export interface CreateMediaData {
  type: string; // 'image', 'video', 'audio', 'document', etc.
  title?: string;
  url: string;
  duration?: string;
  aspectRatio?: string;
  fileSize?: number;
  mimeType?: string;
}

/**
 * Service for post-related operations
 */
export class PostService {
  /**
   * Create a new post
   * @param postData - Post data to create
   * @returns Promise with API result containing created post data
   */
  static async createPost(postData: CreatePostData): Promise {
    // The issue is complex:
    // 1. The Pydantic model defines: eventId: Optional[str] = Field(default=None, alias="event_id")
    // 2. The API endpoint tries to access: post.event_id (which doesn't exist since it should use post.eventId)
    // 3. We need to work around this backend bug without changing the backend code

    // Instead of using the ApiClient with all its processing, we'll directly use axios
    // to have complete control over the request format
    try {
      // Create the raw request data in the exact format needed
      const rawRequestData = {
        content: postData.content,
        visibility: postData.visibility || null,
        // This is the key - we need to send both formats to maximize compatibility
        eventId: postData.eventId || null, // This is the correct field according to schema
        event_id: postData.eventId || null, // This is what the backend code is looking for
      };

      // Use axiosInstance directly to send the request
      // This bypasses ApiClient's automatic conversions
      const response = await axiosInstance({
        method: 'POST',
        url: '/posts',
        data: rawRequestData,
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Info': 'Direct axios request for post creation',
        },
      });

      // Process the response
      return {
        data: response.data,
        status: response.status,
      };
    } catch (error) {
      return handleApiError(error, '/posts');
    }
  }

  /**
   * Get posts with optional filtering
   * @param eventId - Filter by event ID (optional)
   * @param authorId - Filter by author ID (optional)
   * @param skip - Number of posts to skip (pagination, default: 0)
   * @param limit - Maximum number of posts to return (default: 20)
   * @returns Promise with API result containing enhanced posts array
   */
  static async getPosts(eventId?: string, authorId?: string, skip: number = 0, limit: number = 20): Promise {
    try {
      // Build query parameters using Axios params object
      const params: Record = {};
      if (eventId) params.event_id = eventId;
      if (authorId) params.author_id = authorId;
      if (skip) params.skip = skip;
      if (limit) params.limit = limit;

      const result = await ApiClient.get<EnhancedPostResponse[]>('/posts', { params });

      if (result.error) {
        console.warn(`Error fetching posts: ${result.error}`);
        return {
          data: [],
          status: result.status || 500,
          error: result.error,
        };
      }

      if (result.data && result.data.length === 0) {
        // This is normal behavior for empty feeds, no need to log
        return {
          data: [],
          status: 200,
        };
      }

      return result;
    } catch (error) {
      console.error('Error in PostService.getPosts:', error);
      return {
        data: [],
        status: 500,
        error: 'An error occurred while fetching posts',
      };
    }
  }

  /**
   * Get a post by ID
   * @param postId - Post ID
   * @returns Promise with API result containing enhanced post data
   */
  static async getPostById(postId: string): Promise {
    return ApiClient.get<EnhancedPostResponse>(`/posts/${postId}`);
  }

  /**
   * Update a post
   * @param postId - Post ID
   * @param updateData - Post data to update
   * @returns Promise with API result containing updated post data
   */
  static async updatePost(postId: string, updateData: UpdatePostData): Promise {
    return ApiClient.put<PostSchema>(`/posts/${postId}`, updateData);
  }

  /**
   * Delete a post
   * @param postId - Post ID
   * @returns Promise with API result
   */
  static async deletePost(postId: string): Promise {
    return ApiClient.delete<void>(`/posts/${postId}`);
  }

  /**
   * Add media to a post
   * @param postId - Post ID
   * @param mediaData - Media data to add
   * @returns Promise with API result containing created media data
   */
  static async addMediaToPost(postId: string, mediaData: CreateMediaData): Promise {
    return ApiClient.post<MediaSchema>(`/posts/${postId}/media`, mediaData);
  }

  /**
   * Get all media for a post
   * @param postId - Post ID
   * @returns Promise with API result containing media array
   */
  static async getPostMedia(postId: string): Promise {
    return ApiClient.get<MediaSchema[]>(`/posts/${postId}/media`);
  }

  /**
   * Upload a file and attach it to a post as media
   * @param postId - Post ID
   * @param file - File to upload
   * @param title - Optional title for the media
   * @returns Promise with API result containing created media data
   */
  static async uploadFile(postId: string, file: File, title?: string): Promise {
    // First upload the file
    const formData = new FormData();
    formData.append('file', file);

    const uploadResult = await ApiClient.uploadFile<{ url: string }>('/media/upload', formData);

    if (uploadResult.error) {
      return {
        error: uploadResult.error,
        status: uploadResult.status,
      };
    }

    // Then create the media with the URL
    const mediaType = file.type.split('/')[0]; // e.g., 'image', 'video', 'audio'

    const mediaData: CreateMediaData = {
      type: mediaType,
      title: title || file.name,
      url: uploadResult.data.url,
      fileSize: file.size,
      mimeType: file.type,
    };

    return this.addMediaToPost(postId, mediaData);
  }
}
