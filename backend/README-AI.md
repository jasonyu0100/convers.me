# Convers.me Backend - AI Integration Guide

This guide outlines how to integrate and extend AI capabilities with the Convers.me backend.

## AI Vision and Strategy

The Convers.me platform aims to provide AI-enhanced collaboration and communication features through:

1. **Conversation Intelligence**: Automated transcription, summarization, and insights from live conversations
2. **Process Optimization**: AI-assisted workflow recommendations and optimizations
3. **Content Enhancement**: Smart content generation and improvement suggestions
4. **Predictive Analytics**: Forward-looking insights based on historical data patterns

## Current AI Architecture

The Convers.me platform uses a hybrid architecture for AI features:

- **Frontend-heavy AI processing**: Direct API calls to OpenAI from the frontend
- **Backend persistence**: Storage of AI-generated content and metadata
- **Asynchronous processing**: Background tasks for non-interactive AI operations

## Integration Points

### Live AI Service

The platform now includes a dedicated AI service for live interactions:

```
/backend/api/lib/live/ai_service.py
/backend/api/routes/live.py
```

This service:

- Processes live conversation contexts
- Generates AI responses to user messages
- Provides process-aware assistance with step management
- Uses OpenAI's function calling for structured operations
- Supports both synchronous and asynchronous API calls

### Media Processing Pipeline

The backend includes a media processing pipeline that can be extended for AI operations:

```
/backend/tasks/media_processing_tasks.py
```

This is ideal for:

- Image analysis and tagging
- Audio transcription (server-side)
- Video content analysis
- Document processing and indexing

### Plan Generation System

The platform now includes an AI-powered plan generation system:

```
/backend/api/routes/plan.py
/backend/api/schemas/plan.py
```

This system:

- Generates weekly schedules based on user goals and preferences
- Intelligently allocates time across the week based on effort level
- Creates properly structured events with process connections
- Optimizes the schedule based on selected templates and directories

### Event and Process Templates

The process and event system provides hooks for AI integration:

```
/backend/services/process/process_service.py
/backend/services/process/template_service.py
```

Potential AI extensions:

- Automated process recommendations
- Smart template generation
- Optimized process flows based on historical data

### Insights System

The insights module already processes user activity data and can be extended with AI:

```
/backend/api/routes/progress/
/backend/api/lib/progress/
```

AI enhancement opportunities:

- Predictive analytics
- Anomaly detection
- Personalized recommendations
- Performance forecasting

## Backend Environment Setup for AI

1. Add the following to your `.env` file:

```
OPENAI_API_KEY=your_openai_api_key
AI_PROVIDER=openai  # For future provider switching
AI_MODEL_DEFAULT=gpt-4o
AI_EMBEDDING_MODEL=text-embedding-3-small
AI_IMAGE_MODEL=dall-e-3
VECTOR_DB_URL=your_vector_db_connection_string  # If using embeddings
```

2. Install the required dependencies:

Add to `requirements.txt`:

```
openai==1.21.0
langchain==0.1.3  # Optional, for higher-level abstractions
pgvector==0.2.5  # Optional, for vector storage
```

Then install with uv:

```bash
uv pip install -r requirements.txt
```

## Live AI Service Implementation

The platform's new Live AI Service handles real-time AI interactions:

```python
# /backend/api/lib/live/ai_service.py

class LiveAIService:
    """Live AI service for handling AI interactions."""

    def __init__(self):
        """Initialize the AI service."""
        # Get API key from environment variable
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            logger.warning("OPENAI_API_KEY not set in environment variables.")

        self.sync_client = OpenAI(api_key=api_key)
        self.async_client = AsyncOpenAI(api_key=api_key)
        self.model = "gpt-4-turbo"

    def get_system_prompt(self, process_info: Optional[Dict[str, Any]] = None) -> str:
        """Generate a system prompt based on the process information."""
        # Base prompt definition
        # Process-specific context enhancement
        # Return tailored system prompt

    async def process_message_async(self, message: str,
                               context_messages: List[Dict[str, Any]],
                               process_info: Optional[Dict[str, Any]] = None) -> Tuple[str, List[Dict[str, Any]]]:
        """Process a message and return an AI response using async API."""
        # Format messages for OpenAI
        # Use function calling to detect process-related requests
        # Generate AI response
        # Return response text and suggested operations
```

The Live route implementation integrates this service:

