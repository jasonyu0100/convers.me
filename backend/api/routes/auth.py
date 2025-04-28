"""Authentication routes for the API."""

import logging
from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from api.schemas.auth import SchemaGuestLogin as GuestLogin
from api.schemas.auth import SchemaGuestLoginResponse as GuestLoginResponse
from api.schemas.auth import SchemaToken as Token
from api.security import ACCESS_TOKEN_EXPIRE_MINUTES, authenticate_user, create_access_token, get_current_user
from db.database import get_db
from db.models import User
from services.user.guest_service import GuestUserService

# Set up logger
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)):
    """Login endpoint to get an access token."""
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    return {"accessToken": access_token, "tokenType": "bearer"}

@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: Annotated[User, Depends(get_current_user)], db: Session = Depends(get_db)):
    """Refresh the access token."""
    try:
        # In a more robust implementation, you would:
        # 1. Accept a refresh token and validate it
        # 2. Issue a new access token only if the refresh token is valid

        # Generate a new access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        new_access_token = create_access_token(data={"sub": current_user.email}, expires_delta=access_token_expires)

        # Return the new token
        return {"accessToken": new_access_token, "tokenType": "bearer"}  # Use camelCase to match frontend expectations
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not refresh token",
        )

@router.post("/guest", response_model=GuestLoginResponse)
async def guest_login(guest_data: GuestLogin, db: Session = Depends(get_db)):
    """
    Create a guest account with the specified role and return login credentials.

    This endpoint is primarily for demonstration and testing purposes.
    It creates a temporary user account with a random identifier.
    """
    try:
        # Use the guest user service to create a guest account
        guest_service = GuestUserService(db)
        guest_user, access_token, password = await guest_service.guest_login(guest_data)

        # Return login information
        return {
            "accessToken": access_token,
            "tokenType": "bearer",
            "email": guest_user.email,
            "password": password,
            "name": guest_user.name,
            "handle": guest_user.handle,
            "profileImage": guest_user.profile_image,
        }
    except ValueError as e:
        # Map ValueError to appropriate HTTP exceptions
        if "Guest login is only available in development mode" in str(e):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
        elif "Invalid role" in str(e):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
        elif "Failed to create unique guest account" in str(e):
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
        else:
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error creating guest account: {str(e)}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to create guest account")
