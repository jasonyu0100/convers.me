/**
 * Profile service for handling profile-related API requests
 * This service uses Axios for API requests
 */

import { ApiClient, ApiResult } from './api';
import { TimelineYear } from '../types/profile';
import { ProfileUser, ProfileReport } from '../types/profile';
import { User } from '../types/shared';

/**
 * Get the timeline data for the current user's profile
 * @deprecated Use ProgressService.getTimeline() instead
 */
export async function getProfileTimeline(): Promise {
  // Switch from deprecated insights/timeline to progress/timeline
  return ApiClient.get<TimelineYear[]>('progress/timeline');
}

/**
 * Get the current user's profile data
 */
export async function getUserProfile(): Promise {
  return ApiClient.get<User>('users/me');
}

/**
 * Get profile data for a specific user by ID
 */
export async function getUserProfileById(userId: string): Promise {
  return ApiClient.get<User>(`users/${userId}`);
}

/**
 * Get profile data for a user by handle
 */
export async function getUserProfileByHandle(handle: string): Promise {
  return ApiClient.get<User>(`users/handle/${handle}`);
}

/**
 * Get reports for the current user's profile with optional filtering
 * @param year Optional year filter
 * @param quarter Optional quarter filter
 * @param week Optional week filter
 * @param reportType Optional report type filter
 */
export async function getProfileReports(year?: number, quarter?: number, week?: number, reportType?: string): Promise {
  // Build query parameters if provided
  const params = new URLSearchParams();
  if (year !== undefined) params.append('year', year.toString());
  if (quarter !== undefined) params.append('quarter', quarter.toString());
  if (week !== undefined) params.append('week', week.toString());
  if (reportType) params.append('report_type', reportType);

  const queryString = params.toString();

  // Use the dedicated reports/me endpoint with optional filters
  return ApiClient.get<ProfileReport[]>(`reports/me${queryString ? '?' + queryString : ''}`);
}

/**
 * Update the current user's profile
 */
export async function updateUserProfile(profileData: Partial): Promise {
  return ApiClient.put<User>('users/me', profileData);
}

/**
 * Get user posts/activities - use posts/me endpoint with optional pagination and date filtering
 * @param skip Optional pagination skip
 * @param limit Optional pagination limit
 * @param startDate Optional start date filter (ISO format)
 * @param endDate Optional end date filter (ISO format)
 */
export async function getUserPosts(skip: number = 0, limit: number = 20, startDate?: string, endDate?: string): Promise {
  // Build query parameters for pagination and date filtering
  const params = new URLSearchParams();
  if (skip > 0) params.append('skip', skip.toString());
  if (limit !== 20) params.append('limit', limit.toString());
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);

  const queryString = params.toString();

  // Use the posts/me endpoint with optional pagination and date filtering
  const response = await ApiClient.get<any[]>(`posts/me${queryString ? '?' + queryString : ''}`);

  // Transform if needed
  if (response.data) {
    // Ensure all posts have consistent keys for the UI
    response.data = response.data.map((post) => ({
      ...post,
      // Ensure we have both snake_case and camelCase versions for compatibility
      created_at: post.created_at || post.createdAt,
      createdAt: post.createdAt || post.created_at,
      // Add consistent media handling
      media: post.media || null,
      mediaType: post.mediaType || (post.media && post.media.type) || null,
      mediaUrl: post.mediaUrl || (post.media && post.media.url) || null,
    }));
  }

  return response;
}

/**
 * Get user events - use events/me endpoint with optional filtering
 * @param status Optional status filter
 * @param startDate Optional start date filter (ISO format)
 * @param endDate Optional end date filter (ISO format)
 * @param skip Optional pagination skip
 * @param limit Optional pagination limit
 */
export async function getUserEvents(status?: string, startDate?: string, endDate?: string, skip: number = 0, limit: number = 100): Promise {
  // Build query parameters
  const params = new URLSearchParams();
  if (status) params.append('status', status);
  if (startDate) params.append('start_date', startDate);
  if (endDate) params.append('end_date', endDate);
  if (skip > 0) params.append('skip', skip.toString());
  if (limit !== 100) params.append('limit', limit.toString());

  const queryString = params.toString();

  // Using the events/me endpoint with optional filters
  return ApiClient.get<any[]>(`events/me${queryString ? '?' + queryString : ''}`);
}