```python
# /backend/api/routes/live.py

@router.post("/message", response_model=SchemaLiveResponse)
async def process_live_message(
    message: SchemaLiveMessage,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Process a live message and generate a response using OpenAI."""
    # Get or create the context
    # Add user message to the context
    # Get process info if available

    # Process message with AI service
    response_text, suggested_operations = await live_ai_service.process_message_async(
        message.message,
        context.messages.copy(),  # Pass a copy to avoid mutation
        process_info
    )

    # Add AI response to context
    # Return the response
```

## Function Calling for Process Automation

The Live AI Service includes structured function calling for process operations:

```python
function_def = {
    "name": "suggest_process_actions",
    "description": "Suggest actions to take on the process based on user input",
    "parameters": {
        "type": "object",
        "properties": {
            "is_process_related": {
                "type": "boolean",
                "description": "Whether the user message is related to the process"
            },
            "suggested_operations": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "operation": {
                            "type": "string",
                            "enum": ["complete_step", "add_step", "add_substep", "update_step"],
                            "description": "Type of operation to perform"
                        },
                        "description": {
                            "type": "string",
                            "description": "Human-readable description of the operation"
                        },
                        "step_id": {
                            "type": "string",
                            "description": "ID of the step to modify (if applicable)"
                        },
                        "substep_id": {
                            "type": "string",
                            "description": "ID of the substep to modify (if applicable)"
                        },
                        "content": {
                            "type": "string",
                            "description": "Content to add or update (if applicable)"
                        }
                    },
                    "required": ["operation", "description"]
                },
                "description": "List of suggested operations based on the user message"
            }
        },
        "required": ["is_process_related"]
    }
}
```

This allows the AI to suggest specific process operations that can be automatically executed.

## API Routes for AI Features

The platform implements several AI-related routes:

### Plan Generation Route

The `/plan` endpoint provides AI-driven planning capabilities:

```python
# /backend/api/routes/plan.py

@router.post("/generate", response_model=SchemaPlanGenerateResponse)
async def generate_plan(
    request: SchemaPlanGenerateRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """
    Generate a weekly plan based on the provided parameters.

    Args:
        request: Plan generation parameters including goals, effort level, and templates
        current_user: Authenticated user
        db: Database session

    Returns:
        Generated events for the plan
    """
    # Validation and plan generation logic
    # ...

    # Generate optimized schedule based on user preferences
    # ...

    return SchemaPlanGenerateResponse(
        events=generated_events,
        summary=summary
    )
```

### AI Completion Example

Create general-purpose AI routes as needed:

```python
# /backend/api/routes/ai.py

from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any

from api.security import get_current_user
from services.ai.ai_service import AIService
from api.schemas.ai import AICompletionRequest, AICompletionResponse

router = APIRouter(prefix="/ai", tags=["AI"])

@router.post("/completion", response_model=AICompletionResponse)
async def generate_completion(
    request: AICompletionRequest,
    current_user = Depends(get_current_user),
    ai_service: AIService = Depends()
):
    """Generate AI text completion"""
    try:
        completion = await ai_service.generate_completion(
            prompt=request.prompt,
            user_id=current_user.id,
            model=request.model
        )
        return {"completion": completion}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI completion failed: {str(e)}")
```

## Schema Definitions

The platform uses various Pydantic schemas for AI-powered features:

### Live Service Schemas

```python
# /backend/api/schemas/live.py

class SchemaLiveMessage(APIBaseModel):
    """Message for live processing."""

    message: str = Field(description="The message to process")
    contextId: Optional[str] = Field(default=None, description="ID of an existing conversation context")
    processId: Optional[str] = Field(default=None, description="Related process ID")
    eventId: Optional[str] = Field(default=None, description="Related event ID")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")

class SchemaLiveOperation(APIBaseModel):
    """Operation to perform on a process during a live session."""

    operation: str = Field(description="Type of operation")
    processId: str = Field(description="ID of the process")
    stepId: Optional[str] = Field(default=None, description="ID of the step")
    subStepId: Optional[str] = Field(default=None, description="ID of the substep")
    content: Optional[str] = Field(default=None, description="Content for add/update operations")
    completed: Optional[bool] = Field(default=None, description="Completion status")
    order: Optional[int] = Field(default=None, description="Order value")

class SchemaLiveResponse(APIBaseModel):
    """Response from the live message processing."""

    response: str = Field(description="AI response text")
    contextId: str = Field(description="ID of the conversation context")
    suggestedOperations: Optional[List[Dict[str, Any]]] = Field(default=None, description="Suggested operations")
    processModifications: Optional[Dict[str, Any]] = Field(default=None, description="Process modifications")
    metadata: Optional[Dict[str, Any]] = Field(default={}, description="Additional metadata")
```

