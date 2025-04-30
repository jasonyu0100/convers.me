'use client';

import { createRouteContext, useRouteComponent } from '@/app/components/router';
import { getUserProfile, getProfileReports, getUserPosts, getUserEvents } from '@/app/services/profileService';
import { ProgressService } from '@/app/services/progressService';
import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProfileActivity, ProfileConnection, ProfileEvent, ProfileHighlight, ProfileUser, TimelineYear, TimeFrameType } from '../../../types/profile';
import { Post, User, typeConverters } from '../../../types/shared';
import { ProfileContextType, ProfileViewType } from '../types';

// Default empty data for initialization
const emptyProfileUser = {
  id: '',
  name: '',
  username: '',
  profileImage: undefined,
  biography: '',
  isOnline: false,
  profileUrl: '',
};

const emptyProfileActivities: any[] = [];
const emptyProfileConnections: any[] = [];
const emptyProfileEvents: any[] = [];
const emptyProfileHighlights: any[] = [];
const emptyProfileReports: any[] = [];

// Get current date for default selections
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentQuarter = (Math.floor(currentDate.getMonth() / 3) + 1) as 1 | 2 | 3 | 4;

// Default empty timeline data structure
const defaultTimelineData = [
  {
    year: currentYear,
    quarters: [
      { quarter: 1, year: currentYear, label: `Q1 ${currentYear}`, activityCount: 0, eventCount: 0 },
      { quarter: 2, year: currentYear, label: `Q2 ${currentYear}`, activityCount: 0, eventCount: 0 },
      { quarter: 3, year: currentYear, label: `Q3 ${currentYear}`, activityCount: 0, eventCount: 0 },
      { quarter: 4, year: currentYear, label: `Q4 ${currentYear}`, activityCount: 0, eventCount: 0 },
    ],
    activityCount: 0,
    eventCount: 0,
  },
];

// Default date range
const getDefaultDateRange = (year = currentYear, quarter = currentQuarter) => {
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);

  const endMonth = startMonth + 3;
  const endDate = new Date(year, endMonth, 0);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
};

// Create context with standardized pattern
const { Provider, useRouteContext } = createRouteContext<ProfileContextType>('Profile', {
  // We'll create a minimal implementation of the required fields
  // The actual values will be set in the provider
  user: {} as ProfileUser,
  activities: [],
  events: [],
  connections: [],
  highlights: [],
  timelineData: [],
  selectedYear: 0,
  selectedQuarter: 0,
  selectedMonth: null,
  selectedWeek: null,
  sharedUser: {} as User,
  postsFromActivities: [],
  dateRange: getDefaultDateRange(),
  convertToSharedUser: () => ({}) as User,
  convertActivityToPost: () => ({}) as Post,
  viewType: 'activity',
  isPublicView: false,
  isEditing: false,
  showAllConnections: false,
  isLoading: false,
  error: null,
  toggleEditMode: () => {},
  toggleShowAllConnections: () => {},
  selectTab: () => {},
  setViewType: () => {},
  selectYear: () => {},
  selectQuarter: () => {},
  selectMonth: () => {},
  selectWeek: () => {},
  clearError: () => {},
});

/**
 * Profile context provider component
 */
