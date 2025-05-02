"""Market routes for the API."""

import logging
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from api.schemas.market import CollectionCreate, CollectionResponse, LibraryProcessResponse, ProcessDirectoryResponse
from api.security import get_current_user
from db.database import get_db
from db.models import User
from services.market.market_service import MarketService

# Set up logging
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/market", tags=["market"])


@router.get("/collections", response_model=List[CollectionResponse])
async def get_collections(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None, description="Filter by category"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
) -> List[CollectionResponse]:
    """
    Get all collections from the market.

    Args:
        current_user: The authenticated user
        db: The database session
        category: Optional category filter
        skip: Number of records to skip for pagination
        limit: Maximum number of records to return

    Returns:
        List of market collections
    """
    market_service = MarketService(db)
    collections = market_service.get_collections(category=category, skip=skip, limit=limit)
    return collections


@router.get("/collections/{collection_id}", response_model=CollectionResponse)
async def get_collection(
    collection_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> CollectionResponse:
    """
    Get a specific collection by ID.

    Args:
        collection_id: The ID of the collection to retrieve
        current_user: The authenticated user
        db: The database session

    Returns:
        The requested collection

    Raises:
        HTTPException: If collection not found
    """
    market_service = MarketService(db)
    collection = market_service.get_collection_by_id(collection_id)

    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection with ID {collection_id} not found",
        )

    return collection


@router.post("/collections", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    collection: CollectionCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> CollectionResponse:
    """
    Create a new collection in the library.

    Args:
        collection: The collection data to create
        current_user: The authenticated user
        db: The database session

    Returns:
        The created collection
    """
    market_service = MarketService(db)
    created_collection = market_service.create_collection(collection, current_user.id)
    return created_collection


@router.delete("/collections/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> None:
    """
    Delete a collection.

    Args:
        collection_id: The ID of the collection to delete
        current_user: The authenticated user
        db: The database session

    Raises:
        HTTPException: If collection not found
    """
    market_service = MarketService(db)

    # Check if the collection exists
    collection = market_service.get_collection_by_id(collection_id)
    if not collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection with ID {collection_id} not found",
        )

    # Delete the collection
    market_service.delete_collection(collection_id)


@router.get("/directories", response_model=List[ProcessDirectoryResponse])
async def get_directories(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> List[ProcessDirectoryResponse]:
    """
    Get all directories.

    Args:
        current_user: The authenticated user
        db: The database session

    Returns:
        List of directories
    """
    market_service = MarketService(db)
    directories = market_service.get_directories()
    return directories


@router.get("/processes", response_model=List[LibraryProcessResponse])
async def get_processes(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
    category: Optional[str] = Query(None, description="Filter by category"),
) -> List[LibraryProcessResponse]:
    """
    Get all processes.

    Args:
        current_user: The authenticated user
        db: The database session
        category: Optional category filter

    Returns:
        List of processes
    """
    market_service = MarketService(db)
    processes = market_service.get_processes(category=category)
    return processes


@router.get("/collections/{collection_id}/directories", response_model=List[ProcessDirectoryResponse])
async def get_collection_directories(
    collection_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> List[ProcessDirectoryResponse]:
    """
    Get all directories for a specific collection.

    Args:
        collection_id: The ID of the collection to get directories for
        current_user: The authenticated user
        db: The database session

    Returns:
        List of directories for the specified collection

    Raises:
        HTTPException: If collection not found
    """
    market_service = MarketService(db)

    # Check if the collection exists
    collection_response = market_service.get_collection_by_id(collection_id)
    if not collection_response:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection with ID {collection_id} not found",
        )

    # Return directories from the collection response
    return collection_response.directories


@router.post("/collections/{collection_id}/save", response_model=CollectionResponse)
async def save_collection(
    collection_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db),
) -> CollectionResponse:
    """
    Save a collection to the user's market.
    This endpoint:
    1. Increments the original collection's save count
    2. Creates a duplicate of the collection in the user's market with all:
       - Directories
       - Process templates
       - Steps
       - Substeps

    Args:
        collection_id: The ID of the collection to save
        current_user: The authenticated user
        db: The database session

    Returns:
        The newly created collection copy

    Raises:
        HTTPException: If collection not found
    """
    market_service = MarketService(db)

    # Get the original collection
    original_collection = market_service.get_collection_by_id(collection_id)
    if not original_collection:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Collection with ID {collection_id} not found",
        )

    # Increment the save count on the original collection
    market_service.increment_collection_saves(collection_id)

    # Create a duplicate of the collection for the user
    duplicated_collection = market_service.duplicate_collection(collection_id, current_user.id)
    return duplicated_collection
