"""Media routes for the API."""

import os
from typing import Annotated, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from api.schemas.media import SchemaMediaOut, SchemaMediaUploadResponse
from api.security import get_current_user
from api.utils.storage_utils import storage
from db.database import get_db
from db.models import Media, MediaTypeEnum, User

router = APIRouter(prefix="/media", tags=["media"])

@router.post("/upload")
async def upload_media(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """
    Upload a media file.
    This endpoint handles file uploads for images, videos, and audio.
    """
    # Determine media type from content type
    media_type = None
    if file.content_type.startswith("image/"):
        media_type = MediaTypeEnum.IMAGE
    elif file.content_type.startswith("video/"):
        media_type = MediaTypeEnum.VIDEO
    elif file.content_type.startswith("audio/"):
        media_type = MediaTypeEnum.AUDIO
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Unsupported media type: {file.content_type}")

    # Upload file to storage service (Tigris or local fallback)
    file_id, file_url = await storage.upload_file(file)

    # Get file size - this will only work for local files
    # For Tigris, we'd need to track file size during upload
    file_size = 0
    if file_url.startswith("/uploads/"):
        try:
            file_size = os.path.getsize(file_url.replace("/uploads/", "uploads/"))
        except (OSError, FileNotFoundError):
            pass

    # Create media record in database
    media = Media(
        type=media_type,
        title=title or file.filename,
        url=file_url,
        file_size=file_size,
        mime_type=file.content_type,
        created_by_id=current_user.id,
    )

    db.add(media)
    db.commit()
    db.refresh(media)

    response = SchemaMediaUploadResponse(
        id=str(media.id),
        url=media.url,
        type=media.type.value,
        title=media.title,
        mimeType=media.mime_type,
        fileSize=media.file_size,
    )
    return response

@router.get("/{media_id:uuid}")
async def get_media(media_id: UUID, db: Session = Depends(get_db), current_user: Annotated[User, Depends(get_current_user)] = None):
    """Get a specific media item."""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

    return SchemaMediaOut.model_validate(media)

@router.delete("/{media_id:uuid}")
async def delete_media(media_id: UUID, db: Session = Depends(get_db), current_user: Annotated[User, Depends(get_current_user)] = None):
    """Delete a media item."""
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

    # Check if user is the creator
    if media.created_by_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to delete this media")

    # Delete the file from storage (Tigris or local)
    success = await storage.delete_file(media.url)
    if not success:
        # Log issue but continue with database deletion
        print(f"Warning: Failed to delete file at {media.url}")

    # Delete the database record
    db.delete(media)
    db.commit()

    return {"message": "Media deleted"}
