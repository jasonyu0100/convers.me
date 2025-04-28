/**
 * Directory service for handling directory-related operations
 * This service uses Axios for API requests
 */

import { ApiClient, ApiResult } from './api';
import { ProcessSchema, DirectorySchema as BaseDirectorySchema } from '@/app/types/schema';

/**
 * Interface for a directory - reexporting from schema for convenience
 */
export interface DirectorySchema extends BaseDirectorySchema {}

/**
 * Interface for directory details including processes and subdirectories
 */
export interface DirectoryDetailSchema extends DirectorySchema {
  processes: ProcessSchema[]; // Processes including steps and substeps
  subdirectories: DirectorySchema[];
}

/**
 * Interface for creating a new directory
 */
export interface CreateDirectoryData {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  metadata?: Record;
}

/**
 * Interface for updating a directory
 */
export interface UpdateDirectoryData {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_id?: string;
  metadata?: Record;
}

/**
 * Service for directory-related operations
 */
export class DirectoryService {
  /**
   * Get directories with optional parent filtering
   * @param parent_id - Filter by parent directory ID (optional)
   * If parent_id is provided, returns subdirectories of that directory.
   * If parent_id is null/undefined, returns top-level directories.
   * @returns Promise with API result containing directories array
   */
  static async getDirectories(parent_id?: string): Promise {
    const params: Record = {};
    if (parent_id) {
      params.parent_id = parent_id;
    }

    return ApiClient.get<DirectorySchema[]>('/directories', { params });
  }

  /**
   * Get a directory by ID with its processes and subdirectories
   * @param directoryId - Directory ID
   * @returns Promise with API result containing directory detail data
   */
  static async getDirectoryById(directoryId: string): Promise {
    return ApiClient.get<DirectoryDetailSchema>(`/directories/${directoryId}`);
  }

  /**
   * Create a new directory
   * @param directoryData - Directory data to create
   * @returns Promise with API result containing created directory data
   */
  static async createDirectory(directoryData: CreateDirectoryData): Promise {
    return ApiClient.post<DirectorySchema>('/directories', directoryData);
  }

  /**
   * Update a directory
   * @param directoryId - Directory ID
   * @param updateData - Directory data to update
   * @returns Promise with API result containing updated directory data
   */
  static async updateDirectory(directoryId: string, updateData: UpdateDirectoryData): Promise {
    return ApiClient.put<DirectorySchema>(`/directories/${directoryId}`, updateData);
  }

  /**
   * Delete a directory
   * @param directoryId - Directory ID
   * @param move_processes - Whether to move contained processes (optional)
   * @param target_directory_id - Target directory ID to move processes to (optional)
   * @returns Promise with API result
   */
  static async deleteDirectory(directoryId: string, move_processes?: boolean, target_directory_id?: string): Promise {
    const params: Record = {};

    if (move_processes !== undefined) {
      params.move_processes = move_processes;
    }

    if (target_directory_id) {
      params.target_directory_id = target_directory_id;
    }

    return ApiClient.delete<void>(`/directories/${directoryId}`, { params });
  }
}
