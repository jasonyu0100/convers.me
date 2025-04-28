'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { createRouteContext } from '@/app/components/router/createRouteContext';
import { useRouteComponent } from '@/app/components/router/useRouteComponent';
import { MediaService, PostService, ProcessService, UserService } from '@/app/services';
import { getProfileTimeline } from '@/app/services/profileService';
import { MediaUploadResponse } from '@/app/services/mediaService';
import { MediaSchema, PostSchema, ProcessSchema, UserSchema } from '@/app/types/schema';
import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

interface SelectedPeriod {
  year: number;
  quarter?: number;
  week?: number;
  startDate?: string;
  endDate?: string;
}

interface FeedContextType {
  // Data
  currentUser: UserSchema | null;
  feedPosts: PostSchema[];
  processes: ProcessSchema[];
  selectedPeriod: SelectedPeriod | null;

  // State
  isLoadingMore: boolean;
  error: string | null;

  // Actions
  handleCreatePost: (content: string) => Promise;
  handleMediaUpload: (file: File) => Promise;
  handleLoadMorePosts: () => Promise;
  handleEventClick: (eventId: string) => void;
  clearError: () => void;
  setSelectedPeriod: (period: SelectedPeriod) => void;
}

// Create context with common pattern
const { Provider, useRouteContext } = createRouteContext<FeedContextType>('Feed', {
  currentUser: null,
  feedPosts: [],
  processes: [],
  selectedPeriod: null,
  isLoadingMore: false,
  error: null,
  handleCreatePost: async () => {},
  handleMediaUpload: async () => undefined,
  handleLoadMorePosts: async () => {},
  handleEventClick: () => {},
  clearError: () => {},
  setSelectedPeriod: () => {},
});

interface FeedProviderProps {
  children: ReactNode;
}