export function ProfileProvider({ children }: { children: React.ReactNode }) {
  // Use standard route component utilities
  const { error, handleError, clearError } = useRouteComponent();

  // Initialize state for time period selection at the top to avoid reference errors
  const [viewType, setViewType] = useState<ProfileViewType>('activity');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<number>(currentQuarter);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAllConnections, setShowAllConnections] = useState(false);
  const [isPublicView] = useState(false);

  // Helper functions to convert between shared types and profile types
  const convertToSharedUser = useCallback((profileUser: ProfileUser): User => {
    return typeConverters.createUser(
      profileUser.id,
      profileUser.name,
      profileUser.username, // Map username to handle
      profileUser.profileImage,
      profileUser.isOnline,
    );
  }, []);

  const convertActivityToPost = useCallback((activity: ProfileActivity): Post => {
    const author = typeConverters.createUser(
      activity.userId || 'unknown-user',
      activity.userName || 'Unknown User',
      activity.userName ? activity.userName.toLowerCase().replace(/\s+/g, '') : '@unknown', // Generate handle from name or use default
      activity.userImage || '/profile/profile-picture-1.jpg', // Use default avatar if none provided
      false, // Default to offline for safety
    );

    return typeConverters.createPost(activity.id, author, activity.content || '(No content)', activity.timeAgo || 'recently');
  }, []);

  // Fetch timeline data with React Query
  const { data: timelineData = defaultTimelineData, isLoading } = useQuery({
    queryKey: ['profileTimeline'],
    queryFn: async () => {
      // Using ProgressService.getTimeline instead of the deprecated getProfileTimeline
      const response = await ProgressService.getTimeline();

      if (response.error) {
        throw new Error(response.error);
      }

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // Set the selected year to most recent year if it exists in the timeline
        const mostRecentYear = response.data[response.data.length - 1].year;
        if (mostRecentYear && mostRecentYear !== selectedYear) {
          setSelectedYear(mostRecentYear);

          // Find the latest quarter with data in this year
          const yearData = response.data.find((y) => y.year === mostRecentYear);
          if (yearData && yearData.quarters && yearData.quarters.length > 0) {
            const latestQuarter = yearData.quarters[yearData.quarters.length - 1].quarter;
            setSelectedQuarter(latestQuarter);
          }
        }

        return response.data;
      }

      return defaultTimelineData;
    },
    onError: (error) => {
      handleError(error);
      console.error('Failed to fetch timeline data:', error);
    },
  });

  // Get the selected quarter data for week filtering
  const selectedQuarterData = useMemo(() => {
    const yearData = timelineData.find((y) => y.year === selectedYear);
    return yearData?.quarters?.find((q) => q.quarter === selectedQuarter);
  }, [timelineData, selectedYear, selectedQuarter]);

  // Get the selected month data if any
  const selectedMonthData = useMemo(() => {
    if (selectedMonth && selectedQuarterData?.months) {
      return selectedQuarterData.months.find((m) => m.monthNumber === selectedMonth);
    }
    return null;
  }, [selectedQuarterData, selectedMonth]);

  // Compute date range for API queries using memoized function
  const dateRange = useMemo(() => {
    const now = new Date();
    const year = selectedYear || now.getFullYear();
    const quarter = selectedQuarter || Math.floor(now.getMonth() / 3) + 1;

    // Calculate start and end dates based on year and quarter
    const startMonth = (quarter - 1) * 3;
    const startDate = new Date(year, startMonth, 1);

    // End date is the last day of the last month in the quarter
    const endMonth = startMonth + 3;
    const endDate = new Date(year, endMonth, 0);

    // If month is selected, calculate the month's date range even if no selectedMonthData
    if (selectedMonth) {
      if (selectedMonthData) {
        // Use data from API if available
        return {
          startDate: selectedMonthData.startDate,
          endDate: selectedMonthData.endDate,
        };
      } else {
        // Calculate month range manually
        const monthIndex = selectedMonth - 1; // 0-indexed month
        const monthStartDate = new Date(year, monthIndex, 1);

        // Get last day of month
        const monthEndDate = new Date(year, monthIndex + 1, 0);

        return {
          startDate: monthStartDate.toISOString().split('T')[0],
          endDate: monthEndDate.toISOString().split('T')[0],
        };
      }
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    };
  }, [selectedYear, selectedQuarter, selectedMonth, selectedMonthData]);

  // Fetch user profile data
  const {
    data: userData,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const response = await getUserProfile();

      if (response.error) {
        throw new Error(response.error);
      }

      return response.data;
    },
    onError: (error) => {
      handleError(error);
      console.error('Failed to fetch user profile:', error);
    },
  });

  // Convert backend user to ProfileUser format
  const profileUser = useMemo<ProfileUser>(() => {
    if (!userData) return emptyProfileUser;

    // Make sure to handle profile image correctly
    // Ensure the profile_image has the correct path structure
    let profileImage = userData.profile_image || undefined;

    // Debug the image URL
    console.log('Original profile image from API:', profileImage);

    // If it's a relative path and doesn't start with slash, add it
    if (profileImage && !profileImage.startsWith('http') && !profileImage.startsWith('/')) {
      profileImage = '/' + profileImage;
      console.log('Fixed profile image path:', profileImage);
    }

    return {
      id: userData.id || '',
      name: userData.name || '',
      username: userData.handle || '',
      profileImage: profileImage,
      biography: userData.bio || '',
      isOnline: true, // Default to online for now
      profileUrl: `/profile/${userData.handle}`,
    };
  }, [userData]);

  // Fetch profile reports with filtering based on selected time period
  const { data: reportsData, isLoading: isLoadingReports } = useQuery({
    queryKey: ['profileReports', selectedYear, selectedQuarter, selectedMonth],
    queryFn: async () => {
      try {
        // Call the updated getProfileReports function with filters
        const response = await getProfileReports(selectedYear, selectedQuarter, selectedMonth || undefined);

        if (response.error) {
          throw new Error(response.error);
        }

        // The reports/me endpoint now returns reports already filtered
        // and properly formatted so we can use them directly
        return (
          response.data?.map((report) => ({
            id: report.id || '',
            title: report.title || '',
            period: report.dateRange || report.period || '',
            periodType: (report.reportType as TimeFrameType) || 'month',
            dateGenerated: report.createdAt || report.dateGenerated || '',
            fileSize: report.size ? `${report.size} KB` : report.fileSize || 'Unknown',
            downloadUrl: report.fileUrl || report.downloadUrl || '',
            year: report.year || selectedYear,
            quarter: report.quarter || selectedQuarter,
            month: report.month,
          })) || []
        );
      } catch (error) {
        console.error('Failed to fetch profile reports:', error);
        return [];
      }
    },
    enabled: selectedYear !== 0 && selectedQuarter !== 0, // Only fetch when valid time period is selected
    onError: (error) => {
      handleError(error);
      console.error('Failed to fetch profile reports:', error);
    },
  });

  // Fetch user posts from posts/me endpoint with date filtering
  const { data: postsData, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['userPosts', selectedYear, selectedQuarter, selectedWeek, dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      try {
        // Use the date range to filter posts using the API endpoint's new date filtering
        const response = await getUserPosts(
          0, // Default skip
          20, // Default limit
          dateRange.startDate,
          dateRange.endDate,
        );

        if (response.error) {
          console.error('Error fetching posts:', response.error);
          return [];
        }

        // The posts/me endpoint returns an array of post objects
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch user posts:', error);
        return [];
      }
    },
    enabled: selectedYear !== 0 && selectedQuarter !== 0, // Only fetch when valid time period is selected
    retry: 1, // Only retry once to prevent excessive error messages
    retryDelay: 1000,
  });

  // Fetch user events from events/me endpoint with date filtering
  const { data: eventsData, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['userEvents', selectedYear, selectedQuarter, selectedWeek],
    queryFn: async () => {
      try {
        // Use the date range to filter events
        const response = await getUserEvents(
          undefined, // No status filter
          dateRange.startDate,
          dateRange.endDate,
        );

        if (response.error) {
          console.error('Error fetching events:', response.error);
          return [];
        }

        // The events/me endpoint returns an array of event list items
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch user events:', error);
        return [];
      }
    },
    enabled: selectedYear !== 0 && selectedQuarter !== 0, // Only fetch when valid time period is selected
    retry: 1, // Only retry once to prevent excessive error messages
    retryDelay: 1000,
  });

  // Convert API post data to ProfileActivity format
  const allActivities = useMemo<ProfileActivity[]>(() => {
    if (!postsData) return emptyProfileActivities;

    return postsData.map((post) => {
      // Handle both nested author object and flattened fields
      return {
        id: post.id || '',
        userId: post.author?.id || post.authorId || '',
        userName: post.author?.name || post.authorName || '',
        userImage: post.author?.profileImage || post.authorImage,
        timestamp: post.createdAt || post.created_at || '',
        timeAgo: 'recently', // Could be calculated on the client side based on timestamp
        content: post.content || '',
        mediaType: post.mediaType || (post.media && post.media.type),
        mediaUrl: post.mediaUrl || (post.media && post.media.url),
      };
    });
  }, [postsData]);

  // Convert API event data to ProfileEvent format
  const allEvents = useMemo<ProfileEvent[]>(() => {
    if (!eventsData) return emptyProfileEvents;

    return eventsData.map((event) => {
      // The events/me endpoint returns EventListItem objects
      // with properly formatted fields
      return {
        id: event.id || '',
        title: event.title || '',
        date: event.date || '',
        timestamp: event.created_at || event.date || '', // Use date as fallback for timestamp
        duration: event.duration || '',
        tags: event.topics || [], // The backend returns topics array
        description: event.description || '',
        complexity: event.complexity || 1,
        participants: event.participant_count || 0,
      };
    });
  }, [eventsData]);

  const [connections] = useState<ProfileConnection[]>(emptyProfileConnections);
  const [highlights] = useState<ProfileHighlight[]>(emptyProfileHighlights);

  // Profile actions
  const toggleEditMode = useCallback(() => {
    try {
      setIsEditing((prev) => !prev);
    } catch (error) {
      handleError(error);
    }
  }, [handleError]);

  const toggleShowAllConnections = useCallback(() => {
    try {
      setShowAllConnections((prev) => !prev);
    } catch (error) {
      handleError(error);
    }
  }, [handleError]);

  const selectTab = useCallback(
    (tab: ProfileViewType) => {
      try {
        setViewType(tab);
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  // Update the report query when the month selection changes
  // This is needed to track dependencies for invalidation but doesn't need to fetch data
  useQuery({
    queryKey: ['profileReports', selectedYear, selectedQuarter, selectedMonth],
    queryFn: async () => {
      return null; // This doesn't actually fetch data, it's just for dependency tracking
    },
    enabled: false, // Disable the query since we don't want it to run
  });

  // Use activities directly from API (already filtered by date range)
  const activities = useMemo(() => {
    // Posts are already filtered by date range through the API
    return allActivities;
  }, [allActivities]);

  // Filter events based on selected time period
  const events = useMemo(() => {
    // Filter events based on the selected timeline period
    return allEvents.filter((event) => {
      const eventDate = new Date(event.timestamp);
      const eventYear = eventDate.getFullYear();
      const eventQuarter = Math.floor(eventDate.getMonth() / 3) + 1;

      // First check year and quarter
      const matchesQuarter = eventYear === selectedYear && eventQuarter === selectedQuarter;

      // If we have a selected month, also check that
      if (matchesQuarter && selectedMonth && selectedMonthData) {
        // Get month date range
        const monthStart = new Date(selectedMonthData.startDate);
        const monthEnd = new Date(selectedMonthData.endDate);

        // Check if event falls in this month
        return eventDate >= monthStart && eventDate <= monthEnd;
      }

      return matchesQuarter;
    });
  }, [allEvents, selectedYear, selectedQuarter, selectedMonth, selectedMonthData]);

  // Timeline selection handlers
  const selectYear = useCallback(
    (year: number) => {
      try {
        setSelectedYear(year);
        setSelectedMonth(null); // Reset month selection when year changes
        setSelectedWeek(null); // Reset week selection when year changes
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  const selectQuarter = useCallback(
    (year: number, quarter: number) => {
      try {
        setSelectedYear(year);
        setSelectedQuarter(quarter);
        setSelectedMonth(null); // Reset month selection when quarter changes
        setSelectedWeek(null); // Reset week selection when quarter changes
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  const selectMonth = useCallback(
    (monthNumber: number) => {
      try {
        // If clicking the same month number, toggle selection
        if (selectedMonth === monthNumber) {
          setSelectedMonth(null); // Deselect the month
        } else {
          setSelectedMonth(monthNumber); // Select new month
          setSelectedWeek(null); // Reset week selection when month changes
        }
      } catch (error) {
        handleError(error);
      }
    },
    [handleError, selectedMonth],
  );

  const selectWeek = useCallback(
    (weekNumber: number) => {
      try {
        // If clicking the same week number, toggle selection
        if (selectedWeek === weekNumber) {
          setSelectedWeek(null); // Deselect the week
        } else {
          setSelectedWeek(weekNumber); // Select new week
        }
      } catch (error) {
        handleError(error);
      }
    },
    [handleError, selectedWeek],
  );

  // Event handling
  const handleEventClick = useCallback(
    (id: string) => {
      try {
        // In a real app, you would navigate to the room associated with this event
        // For example:
        // router.push(`/room?eventId=${id}`);
        console.log('Event clicked:', id);
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  const handleTagClick = useCallback(
    (tag: string) => {
      try {
        // Implement tag filtering here
        // For example:
        // setTagFilter(tag);
        console.log('Tag clicked:', tag);
      } catch (error) {
        handleError(error);
      }
    },
    [handleError],
  );

  // No need to filter reports anymore as it's handled by the backend API
  // Just use the reports data directly from the query
  const reports = useMemo(() => {
    return reportsData || emptyProfileReports;
  }, [reportsData]);

  // Convert activities to shared Posts for components that expect the shared type
  const postsFromActivities = useMemo(() => {
    return activities.map(convertActivityToPost);
  }, [activities, convertActivityToPost]);

  // Convert profileUser to shared User for components that expect the shared type
  const sharedUser = useMemo(() => {
    return convertToSharedUser(profileUser);
  }, [profileUser, convertToSharedUser]);

  // Combine loading states
  const isLoadingAll = isLoading || isLoadingUser || isLoadingReports || isLoadingPosts || isLoadingEvents;

  // Combine errors
  const combinedError = error || userError;

  const contextValue: ProfileContextType = {
    // Data
    user: profileUser,
    activities,
    events,
    connections,
    highlights,
    viewType,
    isEditing,
    showAllConnections,
    timelineData,
    selectedYear,
    selectedQuarter,
    selectedMonth,
    selectedWeek,
    reports, // Use filtered reports from the backend endpoint
    isPublicView,
    dateRange, // Add date range to context

    // Shared type conversions
    sharedUser,
    postsFromActivities,
    convertToSharedUser,
    convertActivityToPost,

    // Status
    isLoading: isLoadingAll,
    error: combinedError ? String(combinedError) : null,

    // Actions
    toggleEditMode,
    toggleShowAllConnections,
    selectTab,
    selectYear,
    selectQuarter,
    selectMonth,
    selectWeek,
    setViewType,
    clearError,

    // Event handlers
    handleEventClick,
    handleTagClick,
  };

  return <Provider value={contextValue}>{children}</Provider>;
}

// Export the hook with the standard name
export const useProfile = useRouteContext;
