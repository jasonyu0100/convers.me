# Convers.me AI Integration Guide

## Backend Live AI Service

The backend now includes a dedicated OpenAI service for live sessions and process assistance.

### Key Features

1. **Process-Aware AI Assistant**: The backend AI service can understand, analyze, and suggest actions related to process SOPs.

2. **Suggested Operations**: When a user message is process-related, the AI can suggest relevant operations like completing steps or adding new steps.

3. **Rich Context Handling**: The system provides the AI with context about the process, including steps, substeps, and completion status.

4. **Streaming Support**: Both the backend and frontend support message streaming for real-time responses.

5. **Transcription and Processing**: The frontend still handles audio transcription, but message processing has been moved to the backend.

### Technical Implementation

- Backend AI service lives in `backend/api/lib/live/ai_service.py`
- Routes for live functionality in `backend/api/routes/live.py`
- Frontend integration in `frontend/app/(routes)/live/hooks/useLive.tsx`

### Environment Setup

The system requires an OpenAI API key in the environment variables:

```
OPENAI_API_KEY=your_openai_api_key
```

## Usage Instructions

1. Select a process when creating a live session to enable process-specific assistance.
2. Use voice or text input to interact with the AI assistant.
3. The AI will recognize process-related requests and suggest appropriate operations.
4. View suggested operations in the transcript panel.

## Future Improvements

- Implementing streaming responses from the backend
- Adding support for file/image analysis during live sessions
- Enhanced operation execution with automatic process updates
