"""Settings routes for the API."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from api.schemas.users import SchemaUserPreferencesUpdate, SchemaUserUpdate
from api.security import get_current_user, get_password_hash, verify_password
from db.database import get_db
from db.models import User, UserPreferences

router = APIRouter(prefix="/settings", tags=["settings"])

class PasswordChangeRequest(BaseModel):
    """Password change request model."""

    currentPassword: str
    newPassword: str

@router.get("")
async def get_all_settings(db: Session = Depends(get_db), current_user: Annotated[User, Depends(get_current_user)] = None):
    """
    Get all user settings including preferences and profile information.

    Returns a combined object with all settings for the current user.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    # Get user preferences
    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    if not preferences:
        # Create default preferences if they don't exist
        preferences = UserPreferences(user_id=current_user.id)
        db.add(preferences)
        db.commit()
        db.refresh(preferences)

    # Return combined settings in camelCase for API consistency
    combined_settings = {
        "profile": {
            "id": str(current_user.id),
            "name": current_user.name,
            "email": current_user.email,
            "handle": current_user.handle,
            "bio": current_user.bio,
            "profileImage": current_user.profile_image,
        },
        "preferences": {
            "theme": preferences.theme,
            "emailNotifications": preferences.email_notifications,
            "timeZone": preferences.time_zone,
            "language": preferences.language,
            "additionalSettings": preferences.additional_settings,
        },
    }

    # Convert to camelCase for the response
    return combined_settings

@router.put("/profile")
async def update_profile(
    profile_data: SchemaUserUpdate,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """
    Update user profile information.

    This endpoint allows updating name, email, handle, bio, and profile image.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    # Check if handle already exists and is not the current user's handle
    if profile_data.handle and profile_data.handle != current_user.handle:
        db_user = db.query(User).filter(User.handle == profile_data.handle).first()
        if db_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Handle already taken")

    # Check if email already exists and is not the current user's email
    if profile_data.email and profile_data.email != current_user.email:
        db_user = db.query(User).filter(User.email == profile_data.email).first()
        if db_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # Update user fields
    for key, value in profile_data.model_dump(exclude={"password"}, exclude_unset=True, exclude_none=True).items():
        setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)

    # Convert to camelCase for the response
    return current_user

@router.put("/preferences")
async def update_preferences(
    preferences_data: SchemaUserPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """
    Update user preferences.

    This endpoint allows updating theme, notifications, time zone, and language settings.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    # Get or create user preferences
    db_preferences = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    if not db_preferences:
        # Create preferences if they don't exist
        db_preferences = UserPreferences(user_id=current_user.id)
        db.add(db_preferences)

    # Update preferences fields - map camelCase schema fields to snake_case model fields
    schema_data = preferences_data.model_dump(exclude_unset=True, exclude_none=True)

    # Map specific fields
    field_mapping = {
        "theme": "theme",
        "emailNotifications": "email_notifications",
        "timeZone": "time_zone",
        "language": "language",
        "additionalSettings": "additional_settings"
    }

    for schema_key, value in schema_data.items():
        if schema_key in field_mapping:
            model_key = field_mapping[schema_key]
            if model_key == "additional_settings" and value is not None:
                # Update additional settings, preserving existing keys
                if db_preferences.additional_settings is None:
                    db_preferences.additional_settings = {}
                db_preferences.additional_settings.update(value)
            else:
                setattr(db_preferences, model_key, value)

    db.commit()
    db.refresh(db_preferences)

    # Convert to camelCase for the response
    return db_preferences

@router.post("/change-password")
async def change_password(
    password_data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """
    Change user password.

    This endpoint requires the current password for verification before changing to the new password.
    """
    if not current_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    # First, verify the current password is correct
    if not verify_password(password_data.currentPassword, current_user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Incorrect current password")

    # Update the password
    current_user.password_hash = get_password_hash(password_data.newPassword)
    db.commit()

    return {"message": "Password updated successfully"}
