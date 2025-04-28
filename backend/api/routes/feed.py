"""Feed routes for the API."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, or_
from sqlalchemy.orm import Session, joinedload

from api.schemas.feed import SchemaFeedItem, SchemaFeedItemType, SchemaFeedResponse, SchemaUserOut
from api.security import get_current_user
from db.database import get_db
from db.models import Event, EventParticipant, Post, User

router = APIRouter(prefix="/feed", tags=["feed"])

@router.get("", response_model=SchemaFeedResponse)
async def get_feed(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    limit: int = Query(20, description="Maximum number of results"),
    offset: int = Query(0, description="Pagination offset"),
    include_events: bool = Query(True, description="Include event-related posts"),
    include_processes: bool = Query(True, description="Include process-related posts"),
):
    """
    Get the user's feed of posts.
    This endpoint returns a chronological feed of posts, optionally including event and process posts.
    """
    # Query for posts with author and media
    query = (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.media))
        .filter(
            # For now, show all public posts
            Post.visibility == "public"
        )
        .order_by(desc(Post.created_at))
        .offset(offset)
        .limit(limit)
    )

    posts = query.all()

    # Convert posts to FeedItems
    feed_items = []
    for post in posts:
        # Skip if author is missing
        if not post.author:
            print(f"Warning: Post {post.id} has no author, skipping from feed")
            continue

        # Create author dict
        author_dict = {
            "id": str(post.author.id),
            "name": post.author.name,
            "handle": post.author.handle,
            "profile_image": post.author.profile_image
        }

        # Create content dict for the post
        content_dict = {
            "id": str(post.id),
            "content": post.content,
            "visibility": post.visibility,
            "event_id": str(post.event_id) if post.event_id else None,
            "author_id": str(post.author.id),
            "time_ago": "recently", # Placeholder - would calculate in real implementation
        }

        # Add media data if available
        if post.media:
            content_dict["media"] = {
                "type": post.media[0].type if post.media else None,
                "url": post.media[0].url if post.media else None,
                "title": post.media[0].title if post.media else None,
            }

        # Create feed item
        feed_item = SchemaFeedItem(
            id=str(post.id),
            type=SchemaFeedItemType.POST,
            createdAt=post.created_at,
            author=SchemaUserOut(**author_dict),
            feedMetadata=content_dict
        )

        feed_items.append(feed_item)

    # Construct the response with FeedItems
    response = SchemaFeedResponse(
        items=feed_items,
        hasMore=len(posts) >= limit,
        nextCursor=str(offset + limit) if len(posts) >= limit else None
    )

    return response

@router.get("/user/{user_id:uuid}", response_model=SchemaFeedResponse)
async def get_user_feed(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    limit: int = Query(20, description="Maximum number of results"),
    offset: int = Query(0, description="Pagination offset"),
):
    """Get posts for a specific user."""
    # Query for posts with author and media
    query = (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.media))
        .filter(
            Post.author_id == user_id,
            # Only show public posts or posts the current user has access to
            or_(Post.visibility == "public", Post.author_id == current_user.id),
        )
        .order_by(desc(Post.created_at))
        .offset(offset)
        .limit(limit)
    )

    posts = query.all()

    # Convert posts to FeedItems
    feed_items = []
    for post in posts:
        # Skip if author is missing
        if not post.author:
            print(f"Warning: Post {post.id} has no author, skipping from feed")
            continue

        # Create author dict
        author_dict = {
            "id": str(post.author.id),
            "name": post.author.name,
            "handle": post.author.handle,
            "profile_image": post.author.profile_image
        }

        # Create content dict for the post
        content_dict = {
            "id": str(post.id),
            "content": post.content,
            "visibility": post.visibility,
            "event_id": str(post.event_id) if post.event_id else None,
            "time_ago": "recently",  # Placeholder - would calculate in real implementation
        }

        # Add media data if available
        if post.media:
            content_dict["media"] = {
                "type": post.media[0].type if post.media else None,
                "url": post.media[0].url if post.media else None,
                "title": post.media[0].title if post.media else None,
            }

        # Create feed item
        feed_item = SchemaFeedItem(
            id=str(post.id),
            type=SchemaFeedItemType.POST,
            createdAt=post.created_at,
            author=SchemaUserOut(**author_dict),
            feedMetadata=content_dict
        )

        feed_items.append(feed_item)

    # Construct the response with FeedItems
    response = SchemaFeedResponse(
        items=feed_items,
        hasMore=len(posts) >= limit,
        nextCursor=str(offset + limit) if len(posts) >= limit else None
    )

    return response

@router.get("/event/{event_id:uuid}", response_model=SchemaFeedResponse)
async def get_event_feed(
    event_id: UUID,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    limit: int = Query(20, description="Maximum number of results"),
    offset: int = Query(0, description="Pagination offset"),
):
    """Get posts for a specific event."""
    # Check if user has access to the event
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")

    # Check if user is a participant or creator
    is_participant = db.query(EventParticipant).filter(EventParticipant.event_id == event_id, EventParticipant.user_id == current_user.id).first() is not None

    is_creator = event.created_by_id == current_user.id

    if not (is_participant or is_creator):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this event's feed")

    # Query for posts with author and media
    query = (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.media))
        .filter(Post.event_id == event_id)
        .order_by(desc(Post.created_at))
        .offset(offset)
        .limit(limit)
    )

    posts = query.all()

    # Convert posts to FeedItems
    feed_items = []
    for post in posts:
        # Skip if author is missing
        if not post.author:
            print(f"Warning: Post {post.id} has no author, skipping from feed")
            continue

        # Create author dict
        author_dict = {
            "id": str(post.author.id),
            "name": post.author.name,
            "handle": post.author.handle,
            "profile_image": post.author.profile_image
        }

        # Create content dict for the post
        content_dict = {
            "id": str(post.id),
            "content": post.content,
            "visibility": post.visibility,
            "event_id": str(post.event_id) if post.event_id else None,
            "time_ago": "recently",  # Placeholder - would calculate in real implementation
        }

        # Add media data if available
        if post.media:
            content_dict["media"] = {
                "type": post.media[0].type if post.media else None,
                "url": post.media[0].url if post.media else None,
                "title": post.media[0].title if post.media else None,
            }

        # Create feed item
        feed_item = SchemaFeedItem(
            id=str(post.id),
            type=SchemaFeedItemType.POST,
            createdAt=post.created_at,
            author=SchemaUserOut(**author_dict),
            feedMetadata=content_dict
        )

        feed_items.append(feed_item)

    # Construct the response with FeedItems
    response = SchemaFeedResponse(
        items=feed_items,
        hasMore=len(posts) >= limit,
        nextCursor=str(offset + limit) if len(posts) >= limit else None
    )

    return response

@router.get("/activity", response_model=SchemaFeedResponse)
async def get_activity_feed(
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    limit: int = Query(20, description="Maximum number of results"),
    offset: int = Query(0, description="Pagination offset"),
):
    """
    Get the user's activity feed.
    This is a combined feed of posts, events, and process updates in chronological order.
    """
    # Get posts by or for the current user
    posts_query = (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.media))
        .filter(
            # Posts authored by the current user or visible to them
            or_(
                Post.author_id == current_user.id,
                Post.visibility == "public"
            )
        )
        .order_by(desc(Post.created_at))
        .limit(limit)
    )

    posts = posts_query.all()

    # Get the current user's events
    events_query = (
        db.query(Event)
        .options(joinedload(Event.topics))
        .filter(
            # Events created by the user or where they're a participant
            or_(
                Event.created_by_id == current_user.id,
                Event.id.in_(
                    db.query(EventParticipant.event_id)
                    .filter(EventParticipant.user_id == current_user.id)
                    .subquery()
                )
            )
        )
        .order_by(desc(Event.created_at))
        .limit(limit)
    )

    events = events_query.all()

    # Convert posts to FeedItems
    feed_items = []

    # Add posts to feed items
    for post in posts:
        # Skip if author is missing
        if not post.author:
            print(f"Warning: Post {post.id} has no author, skipping from feed")
            continue

        # Create author dict
        author_dict = {
            "id": str(post.author.id),
            "name": post.author.name,
            "handle": post.author.handle,
            "profile_image": post.author.profile_image
        }

        # Create content dict for the post
        content_dict = {
            "id": str(post.id),
            "content": post.content,
            "visibility": post.visibility,
            "event_id": str(post.event_id) if post.event_id else None,
            "time_ago": "recently",  # Placeholder - would calculate in real implementation
        }

        # Add media data if available
        if post.media:
            content_dict["media"] = {
                "type": post.media[0].type if post.media else None,
                "url": post.media[0].url if post.media else None,
                "title": post.media[0].title if post.media else None,
            }

        # Create FeedItem for post
        feed_item = FeedItem(
            id=str(post.id),
            type=FeedItemType.POST,
            content=content_dict,
            created_at=post.created_at,
            author=author_dict
        )

        feed_items.append(feed_item)

    # Add events to feed items
    for event in events:
        # Skip if creator is missing
        if not hasattr(event, 'created_by') or not event.created_by:
            # Try to get creator info directly
            creator = db.query(User).filter(User.id == event.created_by_id).first()
            if not creator:
                continue

            author_dict = {
                "id": str(creator.id),
                "name": creator.name,
                "handle": creator.handle,
                "profile_image": creator.profile_image
            }
        else:
            # Use created_by if available
            author_dict = {
                "id": str(event.created_by.id),
                "name": event.created_by.name,
                "handle": event.created_by.handle,
                "profile_image": event.created_by.profile_image
            }

        # Create content dict for the event
        content_dict = {
            "id": str(event.id),
            "title": event.title,
            "description": event.description,
            "date": event.date,
            "time": event.time,
            "status": event.status.value if hasattr(event.status, 'value') else str(event.status),
            "time_ago": "recently",  # Placeholder - would calculate in real implementation
        }

        # Add topics if available
        if event.topics:
            content_dict["topics"] = [topic.name for topic in event.topics]

        # Create feed item for event
        feed_item = SchemaFeedItem(
            id=str(event.id),
            type=SchemaFeedItemType.EVENT,
            createdAt=event.created_at,
            author=SchemaUserOut(**author_dict),
            feedMetadata=content_dict
        )

        feed_items.append(feed_item)

    # Sort all feed items by createdAt (newest first)
    feed_items.sort(key=lambda item: item.createdAt, reverse=True)

    # Apply pagination
    paginated_items = feed_items[offset:offset + limit] if feed_items else []

    # Construct the response with combined and sorted FeedItems
    response = SchemaFeedResponse(
        items=paginated_items,
        hasMore=len(feed_items) > offset + limit,
        nextCursor=str(offset + limit) if len(feed_items) > offset + limit else None
    )

    return response