### Plan Generation Schemas

```python
# /backend/api/schemas/plan.py

from datetime import datetime
from typing import List, Optional
from pydantic import Field

from api.schemas.base import APIBaseModel
from db.models import EventStatusEnum

class SchemaPlanEvent(APIBaseModel):
    """Event generated as part of a plan."""

    id: str = Field(description="Event ID")
    title: str = Field(description="Event title")
    description: str = Field(description="Event description")
    processId: str = Field(description="Associated process ID")
    startTime: datetime = Field(description="Event start time")
    endTime: datetime = Field(description="Event end time")
    effort: str = Field(description="Effort level (low, medium, high)")
    status: Optional[EventStatusEnum] = Field(default=EventStatusEnum.PENDING)

class SchemaPlanGenerateRequest(APIBaseModel):
    """Request for generating a plan."""

    description: str = Field(description="Plan description")
    goals: str = Field(description="Plan goals")
    effort: str = Field(description="Overall effort level")
    hoursAllocation: int = Field(description="Hours allocated per week")
    directoryIds: List[str] = Field(default_factory=list)
    templateIds: Optional[List[str]] = Field(default=None)

class SchemaPlanGenerateResponse(APIBaseModel):
    """Response for plan generation."""

    events: List[SchemaPlanEvent] = Field(description="Generated events")
    summary: Optional[str] = Field(default=None)
```

## Background Processing for AI

Set up background tasks for long-running AI operations:

```python
# /backend/tasks/ai_tasks.py

from celery import shared_task
from openai import OpenAI

from db.database import SessionLocal
from db.models import Post, Media
from services.ai.ai_service import AIService

client = OpenAI()

@shared_task(name="tasks.ai.generate_post_tags")
def generate_post_tags(post_id: str):
    """Automatically generate tags for a post using AI"""
    db = SessionLocal()
    try:
        post = db.query(Post).filter(Post.id == post_id).first()

        # Skip if no content
        if not post or not post.content:
            return

        # Generate tags
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a tagging assistant. Extract 3-5 relevant tags from the content."},
                {"role": "user", "content": post.content}
            ],
            temperature=0.3
        )

        # Parse and save tags
        tags_text = response.choices[0].message.content
        tags = [tag.strip() for tag in tags_text.split(',')]

        # Update post with tags
        # Implementation depends on how tags are stored

    finally:
        db.close()
```

## Testing AI Features

Create tests for AI integrations:

```python
# /backend/tests/api/test_ai.py

import pytest
from fastapi.testclient import TestClient

from app import app
from api.schemas.ai import AICompletionRequest, AICompletionResponse

@pytest.mark.asyncio
async def test_ai_completion(test_client, test_user):
    """Test AI completion endpoint"""
    # Login
    login_response = test_client.post(
        "/auth/token",
        data={"username": test_user["email"], "password": test_user["password"]}
    )

    token = login_response.json()["access_token"]

    # Test AI completion
    request = AICompletionRequest(prompt="Summarize what makes a good meeting")

    response = test_client.post(
        "/ai/completion",
        json=request.model_dump(),
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert "completion" in data
    assert len(data["completion"]) > 0
```

## Development Guidance

### AI Cost Management

1. Implement rate limiting for AI endpoints
2. Use tiered models (smaller models for less critical tasks)
3. Cache common responses
4. Add usage tracking and monitoring

### Security Considerations

1. Sanitize all user inputs before passing to AI
2. Implement prompt injection protection
3. Set up content filtering for sensitive information
4. Store API keys securely in environment variables

### Performance Optimization

1. Use background tasks for non-interactive AI operations
2. Implement response caching for common queries
3. Consider using smaller models for faster response times
4. Use streaming responses for long-form content generation

## Data Pipeline for AI Training

To improve AI capabilities over time, implement a data pipeline:

1. **Data Collection**: Gather anonymized conversation data (with consent)
2. **Data Processing**: Clean and structure the data for training
3. **Fine-tuning**: Use collected data to fine-tune models for specific use cases
4. **Evaluation**: Measure model performance improvements
5. **Deployment**: Roll out improved models to production

## Ethical AI Guidelines

When implementing AI features:

1. **Transparency**: Clearly communicate to users when AI is being used
2. **Privacy**: Minimize data collection and ensure proper anonymization
3. **Fairness**: Test for and mitigate biases in AI responses
4. **User Control**: Allow users to opt-out of AI features
5. **Accountability**: Implement monitoring and feedback mechanisms
