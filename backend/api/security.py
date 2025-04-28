"""Security utilities for the API."""

import os
from datetime import datetime, timedelta
from typing import Annotated, Optional, Tuple, Union

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from api.schemas.auth import SchemaTokenData as TokenData
from db.database import get_db
from db.models import User

# Security configuration - load from environment variables
SECRET_KEY = os.environ.get("SECRET_KEY")
if not SECRET_KEY or SECRET_KEY in ["change_me_in_production", "change_me_in_production_use_openssl_rand_hex_32"]:
    if os.environ.get("DEBUG", "False").lower() == "true":
        SECRET_KEY = "insecure_development_key_do_not_use_in_production"
        print("WARNING: Using insecure development key. Set SECRET_KEY in .env file.")
    else:
        raise ValueError("SECRET_KEY must be set in production environment.")

ALGORITHM = os.environ.get("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))  # Default to 7 days

# Password hashing utilities
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password for storing."""
    return pwd_context.hash(password)


def authenticate_user(db: Session, email: str, password: str) -> Union[User, bool]:
    """Authenticate a user with email and password."""
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.password_hash:
        return False
    if not verify_password(password, user.password_hash):
        return False
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: The data to encode in the token
        expires_delta: Optional expiration delta

    Returns:
        JWT token as string
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)) -> User:
    """
    Get the current authenticated user.

    Args:
        token: JWT token
        db: Database session

    Returns:
        User: The authenticated user

    Raises:
        HTTPException: If credentials are invalid
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated", headers={"WWW-Authenticate": "Bearer"},
    )

    # Handle the case where token is None (this happens with auto_error=False)
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user


async def get_optional_user(token: Annotated[str, Depends(oauth2_scheme)] = None, db: Session = Depends(get_db)) -> Optional[User]:
    """
    Get the current user if authenticated, or None if not.

    Args:
        token: JWT token (optional)
        db: Database session

    Returns:
        User or None
    """
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        user = db.query(User).filter(User.email == username).first()
        return user
    except JWTError:
        return None


def extract_user_info_from_token(auth_header: str) -> Tuple[Optional[str], bool]:
    """
    Extract user ID and admin status from a JWT token.
    Used by rate limiting middleware.

    Args:
        auth_header: The Authorization header from the request

    Returns:
        Tuple of (user_id, is_admin)
    """
    if not auth_header or not auth_header.startswith("Bearer "):
        return None, False

    try:
        token = auth_header.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        # Extract user email (sub claim)
        username = payload.get("sub")
        if not username:
            return None, False

        # For rate limiting, we don't need to query the database
        # We'll just use the email as the user identifier
        user_id = username

        # Check if the user is an admin (would be included in token in a real app)
        # In a real implementation, you might include is_admin in the token payload
        # For now, we'll just check if the username contains 'admin'
        is_admin = 'admin' in username.lower()

        return user_id, is_admin

    except Exception:
        # Failed to extract user info, treat as unauthenticated
        return None, False
