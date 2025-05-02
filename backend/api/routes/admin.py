"""Admin routes for managing the application."""

import logging
import os
from typing import Annotated, List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from api.schemas.admin import DatabaseInitResponse, DatabaseResetResponse, UserCreateAdmin, UserResponseAdmin, UserUpdateAdmin
from api.schemas.market import LibraryInitializeResponse
from api.security import get_current_user, get_password_hash
from db.database import get_db
from db.models import User
from services.guest_initialization.service import GuestInitializationService
from services.market.market_service import MarketService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/initialize", dependencies=[])
async def initialize_database(
    db: Session = Depends(get_db)
) -> DatabaseInitResponse:
    """
    Initialize the database with sample data for development.

    This endpoint doesn't require authentication.
    This endpoint can be used to setup a new environment or reset development data.
    It creates sample users, topics, processes, events, and posts.
    """
    # Check if tables exist - if not, run migrations
    inspector = inspect(db.bind)
    tables = inspector.get_table_names()

    result = {"success": True, "actions": [], "errors": []}

    # Only allow in development mode
    if os.environ.get("DEBUG", "False").lower() != "true":
        return {"success": False, "message": "This endpoint is only available in development mode"}

    # Check if tables exist
    if not tables:
        result["actions"].append("No database tables found")
    else:
        result["actions"].append("Database tables already exist")

    # Create default admin user if none exists
    admin_user = db.query(User).filter(User.email == "admin@convers.me").first()
    if not admin_user:
        try:
            # Create admin user
            hashed_password = get_password_hash("admin1234")
            admin = User(email="admin@convers.me", name="Admin User", handle="admin", password_hash=hashed_password)
            db.add(admin)
            db.commit()
            result["actions"].append("Created default admin user")
        except Exception as e:
            result["success"] = False
            result["errors"].append(f"Failed to create admin user: {str(e)}")
    else:
        result["actions"].append("Admin user already exists")

    # Initialize development data using the service
    try:
        service = GuestInitializationService(db)
        init_success = await service.initialize_development_environment()
        if init_success:
            result["actions"].append("Initialized development data")
        else:
            result["success"] = False
            result["errors"].append("Failed to initialize development data")
    except Exception as e:
        result["success"] = False
        result["errors"].append(f"Error initializing development data: {str(e)}")

    # Initialize library data
    try:
        market_service = MarketService(db)
        library_result = market_service.initialize_library()
        if library_result.success:
            result["actions"].append(f"Initialized library with {library_result.collections_created} collections, {library_result.directories_created} directories, and {library_result.processes_created} processes")
        else:
            result["actions"].append(f"Library initialization message: {library_result.message}")
    except Exception as e:
        result["actions"].append(f"Library initialization skipped: {str(e)}")

    return result

