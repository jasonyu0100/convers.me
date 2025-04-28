/**
 * Connect service - Manages ticket connections from external systems
 */

import { ApiClient } from './api';
import { Ticket, ProcessTemplate, TicketSource, TicketPriority } from '../types/connect';

// Mock data for development until backend is ready
const MOCK_TICKETS: Ticket[] = [
  {
    id: 'ticket-1',
    title: 'Fix authentication bug in login page',
    description: 'Users are experiencing intermittent 401 errors when logging in from mobile devices',
    source: TicketSource.GITHUB,
    sourceId: 'GH-423',
    priority: TicketPriority.HIGH,
    dueDate: '2025-05-02',
    estimatedHours: 4,
    assigneeId: 'user-1',
    assigneeName: 'Jason Yu',
    assigneeAvatar: '/profile/profile-picture-1.jpg',
    labels: ['bug', 'frontend', 'auth'],
    status: 'In Progress',
    url: 'https://github.com/org/repo/issues/423',
    createdAt: '2025-04-20T08:30:00Z',
  },
  {
    id: 'ticket-2',
    title: 'Implement dark mode for settings page',
    description: 'Add dark mode support to the settings interface following the design specs in Figma',
    source: TicketSource.JIRA,
    sourceId: 'JIRA-289',
    priority: TicketPriority.MEDIUM,
    dueDate: '2025-05-05',
    estimatedHours: 8,
    assigneeId: 'user-1',
    assigneeName: 'Jason Yu',
    assigneeAvatar: '/profile/profile-picture-1.jpg',
    labels: ['feature', 'ui', 'settings'],
    status: 'To Do',
    url: 'https://jira.company.com/browse/JIRA-289',
    createdAt: '2025-04-21T09:45:00Z',
  },
  {
    id: 'ticket-3',
    title: 'Optimize database queries for feed page',
    description: 'Feed page is loading slowly due to inefficient database queries. Need to add indexes and optimize JOIN operations.',
    source: TicketSource.LINEAR,
    sourceId: 'LIN-567',
    priority: TicketPriority.HIGH,
    dueDate: '2025-04-29',
    estimatedHours: 6,
    assigneeId: 'user-1',
    assigneeName: 'Jason Yu',
    assigneeAvatar: '/profile/profile-picture-1.jpg',
    labels: ['performance', 'backend', 'database'],
    status: 'To Do',
    url: 'https://linear.app/company/issue/LIN-567',
    createdAt: '2025-04-22T14:20:00Z',
  },
  {
    id: 'ticket-4',
    title: 'Update documentation for API endpoints',
    description: 'Our API documentation is outdated. Need to update all endpoints with current parameters and response formats.',
    source: TicketSource.ASANA,
    sourceId: 'AS-789',
    priority: TicketPriority.LOW,
    dueDate: '2025-05-10',
    estimatedHours: 5,
    assigneeId: 'user-1',
    assigneeName: 'Jason Yu',
    assigneeAvatar: '/profile/profile-picture-1.jpg',
    labels: ['docs', 'api'],
    status: 'To Do',
    url: 'https://app.asana.com/0/tasks/AS-789',
    createdAt: '2025-04-23T11:15:00Z',
  },
  {
    id: 'ticket-5',
    title: 'Implement file upload component',
    description: 'Create a reusable file upload component with drag-and-drop support, progress indicator, and error handling',
    source: TicketSource.MONDAY,
    sourceId: 'MON-345',
    priority: TicketPriority.MEDIUM,
    dueDate: '2025-05-07',
    estimatedHours: 10,
    assigneeId: 'user-1',
    assigneeName: 'Jason Yu',
    assigneeAvatar: '/profile/profile-picture-1.jpg',
    labels: ['feature', 'frontend', 'ui'],
    status: 'To Do',
    url: 'https://monday.com/boards/123/pulses/345',
    createdAt: '2025-04-24T15:30:00Z',
  },
  {
    id: 'ticket-6',
    title: 'Fix memory leak in WebSocket connection',
    description: 'The live chat feature has a memory leak that causes the application to crash after prolonged use',
    source: TicketSource.GITHUB,
    sourceId: 'GH-512',
    priority: TicketPriority.URGENT,
    dueDate: '2025-04-28',
    estimatedHours: 6,
    assigneeId: 'user-1',
    assigneeName: 'Jason Yu',
    assigneeAvatar: '/profile/profile-picture-1.jpg',
    labels: ['bug', 'critical', 'websocket'],
    status: 'In Progress',
    url: 'https://github.com/org/repo/issues/512',
    createdAt: '2025-04-25T08:00:00Z',
  },
  {
    id: 'ticket-7',
    title: 'Add unit tests for authentication service',
    description: 'Increase test coverage for the authentication service, focusing on edge cases and error handling',
    source: TicketSource.JIRA,
    sourceId: 'JIRA-301',
    priority: TicketPriority.MEDIUM,
    dueDate: '2025-05-09',
    estimatedHours: 7,
    assigneeId: 'user-1',
    assigneeName: 'Jason Yu',
    assigneeAvatar: '/profile/profile-picture-1.jpg',
    labels: ['testing', 'auth'],
    status: 'To Do',
    url: 'https://jira.company.com/browse/JIRA-301',
    createdAt: '2025-04-25T09:20:00Z',
  },
  {
    id: 'ticket-8',
    title: 'Integrate analytics tracking',
    description: 'Implement event tracking using our analytics service across key user interactions',
    source: TicketSource.LINEAR,
    sourceId: 'LIN-611',
    priority: TicketPriority.LOW,
    dueDate: '2025-05-15',
    estimatedHours: 4,
    assigneeId: 'user-1',
    assigneeName: 'Jason Yu',
    assigneeAvatar: '/profile/profile-picture-1.jpg',
    labels: ['analytics', 'tracking'],
    status: 'To Do',
    url: 'https://linear.app/company/issue/LIN-611',
    createdAt: '2025-04-25T10:45:00Z',
  },
];

