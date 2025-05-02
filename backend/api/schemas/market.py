"""Library schemas for API requests and responses."""

from datetime import datetime
from typing import List, Optional, Union

from pydantic import BaseModel, Field


# Process Steps Schemas
class ProcessStepBase(BaseModel):
    """Base schema for a process step."""

    title: str
    description: str

class ProcessStepCreate(ProcessStepBase):
    """Schema for creating a process step."""


class ProcessStepResponse(ProcessStepBase):
    """Schema for a process step response."""


# Library Process Schemas
class LibraryProcessBase(BaseModel):
    """Base schema for a library process."""

    title: str
    description: str
    category: str
    icon: str
    benefits: List[str]
    steps: List[ProcessStepBase]

class LibraryProcessCreate(LibraryProcessBase):
    """Schema for creating a library process."""

    saves: Optional[int] = 0
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None

class LibraryProcessResponse(LibraryProcessBase):
    """Schema for a library process response."""

    id: str
    saves: Optional[int] = 0
    created_by: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        """Configuration for Pydantic model."""

        from_attributes = True

# Process Directory Schemas
class ProcessDirectoryBase(BaseModel):
    """Base schema for a process directory."""

    name: str
    description: str
    color: Optional[str] = None

class ProcessDirectoryCreate(ProcessDirectoryBase):
    """Schema for creating a process directory."""

    processes: List[Union[str, LibraryProcessCreate]] = []  # Can be IDs or full processes

class ProcessDirectoryResponse(ProcessDirectoryBase):
    """Schema for a process directory response."""

    id: str
    processes: List[LibraryProcessResponse]

    class Config:
        """Configuration for Pydantic model."""

        from_attributes = True

# Library Collection Schemas
class Author(BaseModel):
    """Schema for a collection author."""

    name: str
    avatar: Optional[str] = None

class CollectionBase(BaseModel):
    """Base schema for a collection."""

    title: str
    description: str
    author: Author
    categories: List[str]

class CollectionCreate(CollectionBase):
    """Schema for creating a collection."""

    saves: Optional[int] = 0
    directories: List[Union[str, ProcessDirectoryCreate]] = []  # Can be IDs or full directories

class CollectionResponse(CollectionBase):
    """Schema for a collection response."""

    id: str
    saves: int
    directories: List[ProcessDirectoryResponse]
    created_at: str = Field(..., alias="createdAt")

    class Config:
        """Configuration for Pydantic model."""

        from_attributes = True
        populate_by_name = True

# Initialize Library Schema
class LibraryInitializeResponse(BaseModel):
    """Schema for library initialization response."""

    success: bool
    message: str
    collections_created: Optional[int] = 0
    directories_created: Optional[int] = 0
    processes_created: Optional[int] = 0