@router.post("/reset", status_code=status.HTTP_200_OK)
async def reset_database(current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)) -> DatabaseResetResponse:
    """
    Reset the database to a clean state (admin only).

    This endpoint is intended for development and testing purposes only.
    It deletes all data and recreates the admin user.

    Args:
        current_user: The authenticated user (must be an admin)
        db: The database session

    Returns:
        dict: Status of the operation

    Raises:
        HTTPException: If the user is not authorized or reset fails
    """
    # Only allow in development mode
    if os.environ.get("DEBUG", "False").lower() != "true":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This endpoint is only available in development mode")

    # Only allow admins to reset the database
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin users can reset the database")

    try:
        logger.info(f"Database reset started by admin user: {current_user.email}")

        # Get list of all tables in the database for logging
        inspector = inspect(db.bind)
        all_tables = inspector.get_table_names()
        logger.info(f"Tables found in database: {', '.join(all_tables)}")

        # Delete all data except the admin user
        # This should be done in reverse order of dependencies
        tables_deleted = []

        # Helper function to safely delete from a table if it exists
        def safe_delete_from_table(table_name, where_clause=None, params=None):
            if table_name in all_tables:
                sql = f"DELETE FROM {table_name}"
                if where_clause:
                    sql += f" {where_clause}"

                try:
                    if params:
                        db.execute(text(sql), params)
                    else:
                        db.execute(text(sql))
                    tables_deleted.append(table_name + (" " + where_clause if where_clause else ""))
                    logger.info(f"Successfully deleted data from {table_name}")
                except Exception as e:
                    logger.warning(f"Error deleting from {table_name}: {str(e)}")
            else:
                logger.info(f"Table {table_name} not found, skipping")

        # Junction tables first
        safe_delete_from_table("event_topics")
        safe_delete_from_table("event_participants")

        # Entity tables with foreign keys
        safe_delete_from_table("notifications")
        safe_delete_from_table("status_logs")  # This might not exist
        safe_delete_from_table("reports")  # Added reports table
        safe_delete_from_table("media")
        safe_delete_from_table("posts")
        safe_delete_from_table("sub_steps")
        safe_delete_from_table("steps")
        safe_delete_from_table("events")
        safe_delete_from_table("processes")
        safe_delete_from_table("user_preferences", "WHERE user_id != :admin_id", {"admin_id": current_user.id})
        safe_delete_from_table("topics")
        safe_delete_from_table("directories")
        safe_delete_from_table("users", "WHERE id != :admin_id", {"admin_id": current_user.id})

        # Commit the changes
        db.commit()

        logger.info(f"Database reset completed successfully. Tables cleared: {', '.join(tables_deleted)}")
        result = {"status": "Database reset successfully", "tables_cleared": tables_deleted, "tables_found": all_tables}
        return result
    except Exception as e:
        db.rollback()
        error_message = f"Failed to reset database: {str(e)}"
        logger.error(error_message, exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=error_message)

@router.get("/users")
async def get_users(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
) -> List[UserResponseAdmin]:
    """
    Get a list of all users (admin only).

    Args:
        current_user: The authenticated user (must be an admin)
        db: The database session
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return

    Returns:
        List of users with their details

    Raises:
        HTTPException: If the user is not authorized
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin users can access this endpoint")

    users = db.query(User).offset(skip).limit(limit).all()
    return [UserResponseAdmin.from_orm_obj(user) for user in users]

@router.get("/users/{user_id}")
async def get_user(user_id: str, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)) -> UserResponseAdmin:
    """
    Get a specific user by ID (admin only).

    Args:
        user_id: The ID of the user to retrieve
        current_user: The authenticated user (must be an admin)
        db: The database session

    Returns:
        The requested user's details

    Raises:
        HTTPException: If the user is not authorized or user not found
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin users can access this endpoint")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with ID {user_id} not found")

    return UserResponseAdmin.from_orm_obj(user)

