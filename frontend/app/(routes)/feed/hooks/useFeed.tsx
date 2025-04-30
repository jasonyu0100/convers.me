'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { createRouteContext } from '@/app/components/router/createRouteContext';
import { useRouteComponent } from '@/app/components/router/useRouteComponent';
import { MediaService, PostService, ProcessService } from '@/app/services';
import { MediaUploadResponse } from '@/app/services/mediaService';
import { MediaSchema, PostSchema, ProcessSchema, UserSchema } from '@/app/types/schema';
import { useRouter } from 'next/navigation';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

interface SelectedPeriod {
  year: number;
  quarter?: number;
  month?: number;
  week?: number;
  startDate?: string;
  endDate?: string;
}

interface RoomEvent {
  id: string;
  title: string;
  date: Date;
  status: string;
  type: string;
}

interface FeedContextType {
  // Data
  currentUser: UserSchema | null;
  feedPosts: PostSchema[];
  processes: ProcessSchema[];
  selectedPeriod: SelectedPeriod | null;
  roomEvents: RoomEvent[];
  selectedRoomId: string | null;

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
  setSelectedRoomId: (roomId: string | null) => void;
}

// Create context with common pattern
const { Provider, useRouteContext } = createRouteContext<FeedContextType>('Feed', {
  currentUser: null,
  feedPosts: [],
  processes: [],
  selectedPeriod: null,
  roomEvents: [],
  selectedRoomId: null,
  isLoadingMore: false,
  error: null,
  handleCreatePost: async () => {},
  handleMediaUpload: async () => undefined,
  handleLoadMorePosts: async () => {},
  handleEventClick: () => {},
  clearError: () => {},
  setSelectedPeriod: () => {},
  setSelectedRoomId: () => {},
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

  // Room events state
  const [roomEvents, setRoomEvents] = useState<RoomEvent[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null); // Null means "All Posts" is selected

  // Get current user from app context instead of making a separate API call
  const currentUser = app.currentUser;

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
      } else if (selectedPeriod.month && selectedPeriod.quarter) {
        // For a specific month within a quarter
        // Calculate from month number
        const monthIndex = selectedPeriod.month - 1; // 0-indexed month

        // First day of the month
        startDate = `${selectedPeriod.year}-${String(selectedPeriod.month).padStart(2, '0')}-01`;

        // Last day of the month (first day of next month minus one)
        const lastDay = new Date(selectedPeriod.year, monthIndex + 1, 0);
        endDate = `${selectedPeriod.year}-${String(selectedPeriod.month).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
      } else if (selectedPeriod.week && selectedPeriod.quarter) {
        // For a specific week within a quarter
        // Since we don't have exact week dates without the timeline data,
        // we'll use a rough approximation: a week starts on Monday in the quarter
        const quarterStartMonth = (selectedPeriod.quarter - 1) * 3 + 1;
        const quarterStartDate = new Date(selectedPeriod.year, quarterStartMonth - 1, 1);

        // Find the first Monday in the quarter if the quarter doesn't start on a Monday
        const dayOfWeek = quarterStartDate.getDay();
        const daysToAdd = dayOfWeek === 1 ? 0 : dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
        quarterStartDate.setDate(quarterStartDate.getDate() + daysToAdd);

        // Now add (weekNumber - 1) * 7 days to get to the start of the selected week
        const weekStartDate = new Date(quarterStartDate);
        weekStartDate.setDate(weekStartDate.getDate() + (selectedPeriod.week - 1) * 7);

        // End date is 6 days after start date (a complete week)
        const weekEndDate = new Date(weekStartDate);
        weekEndDate.setDate(weekStartDate.getDate() + 6);

        startDate = weekStartDate.toISOString().split('T')[0];
        endDate = weekEndDate.toISOString().split('T')[0];
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
    queryKey: ['posts', app.currentUser?.id, selectedPeriod, selectedRoomId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!app.currentUser?.id) {
        return { data: [], nextPage: null };
      }

      const limit = 10;

      // Use the new getFeedPosts method if we have a selectedRoomId
      let result;
      if (selectedRoomId) {
        // When a room is selected, use the room-filtered feed posts endpoint
        result = await PostService.getFeedPosts(selectedRoomId, pageParam, limit);
      } else {
        // Otherwise, get posts for the current user
        result = await PostService.getPosts(undefined, app.currentUser.id, pageParam, limit);
      }

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

  // Handle room selection
  const handleSetSelectedRoomId = useCallback(
    (roomId: string | null) => {
      console.log('Setting selected room ID in useFeed:', roomId);
      setSelectedRoomId(roomId);
      // Invalidate and refetch the posts with the new room filter
      queryClient.invalidateQueries({
        queryKey: ['posts', app.currentUser?.id, selectedPeriod, roomId],
      });
    },
    [queryClient, app.currentUser?.id, selectedPeriod],
  );

  // Fetch real room events data
  const { data: calendarEvents = [] } = useQuery({
    queryKey: ['feed-calendar-events'],
    queryFn: async () => {
      // Get today's date
      const today = new Date();

      // Set date range to 7 days before and 7 days after today (15 days total)
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 7);

      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 7);

      // Format dates as YYYY-MM-DD for API
      const startDateString = startDate.toISOString().split('T')[0];
      const endDateString = endDate.toISOString().split('T')[0];

      // Fetch calendar events
      const { EventService } = await import('@/app/services');
      const result = await EventService.getCalendarEvents(startDateString, endDateString);

      if (result.error || !result.data) {
        console.error('Error fetching calendar events:', result.error);
        return [];
      }

      // Map events to RoomEvent format
      const mappedEvents = result.data.map((event) => ({
        id: event.id,
        title: event.title,
        date: new Date(event.date || event.startTime || Date.now()),
        status: event.status?.toLowerCase() || 'scheduled',
        type: event.metadata?.type || 'event',
      }));

      console.log('Fetched calendar events:', mappedEvents);
      return mappedEvents;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update room events when calendar events change
  useEffect(() => {
    if (calendarEvents && calendarEvents.length > 0) {
      setRoomEvents(calendarEvents);

      // Don't auto-select any room - keep "All Posts" selected by default
      // This ensures the "All Posts" option is initially selected
    }
  }, [calendarEvents]);

  // Context value
  const value = {
    currentUser: app.currentUser || null,
    feedPosts,
    processes,
    selectedPeriod,
    roomEvents,
    selectedRoomId,
    isLoadingMore,
    error,
    handleCreatePost,
    handleMediaUpload,
    handleLoadMorePosts,
    handleEventClick,
    clearError,
    setSelectedPeriod: handleSetSelectedPeriod,
    setSelectedRoomId: handleSetSelectedRoomId,
  };

  return <Provider value={value}>{children}</Provider>;
}

// Export the hook with the standard name
export const useFeed = useRouteContext;
