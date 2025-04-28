export interface SchedulableRoom {
  id: string;
  title: string;
  duration: string;
  description: string;
  topics: string[];
  host: {
    name: string;
    role: string;
    avatarUrl: string;
  };
}

export interface ScheduleFormData {
  directoryId?: string;
  eventType: string;
  // New datetime fields
  startTime?: string; // ISO format date+time combined
  endTime?: string; // ISO format date+time combined
  // Legacy fields for backwards compatibility
  date?: string;
  time?: string;
  duration?: string;
  datetime?: string; // Legacy: ISO format date+time combined
}

export interface Directory {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface EventType {
  id: string;
  title: string;
  description: string;
  color: string;
  directoryId: string;
  directoryName: string;
  estimatedTime?: string;
  complexity?: number; // 1-5 scale based on steps/substeps
  tags?: string[];
}
