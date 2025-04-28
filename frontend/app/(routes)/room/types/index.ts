import { Post, EventList, EventStatus, EventDetails, User } from '@/app/types/room';

/**
 * Room-specific context and component types
 */

export interface RoomContextType {
  // State management
  isLoading?: boolean;
  error?: string | null;
  clearError?: () => void;

  // Data
  currentUser: User;
  posts: Post[];
  eventDetails: EventDetails;
  eventList: EventList;
  roomId?: string | null; // Room ID from URL

  // Actions
  handlePostClick: (postId: string) => void;
  handleCreatePost: (content: string) => void;
  handleTopicClick: (topicId: string) => void;
  handlePlayQuote: (agentId: string) => void;
  handleStartConversation: () => void;
  handleEventListUpdate: (updatedList: EventList) => void;
  handleStatusChange: (status: EventStatus) => void;
  handleViewTemplate?: () => void;
}

// Component-specific prop types
export interface RoomHeaderProps {
  title: string;
  backRoute?: string;
}

export interface RoomStartLiveProps {
  onStart: () => void;
}

export interface RoomDetailsProps {
  details: EventDetails;
  onStatusChange: (status: EventStatus) => void;
}

export interface RoomProcessProps {
  eventList: EventList;
  onEventListUpdate: (updatedList: EventList) => void;
}

export interface RoomCardProps {
  details: EventDetails;
  onStatusChange: (status: EventStatus) => void;
}

export interface RoomFeedProps {
  posts: Post[];
  currentUser: User;
  onPostClick: (postId: string) => void;
  onCreatePost: (content: string) => void;
}

export interface RoomFeedPostProps {
  post: Post;
  onPostClick: (postId: string) => void;
}

export interface RoomFeedInputProps {
  onCreatePost: (content: string) => void;
  currentUser: User;
}

export interface StatusSelectProps {
  status: EventStatus;
  onChange: (status: EventStatus) => void;
}
