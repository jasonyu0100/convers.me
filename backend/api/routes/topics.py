"""Topic routes for the API."""

from typing import Annotated, Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.schemas.topics import SchemaTopicCreate, SchemaTopicOut, SchemaTopicUpdate
from api.security import get_current_user
from db.database import get_db
from db.models import Topic, User

router = APIRouter(prefix="/topics", tags=["topics"])

# Health check endpoint
@router.get("/health", include_in_schema=True, response_model=Dict[str, Any])
async def health_check_topics():
    """Health check for the topics router."""
    from api.utils import check_router_health

    health_data = check_router_health("topics")
    return health_data

@router.post("", response_model=Dict[str, Any])
async def create_topic(topic: SchemaTopicCreate, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Create a new topic."""
    # Check if a topic with the same name already exists
    existing_topic = db.query(Topic).filter(Topic.name == topic.name).first()
    if existing_topic:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Topic with this name already exists")

    topic_data = topic.model_dump()
    new_topic = Topic(
        name=topic_data["name"],
        category=topic_data.get("category"),
        color=topic_data.get("color")
    )
    db.add(new_topic)
    db.commit()
    db.refresh(new_topic)
    return new_topic.to_dict()

@router.get("", response_model=List[Dict[str, Any]])
async def get_topics(db: Session = Depends(get_db), category: Optional[str] = None, skip: int = 0, limit: int = 100):
    """Get topics with optional category filtering."""
    query = db.query(Topic)

    # Filter by category if provided
    if category:
        query = query.filter(Topic.category == category)

    topics = query.offset(skip).limit(limit).all()
    # Convert to dictionaries to ensure proper UUID and metadata conversion
    return [topic.to_dict() for topic in topics]

@router.get("/{topic_id:uuid}", response_model=Dict[str, Any])
async def get_topic(topic_id: UUID, db: Session = Depends(get_db)):
    """Get a specific topic by ID."""
    topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")
    # Convert to dictionary to ensure proper UUID and metadata conversion
    return topic.to_dict()

@router.put("/{topic_id:uuid}", response_model=SchemaTopicOut)
async def update_topic(
    topic_id: UUID,
    topic_update: SchemaTopicUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Update a topic."""
    # Only allow admin users to update topics (for now)
    # In a real app, you'd implement proper admin role checking
    if current_user.email != "admin@convers.me":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin users can update topics")

    db_topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not db_topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    # Check for name conflicts if name is being updated
    if topic_update.name and topic_update.name != db_topic.name:
        existing_topic = db.query(Topic).filter(Topic.name == topic_update.name).first()
        if existing_topic:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Topic with this name already exists")

    # Update the topic fields
    for key, value in topic_update.model_dump(exclude_unset=True).items():
        setattr(db_topic, key, value)

    db.commit()
    db.refresh(db_topic)
    return db_topic.to_dict()

@router.delete("/{topic_id:uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_topic(topic_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Delete a topic."""
    # Only allow admin users to delete topics (for now)
    if current_user.email != "admin@convers.me":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin users can delete topics")

    db_topic = db.query(Topic).filter(Topic.id == topic_id).first()
    if not db_topic:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Topic not found")

    db.delete(db_topic)
    db.commit()
    return None