export function FeedProvider({ children }: FeedProviderProps) {
  const app = useApp();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Use standard route component utilities
  const { error, handleError, clearError } = useRouteComponent();

  // State
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadResponse | null>(null);

  // Get current date for default period
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;

  // Set default selected period
  const [selectedPeriod, setSelectedPeriod] = useState<SelectedPeriod>({
    year: currentYear,
    quarter: currentQuarter,
  });

  // Get current user from app context instead of making a separate API call
  const currentUser = app.currentUser;

  // Fetch timeline data with React Query
  const { data: timelineData = [] } = useQuery({
    queryKey: ['timeline'],
    queryFn: async () => {
      const result = await getProfileTimeline();
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
  });

  // Fetch favorited template processes with React Query
  const { data: processes = [] } = useQuery({
    queryKey: ['favoriteTemplates'],
    queryFn: async () => {
      // Use getTemplates instead of getProcesses to ensure we only get templates
      // and pass favorite=true parameter to filter for favorites
      const result = await ProcessService.getTemplates({
        skip: 0,
        limit: 3,
        favorite: true,
      });
      if (result.error) {
        throw new Error(result.error);
      }
      return result.data || [];
    },
  });

  // Calculate date range for the period
  const getDateRange = () => {
    let startDate: string | undefined;
    let endDate: string | undefined;

    if (selectedPeriod) {
      if (selectedPeriod.startDate && selectedPeriod.endDate) {
        // If explicit dates are provided, use them
        startDate = selectedPeriod.startDate;
        endDate = selectedPeriod.endDate;
      } else if (selectedPeriod.week && selectedPeriod.quarter) {
        // For a specific week within a quarter, find dates from timeline data
        const yearData = timelineData.find((y) => y.year === selectedPeriod.year);
        const quarterData = yearData?.quarters.find((q) => q.quarter === selectedPeriod.quarter);
        const weekData = quarterData?.weeks.find((w) => w.weekNumber === selectedPeriod.week);

        if (weekData) {
          startDate = weekData.startDate;
          endDate = weekData.endDate;
        } else {
          // Fallback to quarter start/end
          const quarterStartMonth = (selectedPeriod.quarter - 1) * 3 + 1;
          startDate = `${selectedPeriod.year}-${String(quarterStartMonth).padStart(2, '0')}-01`;

          // Calculate end date (start of next quarter minus 1 day)
          const nextQuarterMonth = selectedPeriod.quarter < 4 ? quarterStartMonth + 3 : 1;
          const nextQuarterYear = selectedPeriod.quarter < 4 ? selectedPeriod.year : selectedPeriod.year + 1;
          const nextQuarterStart = new Date(nextQuarterYear, nextQuarterMonth - 1, 1);
          const quarterEnd = new Date(nextQuarterStart);
          quarterEnd.setDate(quarterEnd.getDate() - 1);

          endDate = quarterEnd.toISOString().split('T')[0];
        }
      } else if (selectedPeriod.quarter) {
        // For a specific quarter
        const quarterStartMonth = (selectedPeriod.quarter - 1) * 3 + 1;
        startDate = `${selectedPeriod.year}-${String(quarterStartMonth).padStart(2, '0')}-01`;

        // Calculate end date (start of next quarter minus 1 day)
        const nextQuarterMonth = selectedPeriod.quarter < 4 ? quarterStartMonth + 3 : 1;
        const nextQuarterYear = selectedPeriod.quarter < 4 ? selectedPeriod.year : selectedPeriod.year + 1;
        const nextQuarterStart = new Date(nextQuarterYear, nextQuarterMonth - 1, 1);
        const quarterEnd = new Date(nextQuarterStart);
        quarterEnd.setDate(quarterEnd.getDate() - 1);

        endDate = quarterEnd.toISOString().split('T')[0];
      } else {
        // For just a year
        startDate = `${selectedPeriod.year}-01-01`;
        endDate = `${selectedPeriod.year}-12-31`;
      }
    }

    return { startDate, endDate };
  };

  // Fetch posts with useInfiniteQuery
  const postsQuery = useInfiniteQuery({
    queryKey: ['posts', app.currentUser?.id, selectedPeriod],
    queryFn: async ({ pageParam = 0 }) => {
      if (!app.currentUser?.id) {
        return { data: [], nextPage: null };
      }

      const limit = 10;
      const result = await PostService.getPosts(undefined, app.currentUser.id, pageParam, limit);

      if (result.error) {
        throw new Error(result.error);
      }

      const nextPage = result.data?.length === limit ? pageParam + limit : null;

      return {
        data: result.data || [],
        nextPage,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!app.currentUser?.id,
  });

  // Flatten the posts from all pages
  const feedPosts = postsQuery.data?.pages.flatMap((page) => page.data) || [];
  const isLoadingMore = postsQuery.isFetchingNextPage;

  // Media upload mutation
  const uploadMediaMutation = useMutation({
    mutationFn: async (file: File) => {
      const result = await MediaService.uploadMedia(file, {
        title: file.name,
      });

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data) => {
      if (data) {
        setUploadedMedia(data);
      }
    },
    onError: (error) => {
      handleError(error);
    },
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!content.trim() || !app.currentUser) return null;

      // Create post with appropriate data based on whether we have media
      const postResult = await PostService.createPost({
        content,
        visibility: 'public',
      });

      if (postResult.error) {
        throw new Error(postResult.error);
      }

      let newPost = postResult.data as PostSchema;

      // If we have uploaded media, attach it to the post
      if (uploadedMedia && newPost) {
        try {
          // Determine media type from URL
          let mediaType = 'image';
          if (uploadedMedia.type.includes('video')) {
            mediaType = 'video';
          } else if (uploadedMedia.type.includes('audio')) {
            mediaType = 'audio';
          }

          // Attach media to post
          const mediaResult = await PostService.addMediaToPost(newPost.id, {
            type: mediaType as any,
            url: uploadedMedia.url,
            title: uploadedMedia.title,
            file_size: uploadedMedia.file_size,
            mime_type: uploadedMedia.mime_type,
          });

          if (!mediaResult.error) {
            // Fetch the post again to get it with the media
            const updatedPostResult = await PostService.getPostById(newPost.id);
            if (!updatedPostResult.error && updatedPostResult.data) {
              newPost = updatedPostResult.data;
            }
          }
        } catch (mediaError) {
          console.error('Error attaching media to post:', mediaError);
          // We'll still add the post even if media attachment fails
        }
      }

      // Clear uploaded media state
      setUploadedMedia(null);
      return newPost;
    },
    onSuccess: (newPost) => {
      if (newPost) {
        // Invalidate and refetch posts query
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      }
    },
    onError: (error) => {
      handleError(error);
    },
  });

  // Actions
  const handleCreatePost = useCallback(
    async (content: string) => {
      await createPostMutation.mutateAsync(content);
    },
    [createPostMutation],
  );

  const handleMediaUpload = useCallback(
    async (file: File): Promise => {
      try {
        const result = await uploadMediaMutation.mutateAsync(file);
        return result?.url;
      } catch (error) {
        return undefined;
      }
    },
    [uploadMediaMutation],
  );

  const handleLoadMorePosts = useCallback(async () => {
    if (postsQuery.hasNextPage && !postsQuery.isFetchingNextPage) {
      await postsQuery.fetchNextPage();
    }
  }, [postsQuery]);

  const handleEventClick = useCallback(
    (eventId: string) => {
      try {
        app.setMainView(AppRoute.ROOM);
        router.push(`/room?id=${eventId}`);
      } catch (error) {
        handleError(error);
      }
    },
    [app, router, handleError],
  );

  // Handle period selection
  const handleSetSelectedPeriod = useCallback(
    (period: SelectedPeriod) => {
      setSelectedPeriod(period);
      // This will trigger a refetch of posts with the new period
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    [queryClient],
  );

  // Context value
  const value = {
    currentUser: app.currentUser || null,
    feedPosts,
    processes,
    selectedPeriod,
    isLoadingMore,
    error,
    handleCreatePost,
    handleMediaUpload,
    handleLoadMorePosts,
    handleEventClick,
    clearError,
    setSelectedPeriod: handleSetSelectedPeriod,
  };

  return <Provider value={value}>{children}</Provider>;
}

// Export the hook with the standard name
export const useFeed = useRouteContext;
