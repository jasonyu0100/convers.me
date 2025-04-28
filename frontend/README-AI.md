# Convers.me Frontend - AI Development Guide

This guide provides an overview of the AI components in the Convers.me frontend application, how they're structured, and how to extend them.

## Overview

The frontend application integrates with OpenAI's APIs to provide:

- Real-time speech transcription
- AI-assisted conversations
- Text-to-speech capabilities
- Conversation summarization
- Process-aware assistance

## Key Components

### Live Meeting Feature (`/app/(routes)/live/`)

The live meeting feature is the primary AI-enabled component, which includes:

- **LiveView.tsx**: Main container for live meeting experience
- **LiveTranscript.tsx**: Displays real-time transcription
- **LiveMediaView.tsx**: Handles media sharing
- **MessageInput.tsx**: Manages text and voice input for the conversation
- **AudioWaveform.tsx**: Visualizes audio input

### AI Services

#### Frontend Services (`/app/(routes)/live/services/`)

- **openAIService.ts**: Core service for OpenAI API integration

  - Provides speech-to-text, completions, and text-to-speech
  - Manages conversation history and context
  - Handles streaming responses

- **audioRecorder.ts**: Manages audio input and processing
  - Records and chunks audio for real-time transcription
  - Provides audio stream management

#### Backend Services (`/backend/api/lib/live/`)

- **ai_service.py**: Backend AI service for live interactions
  - Process-aware AI assistance
  - Function calling for process operations
  - Supports both synchronous and asynchronous API calls
  - Context management with database persistence

### Hooks and UI Integration

- **useLive.tsx**: Primary hook for AI conversation state

  - Manages conversation flow
  - Handles AI responses and user input
  - Controls audio recording and playback
  - Interfaces with backend AI services

- **LiveSidePanel.tsx**: Side panel controls for AI interactions
  - Media controls for audio playback
  - Live summaries and generated content
  - Audio visualization and recording controls

### Types (`/app/types/live/index.ts`)

The application includes TypeScript definitions for AI-related data structures:

```typescript
// AI Message Types
interface AIMessageBase {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface AIUserMessage extends AIMessageBase {
  role: 'user';
  audioUrl?: string;
}

interface AIAssistantMessage extends AIMessageBase {
  role: 'assistant';
  audioUrl?: string;
  isStreaming?: boolean;
}

interface AISystemMessage extends AIMessageBase {
  role: 'system';
}

type AIMessage = AIUserMessage | AIAssistantMessage | AISystemMessage;

// AI Service Configuration
interface AIServiceConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  stream: boolean;
  ttsVoice: string;
}

// Transcript Types
interface TranscriptSegment {
  id: string;
  text: string;
  speaker: string;
  startTime: number;
  endTime: number;
  isProcessing?: boolean;
}

// Process-aware AI Types
interface LiveOperation {
  operation: 'complete_step' | 'add_step' | 'add_substep' | 'update_step';
  description: string;
  processId: string;
  stepId?: string;
  subStepId?: string;
  content?: string;
  completed?: boolean;
  order?: number;
}

interface LiveResponse {
  response: string;
  contextId: string;
  suggestedOperations?: LiveOperation[];
  processModifications?: any;
  metadata?: Record;
}
```

## Frontend-Backend Integration

The Live feature uses a hybrid architecture with:

1. **Frontend AI processing**: Direct speech-to-text and basic interactions
2. **Backend AI services**: Context-aware processing and persistent storage
3. **Stateful conversation contexts**: Stored in the database for continuity
4. **Function calling**: AI suggests process operations for users to approve

### API Routes for Live AI

```typescript
// Frontend service code for backend AI integration
async function processMessage(message: string, contextId?: string, processId?: string): Promise {
  const response = await fetch('/api/live/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      message,
      contextId,
      processId,
    }),
  });

  return response.json();
}

// Handle suggested operations
async function performOperation(operation: LiveOperation): Promise {
  const response = await fetch('/api/live/operation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(operation),
  });

  return response.json();
}
```

## Integration Points

To extend AI capabilities:

1. **Add new AI models or providers**:

   - Extend the openAIService.ts or create new service modules
   - Implement similar interface for compatibility

2. **Enhance conversation context**:

   - Modify the system prompts in openAIService.ts
   - Add additional context from other application areas
   - Update the backend's LiveAIService.get_system_prompt() method

3. **Add new process-aware features**:

   - Extend the function definitions in the backend LiveAIService
   - Add new operation types to the LiveOperation interface
   - Implement handlers for new operations in the frontend

4. **Add new media processing capabilities**:
   - Extend the audioRecorder.ts for additional audio features
   - Add image or video processing to the media pipeline

