import { AppColor, BaseEvent, EventColor, Participants } from '../shared';

/**
 * Calendar view modes
 */
export enum CalendarMode {
  MONTH = 'MONTH',
  WEEK = 'WEEK',
}

/**
 * Calendar event interface extending the base event interface
 */
export interface CalendarEvent extends BaseEvent {
  // Note: Calendar events don't support recurrence
}
