/**
 * Media service for handling media-related operations
 * Updated to use Axios for API requests
 */

import { MediaSchema } from '@/app/types/schema';
import { ApiClient, ApiResult } from './api';

/**
 * Media upload response type
 */
export interface MediaUploadResponse {
  id: string;
  url: string;
  type: string;
  title?: string;
  mime_type?: string;
  file_size?: number;
}

/**
 * Interface for media properties
 */
export interface MediaMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  eventId?: string;
  postId?: string;
  processId?: string;
  userId?: string;
  visibility?: 'public' | 'private' | 'restricted';
}

/**
 * Service for media-related operations
 */
export class MediaService {
  /**
   * Upload a media file to the server
   * @param file - File to upload
   * @param metadata - Optional metadata for the upload
   * @returns Promise with API result containing the upload response
   */
  static async uploadMedia(file: File, metadata?: MediaMetadata): Promise {
    // Create form data for the upload
    const formData = new FormData();
    formData.append('file', file);

    // Add any metadata
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            // Handle arrays like tags
            value.forEach((item) => formData.append(`${key}[]`, item));
          } else {
            formData.append(key, value.toString());
          }
        }
      });
    }

    // Submit the form data to the upload endpoint
    return ApiClient.uploadFile<MediaUploadResponse>('/media/upload', formData);
  }

  /**
   * Get a specific media item by ID
   * @param mediaId - ID of the media to retrieve
   * @returns Promise with API result containing media data
   */
  static async getMediaById(mediaId: string): Promise {
    return ApiClient.get<MediaSchema>(`/media/${mediaId}`);
  }

  /**
   * Delete a media item
   * @param mediaId - ID of the media to delete
   * @returns Promise with API result
   */
  static async deleteMedia(mediaId: string): Promise {
    return ApiClient.delete<{ message: string }>(`/media/${mediaId}`);
  }
}
