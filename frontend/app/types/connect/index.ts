/**
 * Connect page types
 */

import { BaseEntity, ProcessSchema } from '../schema';
import { Step, SubStep } from '../shared';

/**
 * Ticket source enum
 */
export enum TicketSource {
  GITHUB = 'github',
  JIRA = 'jira',
  ASANA = 'asana',
  MONDAY = 'monday',
  LINEAR = 'linear',
  INTERNAL = 'internal',
}

/**
 * Ticket priority enum
 */
export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

/**
 * Ticket interface representing work items from various sources
 */
export interface Ticket extends BaseEntity {
  title: string;
  description?: string;
  source: TicketSource;
  sourceId: string;
  priority: TicketPriority;
  dueDate?: string;
  estimatedHours?: number;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  labels?: string[];
  status: string;
  url?: string;
  processTemplateId?: string;
  scheduledDate?: string;
  scheduledTimeStart?: string;
  scheduledTimeEnd?: string;
  scheduledDuration?: number;
}

/**
 * Process template with steps
 */
export interface ProcessTemplate extends ProcessSchema {
  steps: Step[];
  subSteps?: SubStep[];
}

/**
 * Interface for the connect state managed by the context hook
 */
export interface ConnectState {
  tickets: Ticket[];
  filteredTickets: Ticket[];
  selectedTickets: string[];
  processTemplates: ProcessTemplate[];
  selectedTemplate?: string;
  weekDays: string[];
  currentSchedule: ScheduledTicket[];
  filterSource?: TicketSource;
  filterPriority?: TicketPriority;
  searchQuery: string;
  isLoading: boolean;
  error: Error | null;
}

/**
 * A ticket that has been scheduled for work
 */
export interface ScheduledTicket extends Ticket {
  scheduledDate: string;
  scheduledTimeStart: string;
  scheduledTimeEnd: string;
  scheduledDuration: number;
}
