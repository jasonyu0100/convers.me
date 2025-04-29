export enum LiveMode {
  VOICE = 'voice',
  IN = 'input',
  OUT = 'output',
  OFF = 'off',
}

export enum MediaControlState {
  ON = 'on',
  OFF = 'off',
  LOADING = 'loading',
}

export interface TranscriptEntry {
  id: string;
  time: string;
  speaker: string;
  text: string;
  isAI?: boolean;
  isStreaming?: boolean;
}

export interface TranscriptSection {
  section: string;
  entries: TranscriptEntry[];
}

export interface TranscriptData {
  sections: TranscriptSection[];
}

export interface StreamParticipant {
  id: string;
  name: string;
  isLocal?: boolean;
  isAI?: boolean;
}

export interface StreamProps {
  participant: StreamParticipant;
  isVideo?: boolean;
}

export interface ModeButtonProps {
  mode: LiveMode;
  label: string;
  ariaLabel?: string;
}

export interface LiveModeOption {
  mode: LiveMode;
  label: string;
  ariaLabel?: string;
}

export interface MediaControls {
  camera: MediaControlState;
  microphone: MediaControlState;
  screen: MediaControlState;
  toggleCamera: () => Promise;
  toggleMicrophone: () => Promise;
  toggleScreenShare: () => Promise;
}

export interface LiveTranscription {
  entries: TranscriptEntry[];
  isRecording: boolean;
  startRecording: () => Promise;
  stopRecording: () => void;
  currentSpeakerText: string;
}

export interface AIConversation {
  messages: TranscriptEntry[];
  isProcessing: boolean;
  sendMessage: (text: string) => Promise;
  clearConversation: () => void;
}

export interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isDisabled?: boolean;
  placeholder?: string;
}

// Backend API related types
export interface LiveContext {
  id: string;
  userId: string;
  processId?: string;
  eventId?: string;
  templateId?: string;
  messages: LiveMessage[];
  metadata: Record;
  createdAt: string;
  updatedAt?: string;
}

export interface LiveMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface LiveResponse {
  response: string;
  contextId: string;
  processModifications?: LiveOperation[];
  suggestedOperations?: LiveOperation[];
  metadata?: Record;
}

export interface LiveOperation {
  operation: 'complete_step' | 'add_step' | 'add_substep' | 'update_step';
  processId: string;
  stepId?: string;
  subStepId?: string;
  content?: string;
  completed?: boolean;
  order?: number;
  metadata?: Record;
  description?: string;
}

export interface LiveProcessContext {
  process: {
    id: string;
    title: string;
    description?: string;
    steps?: Array;
  };
  relatedEvents: any[];
  recentMessages: LiveMessage[];
  userPreferences?: any;
}
