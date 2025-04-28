'use client';

import { useApp } from '@/app/components/app/hooks';
import { AppRoute } from '@/app/components/router';
import { createRouteContext } from '@/app/components/router/createRouteContext';
import { useRouteComponent } from '@/app/components/router/useRouteComponent';
import { EventService } from '@/app/services/eventService';
import { PostService } from '@/app/services/postService';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';
import { Post, EventList, EventStatus, EventDetails } from '@/app/types/room';
import { RoomContextType } from '../types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Create the context using the standardized factory function
const { Provider, useRouteContext } = createRouteContext<RoomContextType>('Room', {
  // State management
  isLoading: false,
  error: null,
  clearError: () => {},

  // Data
  currentUser: {
    id: 'user-1',
    name: 'User',
    handle: '@user',
    profileImage: '/profile/profile.jpg',
  },
  posts: [],
  eventDetails: {
    title: '',
    description: '',
    date: '',
    time: '',
    duration: '',
    status: 'Pending',
    complexity: 1,
    color: '#4B5563',
    tags: [],
  },
  eventList: {
    id: '',
    title: '',
    description: '',
    process: {
      isTemplate: false,
      templateId: undefined,
    },
    steps: [],
  },
  roomId: null,

  // Actions
  handlePostClick: () => {},
  handleCreatePost: () => {},
  handleTopicClick: () => {},
  handlePlayQuote: () => {},
  handleStartConversation: () => {},
  handleEventListUpdate: () => {},
  handleStatusChange: () => {},
});

/**
 * Provider component for room functionality
 */
