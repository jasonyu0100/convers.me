"""User routes for the API."""

from typing import Annotated, Any, Dict, List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.schemas.users import SchemaPasswordReset, SchemaPasswordResetRequest
from api.schemas.users import SchemaUserCreate as UserCreate
from api.schemas.users import SchemaUserOut as UserOut
from api.schemas.users import SchemaUserPreferencesOut as UserPreferencesOut
from api.schemas.users import SchemaUserPreferencesUpdate as UserPreferencesUpdate
from api.schemas.users import SchemaUserUpdate
from api.security import get_current_user, get_password_hash
from db.database import get_db
from db.models import User, UserPreferences
from services.user.guest_service import GuestUserService
from services.user.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])

# Temporary route to log and redirect deprecated endpoint calls
@router.get("/preferences", response_model=Dict[str, Any])
async def deprecated_preferences_redirect():
    """Temporary route to log and redirect deprecated endpoint calls."""
    import logging

    logger = logging.getLogger(__name__)
    logger.warning("Deprecated endpoint /users/preferences called - update frontend code to use /users/me/preferences")
    from fastapi.responses import RedirectResponse

    return RedirectResponse(url="/users/me/preferences")

# Health check endpoint
@router.get("/health", include_in_schema=True, response_model=Dict[str, Any])
async def health_check_users():
    """Health check for the users router."""
    from api.utils import check_router_health

    return check_router_health("users")

@router.post("", response_model=UserOut)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Create a new user."""
    try:
        # Use the appropriate service based on whether this is a guest user
        if user.is_guest and user.guest_role:
            # Use guest service for guest users
            guest_service = GuestUserService(db)
            new_user = guest_service.create_guest_user(user)
        else:
            # Use regular user service for non-guest users
            user_service = UserService(db)
            new_user = user_service.create_user(user)

        return new_user

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    """Get current user information."""
    # Use the to_dict method to ensure proper conversion of UUID and metadata fields
    # This helps avoid serialization issues with UUID and MetaData objects
    user_dict = current_user.to_dict()

    # The to_dict method handles conversion of all fields including id and metadata
    # The response_model=UserOut will validate the schema
    return user_dict

@router.get("", response_model=List[UserOut])
async def get_users(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    query: Optional[str] = Query(None, description="Search query for name or handle"),
    limit: int = Query(20, description="Maximum number of results"),
    offset: int = Query(0, description="Pagination offset"),
):
    """Get all users with optional search functionality."""
    users_query = db.query(User)

    if query:
        users_query = users_query.filter((User.name.ilike(f"%{query}%")) | (User.handle.ilike(f"%{query}%")) | (User.email.ilike(f"%{query}%")))

    users = users_query.order_by(User.name).offset(offset).limit(limit).all()

    # Convert all User objects to dictionaries to ensure proper UUID and metadata conversion
    return [user.to_dict() for user in users]

@router.get("/{user_id:uuid}", response_model=UserOut)
async def get_user(user_id: UUID, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get a specific user by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Convert User object to dictionary to ensure proper UUID and metadata conversion
    return user.to_dict()

@router.get("/handle/{handle}", response_model=UserOut)
async def get_user_by_handle(handle: str, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get a user by handle."""
    user = db.query(User).filter(User.handle == handle).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Convert User object to dictionary to ensure proper UUID and metadata conversion
    return user.to_dict()

@router.put("/me", response_model=UserOut)
async def update_user(user_data: SchemaUserUpdate, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Update current user's information."""
    # Check if handle already exists and is not the current user's handle
    if user_data.handle and user_data.handle != current_user.handle:
        db_user = db.query(User).filter(User.handle == user_data.handle).first()
        if db_user:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Handle already taken")

    # Handle user data
    user_dict = user_data.model_dump(exclude={"password"})

    # Ensure profileImage has a fallback if being set to None
    if "profileImage" in user_dict and not user_dict["profileImage"]:
        user_dict["profile_image"] = "/profile/profile.jpg"

    # Map camelCase to snake_case for database fields
    field_mapping = {
        "profileImage": "profile_image",
        "userMetadata": "user_metadata",
        "isGuest": "is_guest",
        "guestRole": "guest_role",
        "isAdmin": "is_admin"
    }

    # Update user fields
    for key, value in user_dict.items():
        db_field = field_mapping.get(key, key)  # Use mapped field name or original
        setattr(current_user, db_field, value)

    # Update password if provided
    if user_data.password:
        current_user.password_hash = get_password_hash(user_data.password)

    db.commit()
    db.refresh(current_user)

    # Convert User object to dictionary to ensure proper UUID and metadata conversion
    return current_user.to_dict()

@router.get("/me/preferences", response_model=UserPreferencesOut)
async def get_user_preferences(current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Get user preferences for the current user."""
    preferences = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    if not preferences:
        # Create default preferences if they don't exist
        preferences = UserPreferences(user_id=current_user.id)
        db.add(preferences)
        db.commit()
        db.refresh(preferences)

    # Convert UserPreferences object to dictionary to ensure proper UUID and metadata conversion
    return preferences.to_dict()

@router.put("/me/preferences", response_model=UserPreferencesOut)
async def update_user_preferences(
    preferences: UserPreferencesUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
):
    """Update user preferences for the current user."""
    db_preferences = db.query(UserPreferences).filter(UserPreferences.user_id == current_user.id).first()
    if not db_preferences:
        # Create preferences if they don't exist
        # Map camelCase to snake_case for database fields
        prefs_dict = preferences.model_dump()
        mapped_prefs = {
            "user_id": current_user.id,
            "theme": prefs_dict.get("theme"),
            "email_notifications": prefs_dict.get("emailNotifications"),
            "time_zone": prefs_dict.get("timeZone"),
            "language": prefs_dict.get("language"),
            "additional_settings": prefs_dict.get("additionalSettings", {})
        }
        db_preferences = UserPreferences(**mapped_prefs)
        db.add(db_preferences)
    else:
        # Update existing preferences
        # Map camelCase to snake_case for database fields
        field_mapping = {
            "emailNotifications": "email_notifications",
            "timeZone": "time_zone",
            "additionalSettings": "additional_settings"
        }

        prefs_dict = preferences.model_dump(exclude_unset=True)
        for key, value in prefs_dict.items():
            db_field = field_mapping.get(key, key)  # Use mapped field name or original
            setattr(db_preferences, db_field, value)

    db.commit()
    db.refresh(db_preferences)

    # Convert UserPreferences object to dictionary to ensure proper UUID and metadata conversion
    return db_preferences.to_dict()

@router.post("/reset-password/request")
async def request_password_reset(reset_request: SchemaPasswordResetRequest, db: Session = Depends(get_db)):
    """Request a password reset."""
    user = db.query(User).filter(User.email == reset_request.email).first()
    if user:
        # In a real implementation, you would:
        # 1. Generate a secure token
        # 2. Store it with an expiration
        # 3. Send an email with a reset link
        pass

    # Always return success to prevent email enumeration
    return {"message": "If the email exists, a password reset link has been sent."}

@router.post("/reset-password/confirm")
async def confirm_password_reset(reset_data: SchemaPasswordReset, db: Session = Depends(get_db)):
    """Confirm a password reset with the provided token."""
    # In a real implementation, you would:
    # 1. Validate the token
    # 2. Check if it's expired
    # 3. Get the associated user
    # 4. Update the password

    # For now, return a placeholder
    return {"message": "Password has been reset successfully."}
