/**
 * Knowledge Base service with mock data for AI-generated summaries and insights
 */

import { DailySummary, KnowledgeEntry, KnowledgeRecommendation, KnowledgeTimeFrameType, ReviewFilters, WeeklySummary } from '../types/review';
import { ApiResult } from './api';

// Mock data generation helpers
const generateId = (): string => Math.random().toString(36).substring(2, 15);
const randomInt = (min: number, max: number): number => Math.floor(Math.random() * (max - min + 1)) + min;

// Generate date for specific day offset
const getDateWithOffset = (offset: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split('T')[0];
};

// Mock data for daily summaries
const mockDailySummaries: DailySummary[] = [
  {
    id: generateId(),
    title: 'Daily Productivity Summary',
    content:
      'Today was a productive day focused on the website redesign project. You completed 3 meetings and finished 8 tasks related to frontend development.\n\nYou made significant progress on the UI components for the dashboard, which is now 70% complete. The team feedback on your design prototypes was positive, with some minor adjustments suggested for the navigation menu.\n\nNotably, you spent 2 hours less on meetings compared to your weekly average, allowing more deep work time.',
    timeFrame: 'day',
    category: 'summary',
    date: getDateWithOffset(0),
    userId: 'user123',
    activities: {
      day: 'Monday',
      date: getDateWithOffset(0),
      eventsCompleted: 3,
      stepsCompleted: 8,
      timeSpent: 460,
      efficiency: 87,
    },
    completedEvents: 3,
    completedSteps: 8,
    performanceScore: 87,
    tags: ['UI Design', 'Frontend', 'Meetings'],
  },
  {
    id: generateId(),
    title: 'Daily Progress Overview',
    content:
      'You focused on backend API development today, completing 2 critical endpoints and fixing 3 bugs reported by the QA team.\n\nThe database optimization task took longer than expected (3.5 hours), but resulted in a 40% improvement in query performance. This achievement aligns with your quarterly goal of improving system performance.\n\nYou also participated in the weekly team sync and provided guidance to junior developers on the authentication implementation.',
    timeFrame: 'day',
    category: 'summary',
    date: getDateWithOffset(-1),
    userId: 'user123',
    activities: {
      day: 'Sunday',
      date: getDateWithOffset(-1),
      eventsCompleted: 2,
      stepsCompleted: 6,
      timeSpent: 390,
      efficiency: 78,
    },
    completedEvents: 2,
    completedSteps: 6,
    performanceScore: 78,
    tags: ['Backend', 'API', 'Performance'],
  },
];

// Mock data for weekly summaries
const mockWeeklySummaries: WeeklySummary[] = [
  {
    id: generateId(),
    title: 'Weekly Productivity Recap',
    content:
      'This week you focused primarily on the website redesign project, making substantial progress in both frontend and backend development.\n\nYou completed 12 events, including 3 client meetings, 2 team syncs, and 7 focused development sessions. Overall, you completed 35 tasks across various projects, maintaining an efficiency score of 84%.\n\nThe most significant achievements were completing the authentication system refactoring and finalizing the new dashboard UI components, both critical path items for the Q2 release.',
    timeFrame: 'week',
    category: 'summary',
    date: getDateWithOffset(0),
    userId: 'user123',
    weekProgress: {
      week: 'Week 18',
      startDate: getDateWithOffset(-7),
      endDate: getDateWithOffset(0),
      eventsCompleted: 12,
      stepsCompleted: 35,
      totalTimeSpent: 2340,
      efficiency: 84,
      progress: 76,
    },
    topProcesses: [
      {
        id: generateId(),
        name: 'Website Redesign',
        completedSteps: 18,
        totalSteps: 25,
        timeSpent: 840,
        complexity: 4,
        lastActivity: getDateWithOffset(-1),
        progress: 72,
      },
      {
        id: generateId(),
        name: 'API Documentation',
        completedSteps: 8,
        totalSteps: 10,
        timeSpent: 380,
        complexity: 3,
        lastActivity: getDateWithOffset(-2),
        progress: 80,
      },
    ],
    keyMetrics: [
      {
        id: 'metric1',
        name: 'Deployment Frequency',
        value: 3,
        unit: 'per week',
        change: 1,
        isPositive: true,
      },
      {
        id: 'metric2',
        name: 'Code Review Time',
        value: 45,
        unit: 'minutes',
        change: -15,
        isPositive: true,
      },
    ],
    achievements: [
      'Completed authentication system refactoring',
      'Finalized dashboard UI components',
      'Resolved 5 critical bugs before release',
      'Reduced API response time by 40%',
    ],
    tags: ['Development', 'Design', 'Documentation'],
  },
  {
    id: generateId(),
    title: 'Weekly Performance Summary',
    content:
      'Last week was focused on the data migration project and client onboarding tasks.\n\nYou participated in 9 events and completed 28 tasks with an efficiency rating of 79%. While this is slightly below your quarterly average, the complexity of the data migration work was higher than usual.\n\nThe team successfully migrated 3 client databases with minimal downtime, and you created comprehensive documentation for the new onboarding process that will be used by the customer success team going forward.',
    timeFrame: 'week',
    category: 'summary',
    date: getDateWithOffset(-7),
    userId: 'user123',
    weekProgress: {
      week: 'Week 17',
      startDate: getDateWithOffset(-14),
      endDate: getDateWithOffset(-7),
      eventsCompleted: 9,
      stepsCompleted: 28,
      totalTimeSpent: 2160,
      efficiency: 79,
      progress: 68,
    },
    topProcesses: [
      {
        id: generateId(),
        name: 'Data Migration',
        completedSteps: 15,
        totalSteps: 18,
        timeSpent: 960,
        complexity: 5,
        lastActivity: getDateWithOffset(-7),
        progress: 83,
      },
      {
        id: generateId(),
        name: 'Client Onboarding',
        completedSteps: 8,
        totalSteps: 12,
        timeSpent: 480,
        complexity: 3,
        lastActivity: getDateWithOffset(-9),
        progress: 67,
      },
    ],
    achievements: ['Migrated 3 client databases successfully', 'Created new onboarding documentation', 'Improved database query performance by 25%'],
    tags: ['Migration', 'Documentation', 'Onboarding'],
  },
];

