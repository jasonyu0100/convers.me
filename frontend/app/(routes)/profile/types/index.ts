import { ProfileActivity, ProfileConnection, ProfileEvent, ProfileHighlight, ProfileReport, ProfileUser, TimelineYear } from '@/app/types/profile';
import { Post, User } from '@/app/types/shared';

/**
 * Profile context types specific to the Profile route
 */

// Profile view types
export type ProfileViewType = 'activity' | 'events' | 'reports';

// Context type for Profile route
export interface ProfileContextType {
  // Profile data
  user: ProfileUser;
  activities: ProfileActivity[];
  events: ProfileEvent[];
  connections: ProfileConnection[];
  highlights: ProfileHighlight[];
  timelineData: TimelineYear[];
  selectedYear: number;
  selectedQuarter: number;
  selectedMonth: number | null;
  selectedWeek: number | null;
  reports?: ProfileReport[];

  // Date range for filtering
  dateRange?: {
    startDate: string;
    endDate: string;
  };

  // Shared type conversions for component interoperability
  sharedUser: User;
  postsFromActivities: Post[];
  convertToSharedUser: (profileUser: ProfileUser) => User;
  convertActivityToPost: (activity: ProfileActivity) => Post;

  // View state
  viewType: ProfileViewType;
  isPublicView: boolean;

  // Additional state
  isEditing: boolean;
  showAllConnections: boolean;

  // Status
  isLoading?: boolean;
  error?: string | null;

  // Actions
  toggleEditMode: () => void;
  toggleShowAllConnections: () => void;
  selectTab: (tab: ProfileViewType) => void;
  setViewType: (type: ProfileViewType) => void;
  selectYear: (year: number) => void;
  selectQuarter: (year: number, quarter: number) => void;
  selectMonth: (monthNumber: number) => void;
  selectWeek?: (weekNumber: number) => void;
  clearError?: () => void;

  // Event handlers
  handleEventClick?: (id: string) => void;
  handleTagClick?: (tag: string) => void;
}

// Component-specific props types
export interface ProfileTabProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
  count?: number;
}

export interface ProfilePostProps {
  post: ProfileActivity | Post;
}

export interface ProfilePostsListProps {
  posts: (ProfileActivity | Post)[];
}

export interface ProfileQuoteProps {
  quote: ProfileHighlight;
}

export interface ProfileQuotesListProps {
  quotes: ProfileHighlight[];
}

export interface ProfileConnectionItemProps {
  connection: ProfileConnection;
}

export interface ProfileConnectionsListProps {
  connections: ProfileConnection[];
}

export interface ProfileHeaderProps {
  user: ProfileUser;
}

export interface ProfileStatProps {
  label: string;
  value: number;
}

export interface ProfileStatsProps {
  followers: number;
  following: number;
  conversations: number;
}

export interface ProfileInterestProps {
  interest: string;
}

export interface ProfileInterestsListProps {
  interests: string[];
}

export interface ProfileAboutSectionProps {
  user: ProfileUser;
}

export interface TimelineSelectorProps {
  years: TimelineYear[];
  selectedYear: number;
  selectedQuarter: number | null;
  onSelectYear: (year: number) => void;
  onSelectQuarter: (year: number, quarter: number) => void;
}
