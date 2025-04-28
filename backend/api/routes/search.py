"""Search routes for the API."""

from enum import Enum
from typing import Annotated, List

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import or_
from sqlalchemy.orm import Session

from api.schemas.events import SchemaEventOut as EventOut
from api.schemas.posts import SchemaPostOut as PostOut
from api.schemas.processes import SchemaProcessOut as ProcessOut
from api.schemas.topics import SchemaTopicOut as TopicOut
from api.schemas.users import SchemaUserOut as UserOut
from api.security import get_current_user
from db.database import get_db
from db.models import Event, Post, Process, Topic, User

router = APIRouter(prefix="/search", tags=["search"])

class SearchEntityType(str, Enum):
    """Entity types that can be searched."""

    USER = "user"
    EVENT = "event"
    PROCESS = "process"
    POST = "post"
    TOPIC = "topic"
    ALL = "all"

class SearchResult(BaseModel):
    """Schema for a combined search result."""

    users: List[UserOut] = Field(default_factory=list)
    events: List[EventOut] = Field(default_factory=list)
    processes: List[ProcessOut] = Field(default_factory=list)
    posts: List[PostOut] = Field(default_factory=list)
    topics: List[TopicOut] = Field(default_factory=list)

@router.get("")
async def search(
    query: str = Query(..., description="Search query"),
    entity_type: SearchEntityType = Query(SearchEntityType.ALL, description="Entity type to search"),
    limit: int = Query(10, description="Maximum number of results per entity type"),
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """
    Search across multiple entity types.
    This endpoint provides a global search functionality across different entity types.
    """
    result = SearchResult()

    # Search users
    if entity_type in [SearchEntityType.USER, SearchEntityType.ALL]:
        users = (
            db.query(User)
            .filter(
                or_(
                    User.name.ilike(f"%{query}%"),
                    User.handle.ilike(f"%{query}%"),
                    User.email.ilike(f"%{query}%"),
                )
            )
            .limit(limit)
            .all()
        )
        result.users = [UserOut.model_validate(user) for user in users]

    # Search events
    if entity_type in [SearchEntityType.EVENT, SearchEntityType.ALL]:
        events = (
            db.query(Event)
            .filter(
                or_(
                    Event.title.ilike(f"%{query}%"),
                    Event.description.ilike(f"%{query}%"),
                )
            )
            .limit(limit)
            .all()
        )
        result.events = [EventOut.model_validate(event) for event in events]

    # Search processes
    if entity_type in [SearchEntityType.PROCESS, SearchEntityType.ALL]:
        processes = (
            db.query(Process)
            .filter(
                or_(
                    Process.title.ilike(f"%{query}%"),
                    Process.description.ilike(f"%{query}%"),
                )
            )
            .limit(limit)
            .all()
        )
        result.processes = [ProcessOut.model_validate(process) for process in processes]

    # Search posts
    if entity_type in [SearchEntityType.POST, SearchEntityType.ALL]:
        posts = db.query(Post).filter(Post.content.ilike(f"%{query}%")).limit(limit).all()
        result.posts = [PostOut.model_validate(post) for post in posts]

    # Search topics
    if entity_type in [SearchEntityType.TOPIC, SearchEntityType.ALL]:
        topics = db.query(Topic).filter(or_(Topic.name.ilike(f"%{query}%"), Topic.category.ilike(f"%{query}%"))).limit(limit).all()
        result.topics = [TopicOut.model_validate(topic) for topic in topics]

    return result

@router.get("/users")
async def search_users(
    query: str = Query(..., description="Search query"),
    limit: int = Query(20, description="Maximum number of results"),
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """Search for users."""
    users = (
        db.query(User)
        .filter(
            or_(
                User.name.ilike(f"%{query}%"),
                User.handle.ilike(f"%{query}%"),
                User.email.ilike(f"%{query}%"),
            )
        )
        .limit(limit)
        .all()
    )
    return [UserOut.model_validate(user) for user in users]

@router.get("/events")
async def search_events(
    query: str = Query(..., description="Search query"),
    limit: int = Query(20, description="Maximum number of results"),
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """Search for events."""
    events = db.query(Event).filter(or_(Event.title.ilike(f"%{query}%"), Event.description.ilike(f"%{query}%"))).limit(limit).all()
    return [EventOut.model_validate(event) for event in events]

@router.get("/processes")
async def search_processes(
    query: str = Query(..., description="Search query"),
    limit: int = Query(20, description="Maximum number of results"),
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """Search for processes."""
    processes = (
        db.query(Process)
        .filter(
            or_(
                Process.title.ilike(f"%{query}%"),
                Process.description.ilike(f"%{query}%"),
            )
        )
        .limit(limit)
        .all()
    )
    return [ProcessOut.model_validate(process) for process in processes]

@router.get("/posts")
async def search_posts(
    query: str = Query(..., description="Search query"),
    limit: int = Query(20, description="Maximum number of results"),
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """Search for posts."""
    posts = db.query(Post).filter(Post.content.ilike(f"%{query}%")).limit(limit).all()
    return [PostOut.model_validate(post) for post in posts]

@router.get("/topics")
async def search_topics(
    query: str = Query(..., description="Search query"),
    limit: int = Query(20, description="Maximum number of results"),
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """Search for topics."""
    topics = db.query(Topic).filter(or_(Topic.name.ilike(f"%{query}%"), Topic.category.ilike(f"%{query}%"))).limit(limit).all()
    return [TopicOut.model_validate(topic) for topic in topics]