// Mock process templates
const MOCK_TEMPLATES: ProcessTemplate[] = [
  {
    id: 'process-1',
    title: 'Bug Fix Workflow',
    description: 'Standard process for addressing software bugs',
    color: 'red',
    createdAt: '2025-01-15T10:00:00Z',
    steps: [
      {
        id: 'step-1',
        content: 'Reproduce the issue',
        completed: false,
        order: 1,
      },
      {
        id: 'step-2',
        content: 'Identify root cause',
        completed: false,
        order: 2,
      },
      {
        id: 'step-3',
        content: 'Implement fix',
        completed: false,
        order: 3,
      },
      {
        id: 'step-4',
        content: 'Write test case',
        completed: false,
        order: 4,
      },
      {
        id: 'step-5',
        content: 'Verify in development environment',
        completed: false,
        order: 5,
      },
    ],
  },
  {
    id: 'process-2',
    title: 'Feature Implementation',
    description: 'Process for adding new features to the application',
    color: 'blue',
    createdAt: '2025-01-20T11:30:00Z',
    steps: [
      {
        id: 'step-6',
        content: 'Review requirements',
        completed: false,
        order: 1,
      },
      {
        id: 'step-7',
        content: 'Design solution architecture',
        completed: false,
        order: 2,
      },
      {
        id: 'step-8',
        content: 'Implement core functionality',
        completed: false,
        order: 3,
      },
      {
        id: 'step-9',
        content: 'Add UI/UX elements',
        completed: false,
        order: 4,
      },
      {
        id: 'step-10',
        content: 'Write unit and integration tests',
        completed: false,
        order: 5,
      },
      {
        id: 'step-11',
        content: 'Document feature for users and developers',
        completed: false,
        order: 6,
      },
    ],
  },
  {
    id: 'process-3',
    title: 'Documentation Update',
    description: 'Process for updating technical documentation',
    color: 'green',
    createdAt: '2025-02-05T09:15:00Z',
    steps: [
      {
        id: 'step-12',
        content: 'Review current documentation',
        completed: false,
        order: 1,
      },
      {
        id: 'step-13',
        content: 'Identify outdated sections',
        completed: false,
        order: 2,
      },
      {
        id: 'step-14',
        content: 'Update content with current information',
        completed: false,
        order: 3,
      },
      {
        id: 'step-15',
        content: 'Add code examples where needed',
        completed: false,
        order: 4,
      },
      {
        id: 'step-16',
        content: 'Peer review documentation changes',
        completed: false,
        order: 5,
      },
    ],
  },
];

/**
 * Connect service for managing ticket connections
 */
export class ConnectService {
  private static client = new ApiClient();

  /**
   * Get all tickets for the current user
   */
  static async getTickets(): Promise {
    // This would be replaced with an actual API call
    // return this.client.get('/api/connect/tickets');
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_TICKETS), 500);
    });
  }

  /**
   * Get process templates that can be used with tickets
   */
  static async getProcessTemplates(): Promise {
    // This would be replaced with an actual API call
    // return this.client.get('/api/processes/templates');
    return new Promise((resolve) => {
      setTimeout(() => resolve(MOCK_TEMPLATES), 300);
    });
  }

  /**
   * Schedule a ticket for work
   */
  static async scheduleTicket(ticketId: string, date: string, startTime: string, endTime: string, templateId?: string): Promise {
    // This would be replaced with an actual API call
    // return this.client.post(`/api/connect/tickets/${ticketId}/schedule`, { date, startTime, endTime, templateId });

    return new Promise((resolve) => {
      setTimeout(() => {
        const ticket = MOCK_TICKETS.find((t) => t.id === ticketId);
        if (!ticket) throw new Error('Ticket not found');

        const updatedTicket = {
          ...ticket,
          scheduledDate: date,
          scheduledTimeStart: startTime,
          scheduledTimeEnd: endTime,
          scheduledDuration: 2, // Calculated from start/end time
          processTemplateId: templateId,
        };

        resolve(updatedTicket);
      }, 300);
    });
  }
}