// Mock data for recommendations
const mockRecommendations: KnowledgeRecommendation[] = [
  {
    id: generateId(),
    title: 'Schedule focus time for API development',
    content:
      'Based on your recent productivity patterns, scheduling 2-hour focus blocks for API development would help complete the remaining endpoints more efficiently.',
    timeFrame: 'day',
    category: 'recommendation',
    date: getDateWithOffset(0),
    userId: 'user123',
    priority: 'high',
    actionable: true,
    dueDate: getDateWithOffset(2),
    tags: ['Time Management', 'Development'],
  },
  {
    id: generateId(),
    title: 'Review weekly goals alignment',
    content:
      'Your current tasks are not fully aligned with your top priority goal for the quarter. Consider reallocating time to the performance optimization project.',
    timeFrame: 'week',
    category: 'recommendation',
    date: getDateWithOffset(0),
    userId: 'user123',
    priority: 'medium',
    actionable: true,
    dueDate: getDateWithOffset(3),
    tags: ['Goals', 'Planning'],
  },
  {
    id: generateId(),
    title: 'Document code after refactoring',
    content: 'The authentication system refactoring lacks updated documentation. This will be important for onboarding new team members.',
    timeFrame: 'day',
    category: 'recommendation',
    date: getDateWithOffset(0),
    userId: 'user123',
    priority: 'medium',
    actionable: true,
    tags: ['Documentation', 'Best Practices'],
  },
  {
    id: generateId(),
    title: 'Block time for learning new framework',
    content:
      "You mentioned wanting to learn React Native in your quarterly goals, but haven't allocated time for it. Consider blocking 3 hours weekly for learning.",
    timeFrame: 'week',
    category: 'recommendation',
    date: getDateWithOffset(0),
    userId: 'user123',
    priority: 'low',
    actionable: true,
    tags: ['Learning', 'Skill Development'],
  },
];

// Helper to filter mock data based on filters
const filterMockData = <T extends KnowledgeEntry>(data: T[], filters: ReviewFilters): T[] => {
  return data.filter((entry) => {
    // Filter by date range
    if (filters.startDate && new Date(entry.date) < new Date(filters.startDate)) {
      return false;
    }
    if (filters.endDate && new Date(entry.date) > new Date(filters.endDate)) {
      return false;
    }

    // Filter by category
    if (filters.category && entry.category !== filters.category) {
      return false;
    }

    // Filter by time frame
    if (filters.timeFrame && entry.timeFrame !== filters.timeFrame) {
      return false;
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      if (!entry.tags || !entry.tags.some((tag) => filters.tags?.includes(tag))) {
        return false;
      }
    }

    // Filter by source type
    if (filters.sourceType && entry.sourceType !== filters.sourceType) {
      return false;
    }

    return true;
  });
};

/**
 * Service for retrieving mock knowledge base data
 */