## Environment Setup

The application requires OpenAI API keys set in environment variables:

- Frontend:

  - `NEXT_PUBLIC_OPENAI_API_KEY`: For direct frontend OpenAI API calls
  - `NEXT_PUBLIC_OPENAI_MODEL`: Default model to use (e.g., gpt-4o)

- Backend:
  - `OPENAI_API_KEY`: For backend OpenAI API calls
  - `AI_MODEL_DEFAULT`: Default model to use (e.g., gpt-4-turbo)

## Implementation Details

### Audio Processing

```typescript
// Example flow for audio processing
// 1. Record audio chunks
audioRecorder.startRecording();

// 2. Process audio chunks for transcription
const audioChunk = audioRecorder.getLatestChunk();
const transcript = await openAIService.transcribe(audioChunk);

// 3. Use transcript for AI processing
const response = await openAIService.chat(transcript);

// 4. Convert AI response to speech
const audio = await openAIService.textToSpeech(response);
```

### Process-Aware AI

```typescript
// Example flow for process-aware AI interactions
// 1. Get the process context
const processContext = await getProcessContext(processId);

// 2. Send user message with process context
const response = await liveService.processMessage(message, contextId, processId);

// 3. Handle suggested operations
if (response.suggestedOperations && response.suggestedOperations.length > 0) {
  // Display suggested operations to user
  const approved = await confirmOperations(response.suggestedOperations);

  // Execute approved operations
  if (approved) {
    for (const operation of response.suggestedOperations) {
      await liveService.performOperation(operation);
    }
  }
}
```

### System Prompts

The application uses specific system prompts to guide AI behavior:

- **Meeting Assistant**: A prompt that guides the AI to act as a meeting assistant
- **Process Assistant**: A prompt that helps users follow and update process steps
- **Summarization**: A prompt that instructs AI to summarize meeting content
- **Transcription**: Configuration for speech-to-text accuracy

## Testing AI Features

1. Create a `.env.local` file with your OpenAI API key
2. Run the application in development mode
3. Navigate to the Live meeting section
4. Test speech recognition, AI responses, and text-to-speech
5. Try process-aware assistance by selecting a process

## Development Best Practices

1. **Error Handling**: Always handle API failures gracefully
2. **Resource Management**: Clean up audio resources when components unmount
3. **Streaming**: Prefer streaming responses for better UX
4. **Fallbacks**: Implement fallbacks for when AI services are unavailable
5. **Context Size Management**: Monitor token usage and truncate conversation histories when needed

## Plan Feature Integration

The Plan feature leverages AI integration to help users generate optimized weekly schedules:

### Components

- **PlanView.tsx**: Main container for plan generation
- **PlanForm.tsx**: Form to collect user preferences for plan generation
- **PlanSchedule.tsx**: Displays the AI-generated weekly schedule
- **usePlan.tsx**: Hook for managing plan generation state

### Plan Generation Flow

```typescript
// Example flow for plan generation
// 1. Collect user preferences
const planRequest = {
  description: 'Focused development sprint',
  goals: 'Complete API integration and unit tests',
  effort: 'medium',
  hoursAllocation: 30,
  directoryIds: ['dir-123', 'dir-456'],
  templateIds: ['template-789'],
};

// 2. Generate plan with appropriate templates
const planResponse = await PlanService.generatePlan(planRequest);

// 3. Save to calendar if the user accepts the plan
await PlanService.savePlan({ events: planResponse.events });
```

### AI Prompting Strategy

Behind the scenes, the plan feature uses AI to:

1. Analyze the user's goals and description
2. Select appropriate templates based on the content
3. Optimize scheduling based on effort level
4. Generate appropriate titles and descriptions for events

## Future Enhancement Opportunities

Potential areas for AI expansion:

- Sentiment analysis of conversations
- Enhanced meeting summarization
- Integration with other application features
- Support for additional AI providers
- Use of text-embedding-3-small for content similarity and search
- Implementation of function calling for structured AI outputs
- Personalized AI responses based on user preferences
- Advanced plan optimization with learning from user feedback
- Multi-modal interactions with image and document understanding

## AI Feature Roadmap

1. **Meeting Insights**: Automated analysis of meeting content
2. **AI-Generated Reports**: Post-meeting report generation
3. **Smart Scheduling**: AI-assisted meeting scheduling
4. **Custom AI Assistants**: Specialized AI roles for different meeting types
5. **Intelligent Plan Generation**: Enhanced weekly planning with AI learning
6. **Cross-Process Intelligence**: AI suggestions based on patterns across processes