@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(user_data: UserCreateAdmin, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)) -> UserResponseAdmin:
    """
    Create a new user (admin only).

    Args:
        user_data: The user data to create
        current_user: The authenticated user (must be an admin)
        db: The database session

    Returns:
        The created user's details

    Raises:
        HTTPException: If the user is not authorized or user creation fails
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin users can access this endpoint")

    # Check if email already exists
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Email {user_data.email} already registered")

    # Check if handle already exists
    if db.query(User).filter(User.handle == user_data.handle).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Handle {user_data.handle} already taken")

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        name=user_data.name,
        handle=user_data.handle,
        email=user_data.email,
        password_hash=hashed_password,
        profile_image=user_data.profileImage if hasattr(user_data, "profileImage") else None,
        bio=user_data.bio,
        is_admin=user_data.isAdmin if hasattr(user_data, "isAdmin") else False,
    )

    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create user: {str(e)}")

    return UserResponseAdmin.from_orm_obj(new_user)

@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    user_data: UserUpdateAdmin,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> UserResponseAdmin:
    """
    Update a user (admin only).

    Args:
        user_id: The ID of the user to update
        user_data: The user data to update
        current_user: The authenticated user (must be an admin)
        db: The database session

    Returns:
        The updated user's details

    Raises:
        HTTPException: If the user is not authorized, user not found, or update fails
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin users can access this endpoint")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with ID {user_id} not found")

    # Check if email is being updated and already exists
    if user_data.email and user_data.email != user.email:
        if db.query(User).filter(User.email == user_data.email).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Email {user_data.email} already registered")

    # Check if handle is being updated and already exists
    if user_data.handle and user_data.handle != user.handle:
        if db.query(User).filter(User.handle == user_data.handle).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Handle {user_data.handle} already taken")

    # Update user fields
    if user_data.name is not None:
        user.name = user_data.name
    if user_data.handle is not None:
        user.handle = user_data.handle
    if user_data.email is not None:
        user.email = user_data.email
    if hasattr(user_data, "profileImage") and user_data.profileImage is not None:
        user.profile_image = user_data.profileImage
    if user_data.bio is not None:
        user.bio = user_data.bio
    if hasattr(user_data, "isAdmin") and user_data.isAdmin is not None:
        user.is_admin = user_data.isAdmin

    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to update user: {str(e)}")

    return UserResponseAdmin.from_orm_obj(user)

@router.post("/migrate-event-steps", status_code=status.HTTP_200_OK)
async def migrate_event_steps_to_processes(current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """
    Migrate all steps directly attached to events to their linked processes.
    This fixes the critical architectural issue where steps should only be
    linked to processes, not directly to events.

    Args:
        current_user: The authenticated user (must be an admin)
        db: The database session

    Returns:
        dict: Migration statistics
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                           detail="Only admin users can access this endpoint")

    try:
        # Import the ProcessService
        from services.process.process_service import ProcessService

        # Call the migration method
        result = ProcessService.migrate_all_event_steps_to_processes(db)

        return result
    except Exception as e:
        logger.error(f"Error migrating event steps: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                           detail=f"Failed to migrate event steps: {str(e)}")

@router.post("/initialize-library", response_model=LibraryInitializeResponse)
async def initialize_library(
    db: Session = Depends(get_db)
) -> LibraryInitializeResponse:
    """
    Initialize the library with predefined collections, directories, and processes.
    This endpoint doesn't require authentication and is intended for system setup.

    Args:
        db: The database session

    Returns:
        Status of the initialization
    """
    market_service = MarketService(db)
    result = market_service.initialize_library()

    return result


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """
    Delete a user (admin only).

    Args:
        user_id: The ID of the user to delete
        current_user: The authenticated user (must be an admin)
        db: The database session

    Returns:
        None

    Raises:
        HTTPException: If the user is not authorized, user not found, or delete fails
    """
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin users can access this endpoint")

    # Prevent admins from deleting themselves
    if user_id == str(current_user.id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own admin account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"User with ID {user_id} not found")

    try:
        # First, delete all related records
        inspector = inspect(db.bind)
        tables = inspector.get_table_names()

        # Delete records from related tables
        tables_to_check = [
            ("status_logs", "user_id"),
            ("notifications", "user_id"),
            ("event_participants", "user_id"),
            ("user_preferences", "user_id"),
            ("posts", "author_id"),
        ]

        for table_name, column_name in tables_to_check:
            if table_name in tables:
                try:
                    db.execute(text(f"DELETE FROM {table_name} WHERE {column_name} = :user_id"), {"user_id": user_id})
                    logger.info(f"Deleted records from {table_name} for user {user_id}")
                except Exception as e:
                    # Log the error but continue with user deletion
                    logger.warning(f"Error deleting from {table_name} for user {user_id}: {str(e)}")

        # Now delete the user record
        db.delete(user)
        db.commit()
        logger.info(f"Successfully deleted user {user_id}")
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to delete user {user_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete user: {str(e)}")