export const BaseService = {
  /**
   * Get knowledge base entries based on filters
   * @param filters - Optional filters to apply
   * @returns Promise with API result containing knowledge entries
   */
  async getEntries(filters: ReviewFilters = {}): Promise {
    try {
      // Combine all mock data into one array
      const allEntries: KnowledgeEntry[] = [...mockDailySummaries, ...mockWeeklySummaries, ...mockRecommendations];

      // Apply filters
      const filteredEntries = filterMockData(allEntries, filters);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        data: filteredEntries,
        status: 200,
      };
    } catch (error) {
      console.error('Error fetching knowledge base entries:', error);
      return {
        data: [],
        error: 'Failed to retrieve knowledge base entries',
        status: 500,
      };
    }
  },

  /**
   * Get daily summaries for the knowledge base
   * @param startDate - Optional start date filter (ISO string)
   * @param endDate - Optional end date filter (ISO string)
   * @returns Promise with API result containing daily summaries
   */
  async getDailySummaries(startDate?: string, endDate?: string): Promise {
    try {
      // Apply date filters
      const filters: ReviewFilters = { startDate, endDate, timeFrame: 'day' };
      const filteredSummaries = filterMockData(mockDailySummaries, filters);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        data: filteredSummaries,
        status: 200,
      };
    } catch (error) {
      console.error('Error fetching daily summaries:', error);
      return {
        data: [],
        error: 'Failed to retrieve daily summaries',
        status: 500,
      };
    }
  },

  /**
   * Get weekly summaries for the knowledge base
   * @param startDate - Optional start date filter (ISO string)
   * @param endDate - Optional end date filter (ISO string)
   * @returns Promise with API result containing weekly summaries
   */
  async getWeeklySummaries(startDate?: string, endDate?: string): Promise {
    try {
      // Apply date filters
      const filters: ReviewFilters = { startDate, endDate, timeFrame: 'week' };
      const filteredSummaries = filterMockData(mockWeeklySummaries, filters);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      return {
        data: filteredSummaries,
        status: 200,
      };
    } catch (error) {
      console.error('Error fetching weekly summaries:', error);
      return {
        data: [],
        error: 'Failed to retrieve weekly summaries',
        status: 500,
      };
    }
  },

  /**
   * Get AI-generated recommendations based on user activity
   * @param limit - Optional limit of recommendations to return
   * @returns Promise with API result containing recommendations
   */
  async getRecommendations(limit: number = 5): Promise {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Get limited number of recommendations
      const limitedRecommendations = mockRecommendations.slice(0, limit);

      return {
        data: limitedRecommendations,
        status: 200,
      };
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      return {
        data: [],
        error: 'Failed to retrieve recommendations',
        status: 500,
      };
    }
  },

  /**
   * Generate a new AI summary for a specific date or time period
   * @param date - The date to generate summary for (ISO string)
   * @param timeFrame - The time frame for the summary (day, week, month)
   * @returns Promise with API result containing the generated summary
   */
  async generateSummary(date: string, timeFrame: KnowledgeTimeFrameType = 'day'): Promise {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Generate a new mock summary based on the time frame
      const newSummary: KnowledgeEntry = {
        id: generateId(),
        title: `${timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)} AI-Generated Summary`,
        content: `This is a newly generated ${timeFrame} summary for ${date}.\n\nBased on your activity, you've made progress on several key projects and completed multiple tasks. The AI analysis shows patterns of productivity that align with your goals.`,
        timeFrame,
        category: 'summary',
        date,
        userId: 'user123',
        sourceType: 'ai',
        tags: ['AI Generated', 'Summary'],
      };

      return {
        data: newSummary,
        status: 200,
      };
    } catch (error) {
      console.error('Error generating summary:', error);
      return {
        error: 'Failed to generate summary',
        status: 500,
      };
    }
  },

  /**
   * Get a specific knowledge entry by ID
   * @param id - The ID of the entry to retrieve
   * @returns Promise with API result containing the entry
   */
  async getEntryById(id: string): Promise {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Find entry in mock data
      const allEntries: KnowledgeEntry[] = [...mockDailySummaries, ...mockWeeklySummaries, ...mockRecommendations];

      const entry = allEntries.find((e) => e.id === id);

      if (entry) {
        return {
          data: entry,
          status: 200,
        };
      } else {
        return {
          error: 'Entry not found',
          status: 404,
        };
      }
    } catch (error) {
      console.error(`Error fetching knowledge entry ${id}:`, error);
      return {
        error: 'Failed to retrieve knowledge entry',
        status: 500,
      };
    }
  },

  /**
   * Create a new user-generated knowledge entry
   * @param entry - The entry data to create
   * @returns Promise with API result containing the created entry
   */
  async createEntry(entry: Partial): Promise {
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Create a new entry with generated ID
      const newEntry: KnowledgeEntry = {
        id: generateId(),
        title: entry.title || 'New Entry',
        content: entry.content || '',
        timeFrame: entry.timeFrame || 'day',
        category: entry.category || 'summary',
        date: entry.date || new Date().toISOString().split('T')[0],
        userId: 'user123',
        tags: entry.tags || [],
        sourceType: 'user',
        ...entry,
      };

      return {
        data: newEntry,
        status: 201,
      };
    } catch (error) {
      console.error('Error creating knowledge entry:', error);
      return {
        error: 'Failed to create knowledge entry',
        status: 500,
      };
    }
  },
};
