"""Post routes for the API."""

from typing import Annotated, Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from api.schemas.posts import SchemaMediaCreate, SchemaMediaOut, SchemaPostCreate, SchemaPostOut, SchemaPostUpdate
from api.security import get_current_user
from db.database import get_db
from db.models import Media, Post, User

router = APIRouter(prefix="/posts", tags=["posts"])


# Health check endpoint
@router.get("/health", include_in_schema=True, response_model=Dict[str, Any])
async def health_check_posts():
    """Health check for the posts router."""
    from api.utils import check_router_health

    return check_router_health("posts")


@router.post("", response_model=SchemaPostOut)
async def create_post(post: SchemaPostCreate, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Create a new post."""
    # Ensure we have a valid author
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    new_post = Post(content=post.content, visibility=post.visibility, author_id=current_user.id, event_id=post.eventId)
    db.add(new_post)
    db.commit()
    db.refresh(new_post)

    # Get the author - this should never fail since we just used current_user's ID
    author = db.query(User).filter(User.id == new_post.author_id).first()
    if not author:
        # If it somehow does fail, log the issue but use current_user data
        print(f"Warning: Could not find author record for post {new_post.id}, using current_user data")
        author = current_user

    # Build the response
    result = new_post.to_dict()
    result["id"] = str(result["id"])
    result["authorId"] = str(result["authorId"])
    result["eventId"] = str(result["eventId"]) if result.get("eventId") else None

    # Add author information
    result["author"] = {
        "id": str(author.id),
        "name": author.name,
        "handle": author.handle,
        "profileImage": author.profile_image
    }

    return result


@router.get("", response_model=List[SchemaPostOut])
async def get_posts(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    event_id: Optional[str] = None,
    author_id: Optional[str] = None,
    feed: bool = False,
    skip: int = 0,
    limit: int = 20,
):
    """Get posts with optional filtering and include author information."""
    query = db.query(Post).join(User, Post.author_id == User.id).options(joinedload(Post.author))

    # Filter by event_id if provided
    if event_id:
        try:
            # Try to convert to UUID if it's a valid format
            uuid_event_id = UUID(event_id)
            query = query.filter(Post.event_id == uuid_event_id)
        except ValueError:
            # If not a valid UUID, return empty result
            # This prevents database errors when non-UUID values are passed
            return []

    # Filter by author_id if provided
    if author_id:
        # Special case for the frontend "guest-id" placeholder
        if author_id == "guest-id":
            # Find all guest users based on metadata
            guest_users = db.query(User).filter(
                User.user_metadata.contains({"is_guest": True})
            ).all()
            if guest_users:
                # Filter posts by any guest user
                guest_ids = [user.id for user in guest_users]
                query = query.filter(Post.author_id.in_(guest_ids))
            else:
                # No guest users found
                return []
        else:
            try:
                # Try to convert to UUID for normal cases
                uuid_author_id = UUID(author_id)
                query = query.filter(Post.author_id == uuid_author_id)
            except ValueError:
                # If not a valid UUID, try to find by handle
                user = db.query(User).filter(User.handle == author_id).first()
                if user:
                    query = query.filter(Post.author_id == user.id)
                else:
                    # No matching user found
                    return []

    # Order by created_at descending (newest first)
    posts = query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for post in posts:
        post_dict = post.to_dict()
        # Ensure IDs are strings
        post_dict["id"] = str(post_dict["id"])
        post_dict["authorId"] = str(post_dict["authorId"])
        post_dict["eventId"] = str(post_dict["eventId"]) if post_dict.get("eventId") else None

        # Add author information if available
        if hasattr(post, 'author') and post.author:
            post_dict["author"] = {
                "id": str(post.author.id),
                "name": post.author.name,
                "handle": post.author.handle,
                "profileImage": post.author.profile_image
            }
        else:
            # Provide placeholder if author is somehow missing
            print(f"Warning: Post {post.id} has no associated author")
            post_dict["author"] = {
                "id": "unknown",
                "name": "Unknown User",
                "handle": "@unknown",
                "profileImage": None
            }

        # Get post media if any
        media_items = db.query(Media).filter(Media.post_id == post.id).all()
        if media_items:
            post_dict["media"] = [media_item.to_dict() for media_item in media_items]

        result.append(post_dict)

    return result


@router.get("/{post_id:uuid}", response_model=SchemaPostOut)
async def get_post(post_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get a specific post by ID with author info and media."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Check visibility permissions
    if post.visibility == "private" and post.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to view this post")

    # Get post author
    author = db.query(User).filter(User.id == post.author_id).first()

    # Get post media
    media = db.query(Media).filter(Media.post_id == post.id).first()

    # Build response with author info and media
    post_dict = post.to_dict()
    # Ensure IDs are strings
    post_dict["id"] = str(post_dict["id"])
    post_dict["authorId"] = str(post_dict["authorId"])
    post_dict["eventId"] = str(post_dict["eventId"]) if post_dict.get("eventId") else None

    post_dict["author"] = {
        "id": str(author.id),
        "name": author.name,
        "handle": author.handle,
        "profileImage": author.profile_image
    } if author else {
        "id": "",
        "name": "Unknown User",
        "handle": "",
        "profileImage": None
    }

    # Get media items
    media_items = db.query(Media).filter(Media.post_id == post.id).all()
    if media_items:
        post_dict["media"] = [media_item.to_dict() for media_item in media_items]

    return post_dict


@router.put("/{post_id:uuid}", response_model=SchemaPostOut)
async def update_post(
    post_id: UUID,
    post_update: SchemaPostUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Update a post."""
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Check if the user is the author
    if db_post.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to update this post")

    # Update the post fields
    for key, value in post_update.model_dump(exclude_unset=True).items():
        setattr(db_post, key, value)

    db.commit()
    db.refresh(db_post)

    # Get author info
    author = db.query(User).filter(User.id == db_post.author_id).first()

    # Build response
    result = db_post.to_dict()
    result["id"] = str(result["id"])
    result["authorId"] = str(result["authorId"])
    result["eventId"] = str(result["eventId"]) if result.get("eventId") else None

    # Add author information
    result["author"] = {
        "id": str(author.id),
        "name": author.name,
        "handle": author.handle,
        "profileImage": author.profile_image
    }

    # Get media items
    media_items = db.query(Media).filter(Media.post_id == db_post.id).all()
    if media_items:
        result["media"] = [media_item.to_dict() for media_item in media_items]

    return result


@router.delete("/{post_id:uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(post_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Delete a post."""
    db_post = db.query(Post).filter(Post.id == post_id).first()
    if not db_post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Check if the user is the author
    if db_post.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the author can delete this post")

    db.delete(db_post)
    db.commit()
    return None


@router.get("/me", response_model=List[SchemaPostOut])
async def get_current_user_posts(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
):
    """Get posts authored by the current user."""
    # Query for posts with author and media
    query = (
        db.query(Post)
        .options(joinedload(Post.author), joinedload(Post.media))
        .filter(Post.author_id == current_user.id)
    )

    # Add date filters if provided
    if start_date:
        query = query.filter(Post.created_at >= start_date)
    if end_date:
        query = query.filter(Post.created_at <= end_date)

    # Apply ordering, offset and limit
    query = query.order_by(desc(Post.created_at)).offset(skip).limit(limit)


    posts = query.all()

    result = []
    for post in posts:
        post_dict = post.to_dict()
        # Ensure IDs are strings
        post_dict["id"] = str(post_dict["id"])
        post_dict["authorId"] = str(post_dict["authorId"])
        post_dict["eventId"] = str(post_dict["eventId"]) if post_dict.get("eventId") else None

        # Add author information if available
        if hasattr(post, 'author') and post.author:
            post_dict["author"] = {
                "id": str(post.author.id),
                "name": post.author.name,
                "handle": post.author.handle,
                "profileImage": post.author.profile_image
            }
        else:
            # Provide placeholder if author is somehow missing
            print(f"Warning: Post {post.id} has no associated author")
            post_dict["author"] = {
                "id": "unknown",
                "name": "Unknown User",
                "handle": "@unknown",
                "profileImage": None
            }

        # Get post media if any
        if post.media and len(post.media) > 0:
            post_dict["media"] = [media_item.to_dict() for media_item in post.media]

        result.append(post_dict)

    return result


# Media endpoints
@router.post("/{post_id:uuid}/media", response_model=SchemaMediaOut)
async def add_media(
    post_id: UUID,
    media: SchemaMediaCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Add media to a post."""
    # Check if the post exists
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Check if the user is the author of the post
    if post.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to add media to this post")

    # Create the media
    new_media = Media(
        type=media.type,
        title=media.title,
        url=media.url,
        duration=media.duration,
        aspect_ratio=media.aspectRatio,
        file_size=media.fileSize,
        mime_type=media.mimeType,
        post_id=post_id,
        created_by_id=current_user.id,
    )
    db.add(new_media)
    db.commit()
    db.refresh(new_media)

    # Process media in the background (only for certain media types)
    if media.type in ["video", "image", "audio"]:
        # Import here to avoid circular imports
        from tasks.media_processing_tasks import process_media

        process_media.delay(str(new_media.id))

    result = new_media.to_dict()
    # Convert IDs to strings
    result["id"] = str(result["id"])
    result["postId"] = str(result["postId"]) if result.get("postId") else None
    result["eventId"] = str(result["eventId"]) if result.get("eventId") else None
    result["createdById"] = str(result["createdById"]) if result.get("createdById") else None

    return result


@router.get("/{post_id:uuid}/media", response_model=List[SchemaMediaOut])
async def get_post_media(post_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get all media for a post."""
    # Check if the post exists
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    # Check visibility permissions
    if post.visibility == "private" and post.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You don't have permission to view this post's media")

    media = db.query(Media).filter(Media.post_id == post_id).all()

    result = []
    for medium in media:
        medium_dict = medium.to_dict()
        # Convert IDs to strings
        medium_dict["id"] = str(medium_dict["id"])
        medium_dict["postId"] = str(medium_dict["postId"]) if medium_dict.get("postId") else None
        medium_dict["eventId"] = str(medium_dict["eventId"]) if medium_dict.get("eventId") else None
        medium_dict["createdById"] = str(medium_dict["createdById"]) if medium_dict.get("createdById") else None
        result.append(medium_dict)

    return result
