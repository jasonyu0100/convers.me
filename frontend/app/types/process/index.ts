/**
 * Process Types
 *
 * This file contains process-specific types that build on the base schema
 * and shared UI types. Process types represent templates that can be used
 * to generate events.
 */

import { BaseEvent, Step, SubStep } from '../shared';
import { ProcessSchema, StepSchema } from '../schema';

/**
 * Process interface for UI representation
 * Based on ProcessSchema but extended with UI-specific fields
 */
export interface Process extends ProcessSchema {
  steps?: ProcessesStep[];
  connectedEvents?: ConnectedEvent[];
  favorite?: boolean;
}

/**
 * Connected event to a process
 * Simplified representation of an event for display in process context
 */
export interface ConnectedEvent {
  id: string;
  name: string;
  date: string;
  time?: string;
  imageUrl?: string;
  participants: number;
  progress: number; // UI computed field (percentage)
  status?: string;
}

/**
 * Step in a process, using shared Step interface
 * Based on database StepSchema but with UI extensions
 */
export type ProcessesStep = Step;

/**
 * Sub-step in a process, using shared SubStep interface
 * Based on database SubStepSchema
 */
export type ProcessesSubStep = SubStep;

/**
 * Helper functions to convert between schema and UI types
 */
export const processConverters = {
  /**
   * Convert a database ProcessSchema to a UI Process object
   */
  schemaToProcess(processSchema: ProcessSchema, steps: ProcessesStep[] = [], connectedEvents: ConnectedEvent[] = []): Process {
    return {
      ...processSchema,
      steps,
      connectedEvents,
      favorite: false,
    };
  },

  /**
   * Convert UI Process to a database ProcessSchema for saving
   */
  processToSchema(process: Process): ProcessSchema {
    // Extract only the fields that belong in the database
    const { id, title, description, color, createdAt, updatedAt, lastUpdated, createdById } = process;

    return {
      id,
      title,
      description,
      color,
      createdAt,
      updatedAt,
      lastUpdated,
      createdById,
    };
  },
};