export function RoomProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const app = useApp();
  const queryClient = useQueryClient();
  const { error, handleError, clearError } = useRouteComponent();

  // Get the room ID from the URL
  const roomId = searchParams?.get('id');

  // Helper function to format time ago for posts
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  // Fetch event (room) data with React Query
  const { data: eventData, isLoading: isLoadingEvent } = useQuery({
    queryKey: ['event', roomId],
    queryFn: async () => {
      if (!roomId) return null;

      const eventResult = await EventService.getEventById(roomId);
      if (eventResult.error) {
        throw new Error(eventResult.error);
      }

      if (!eventResult.data) return null;

      // Convert to event details format for the room
      const roomDetails: EventDetails = {
        title: eventResult.data.title,
        description: eventResult.data.description || '',
        date: eventResult.data.date,
        time: eventResult.data.time || '',
        duration: eventResult.data.duration || '',
        status: eventResult.data.status || 'Pending',
        complexity: eventResult.data.complexity || 3,
        color: eventResult.data.color || '#4B5563',
        tags: eventResult.data.topics?.map((t) => t.name) || [],
      };

      return roomDetails;
    },
    enabled: !!roomId,
    onError: (error) => {
      handleError(error);
    },
  });

  // Fetch event list (steps/tasks) with React Query
  const {
    data: eventList = {
      id: '',
      title: '',
      description: '',
      process: { isTemplate: false, templateId: undefined },
      steps: [],
    },
    isLoading: isLoadingEventList,
  } = useQuery({
    queryKey: ['eventList', roomId],
    queryFn: async () => {
      if (!roomId) {
        return { id: '', title: '', description: '', process: { isTemplate: false, templateId: undefined }, steps: [] };
      }

      const eventListResult = await EventService.getEventSteps(roomId);
      if (eventListResult.error || !eventListResult.data) {
        return { id: '', title: '', description: '', process: { isTemplate: false, templateId: undefined }, steps: [] };
      }

      // If we have event data, use it to populate the title and description
      const eventListData: EventList = {
        id: roomId,
        title: eventData?.title || '',
        description: eventData?.description || '',
        process: {
          isTemplate: false,
          templateId: undefined, // We'll set this if available from event data
        },
        steps:
          eventListResult.data.map((step) => {
            // Handle different property naming formats from the API

            // Handle both sub_steps (snake_case from API) and subSteps (camelCase)
            const subStepsData = step.sub_steps || step.subSteps || [];

            return {
              id: step.id,
              content: step.content,
              completed: step.completed,
              order: step.order,
              dueDate: step.due_date || step.dueDate,
              eventId: step.event_id || step.eventId,
              createdAt: step.created_at || step.createdAt,
              updatedAt: step.updated_at || step.updatedAt,
              completedAt: step.completed_at || step.completedAt,
              // Handle different substep property names and ensure it's an array
              subSteps: Array.isArray(subStepsData)
                ? subStepsData.map((subStep) => ({
                    id: subStep.id,
                    content: subStep.content,
                    completed: subStep.completed,
                    order: subStep.order,
                    stepId: subStep.step_id || subStep.stepId,
                    createdAt: subStep.created_at || subStep.createdAt,
                    updatedAt: subStep.updated_at || subStep.updatedAt,
                    completedAt: subStep.completed_at || subStep.completedAt,
                  }))
                : [],
            };
          }) || [],
      };

      return eventListData;
    },
    enabled: !!roomId && !!eventData, // Only run this query after eventData is loaded
    onError: (error) => {
      handleError(error);
    },
  });

  // Fetch posts with React Query
  const { data: posts = [], isLoading: isLoadingPosts } = useQuery({
    queryKey: ['posts', roomId],
    queryFn: async () => {
      if (!roomId) return [];

      try {
        // Use the existing getPosts method with eventId filter to get only posts for this room
        const postsResult = await PostService.getPosts(roomId);
        if (postsResult.error || !postsResult.data) {
          return [];
        }

        // Convert to Post format
        const eventPosts: Post[] = postsResult.data
          .filter((p) => p.eventId === roomId) // Ensure posts are for this specific event
          .map((p) => ({
            id: p.id,
            author: {
              id: p.authorId || 'unknown-user',
              name: p.authorName || 'Unknown User',
              handle: p.authorHandle || p.authorId || '@unknown',
              profileImage: p.authorImage || '/profile/profile-picture-1.jpg', // Default avatar
              isOnline: false,
            },
            content: p.content,
            timeAgo: formatTimeAgo(p.createdAt || ''),
            timestamp: p.createdAt || '',
            media: p.media
              ? {
                  type: p.media.type,
                  url: p.media.url,
                  title: p.media.title,
                }
              : undefined,
          }));

        return eventPosts;
      } catch (error) {
        return [];
      }
    },
    enabled: !!roomId,
    onError: (error) => {
      handleError(error);
    },
  });

  // Combined loading state
  const isLoading = isLoadingEvent || isLoadingEventList || isLoadingPosts;

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!content.trim() || !roomId) {
        return null;
      }

      // Create the post in the API with the event ID
      const createPostData = {
        content,
        eventId: roomId,
        visibility: 'public',
      };

      const result = await PostService.createPost(createPostData);

      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    onSuccess: (data) => {
      if (!data) return;

      // Add the new post to the posts list
      const newPost: Post = {
        id: data.id,
        author: {
          id: app.currentUser?.id || 'unknown-user',
          name: app.currentUser?.name || 'Unknown User',
          handle: app.currentUser?.handle || '@unknown',
          profileImage: app.currentUser?.profileImage || '/profile/profile-picture-1.jpg',
          isOnline: !!app.currentUser,
        },
        content: data.content,
        timeAgo: 'just now',
        timestamp: new Date().toISOString(),
      };

      queryClient.setQueryData(['posts', roomId], (old: Post[] = []) => [newPost, ...old]);
    },
    onError: (error) => {
      handleError(error);
    },
  });

  // Update event list mutation
  const updateEventListMutation = useMutation({
    mutationFn: async (updatedList: EventList) => {
      if (!roomId) {
        throw new Error('No room ID available');
      }

      // Update each step that's been modified
      const updatePromises = updatedList.steps.map(async (step) => {
        // Update step completion status
        await EventService.updateStep(roomId, step.id, {
          completed: step.completed,
        });

        // Update substeps if they exist using batch API
        if (step.subSteps && step.subSteps.length > 0) {
          // Create batch update payload
          const subStepUpdates = step.subSteps.map((subStep) => ({
            id: subStep.id,
            stepId: step.id, // Keep using camelCase for API requests
            completed: subStep.completed,
          }));

          if (subStepUpdates.length > 0) {
            await EventService.batchUpdateSubSteps(roomId, subStepUpdates);
          }
        }
      });

      await Promise.all(updatePromises);
      return updatedList;
    },
    onSuccess: (updatedList) => {
      // Update event list in cache
      queryClient.setQueryData(['eventList', roomId], updatedList);
    },
    onError: (error) => {
      handleError(error);
    },
  });

  // Status change mutation
  const changeStatusMutation = useMutation({
    mutationFn: async ({ status, previousStatus }: { status: EventStatus; previousStatus: EventStatus }) => {
      if (!roomId) {
        throw new Error('No room ID available');
      }

      if (previousStatus === status) {
        return null;
      }

      // Update the status directly
      const updateResult = await EventService.updateEvent(roomId, {
        status,
      });

      if (updateResult.error) {
        throw new Error(updateResult.error);
      }

      // Create a post message based on the status change
      const postContent = `Status updated: ${previousStatus} → ${status}`;

      const postResult = await PostService.createPost({
        content: postContent,
        event_id: roomId,
      });

      return { status, postResult };
    },
    onSuccess: (result) => {
      if (!result) return;

      // Update status in eventDetails
      queryClient.setQueryData(['event', roomId], (old: EventDetails | null) => {
        if (!old) return null;
        return { ...old, status: result.status };
      });

      // Add status update post if it was created successfully
      if (result.postResult && !result.postResult.error && result.postResult.data) {
        const newPost: Post = {
          id: result.postResult.data.id,
          author: {
            id: app.currentUser?.id || 'unknown-user',
            name: app.currentUser?.name || 'Unknown User',
            handle: app.currentUser?.handle || '@unknown',
            profileImage: app.currentUser?.profileImage || '/profile/profile-picture-1.jpg',
            isOnline: !!app.currentUser,
          },
          content: `Status updated: ${result.postResult.data.content}`,
          timeAgo: 'just now',
          timestamp: new Date().toISOString(),
        };

        queryClient.setQueryData(['posts', roomId], (old: Post[] = []) => [newPost, ...old]);
      }
    },
    onError: (error) => {
      handleError(error);
    },
  });

  // Event handlers with error handling
  const handlePostClick = useCallback(
    (postId: string) => {
      try {
        // In a real app, this might show post details or load a conversation
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  const handleCreatePost = useCallback(
    async (content: string) => {
      return createPostMutation.mutateAsync(content);
    },
    [createPostMutation],
  );

  const handleTopicClick = useCallback(
    (topicId: string) => {
      try {
        // In a real app, this might filter content by topic
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  const handlePlayQuote = useCallback(
    (agentId: string) => {
      try {
        // In a real app, this would play the agent's quote audio
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  const handleStartConversation = useCallback(() => {
    try {
      app.setMainView(AppRoute.LIVE);
      if (roomId) {
        router.push(`/live?id=${roomId}`);
      } else {
        router.push('/live');
      }
    } catch (error) {
      handleError(error);
    }
  }, [app, router, handleError, roomId]);

  const handleEventListUpdate = useCallback(
    async (updatedList: EventList) => {
      return updateEventListMutation.mutateAsync(updatedList);
    },
    [updateEventListMutation],
  );

  const handleStatusChange = useCallback(
    async (status: EventStatus) => {
      // Get previous status before updating
      const previousStatus = eventData?.status || 'Pending';

      return changeStatusMutation.mutateAsync({ status, previousStatus });
    },
    [eventData, changeStatusMutation],
  );

  // Function to navigate to the template process or create new template
  const handleViewTemplate = useCallback(() => {
    if (eventList.process?.templateId) {
      try {
        // Set the main view to PROCESS to update the app state
        app.setMainView(AppRoute.PROCESS);
        // Navigate to the process route with the template ID
        router.push(`/process?id=${eventList.process.templateId}`);
      } catch (error) {
        handleError(error);
      }
    } else {
      // If no template exists, navigate to create a new template
      // with current process data as prefill values
      try {
        app.setMainView(AppRoute.PROCESS);
        // Navigate to process route with create=true and prefill data
        const prefillData = {
          title: eventList.title || '',
          description: eventList.description || '',
          steps: eventList.process?.steps || [],
        };
        router.push(`/process?create=true&prefill=${encodeURIComponent(JSON.stringify(prefillData))}`);
      } catch (error) {
        handleError(error);
      }
    }
  }, [eventList, router, handleError, app]);

  // Context value
  const contextValue: RoomContextType = {
    // State management
    isLoading,
    error,
    clearError,

    // Data
    currentUser: app.currentUser || {
      id: 'user-1',
      name: 'User',
      handle: '@user',
      profileImage: undefined,
    },
    posts,
    eventDetails: eventData || {
      title: '',
      description: '',
      date: '',
      time: '',
      duration: '',
      status: 'Pending',
      complexity: 1,
      color: '#4B5563',
      tags: [],
    },
    eventList,
    roomId,

    // Actions
    handlePostClick,
    handleCreatePost,
    handleTopicClick,
    handlePlayQuote,
    handleStartConversation,
    handleEventListUpdate,
    handleStatusChange,
    handleViewTemplate,
  };

  return <Provider value={contextValue}>{children}</Provider>;
}

// Export the hook with the standard name
export const useRoom = useRouteContext;
