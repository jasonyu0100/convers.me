"""Library service for managing collections, directories and processes."""

import logging
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy.orm import Session

from api.schemas.library import CollectionCreate, CollectionResponse, LibraryInitializeResponse, LibraryProcessResponse, ProcessDirectoryResponse
from db.models import Collection, Directory, Process, Step, SubStep, User
from services.common.base_service import BaseService

logger = logging.getLogger(__name__)

class LibraryService(BaseService):
    """Service for library-related operations."""

    def __init__(self, db: Session):
        """Initialize the service with DB session."""
        super().__init__(db)

    def get_collections(
        self, category: Optional[str] = None, skip: int = 0, limit: int = 100
    ) -> List[CollectionResponse]:
        """
        Get all collections, optionally filtered by category.

        Args:
            category: Optional category to filter by
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of collections
        """
        # Query for collections
        query = self.db.query(Collection)

        # Filter by category if provided
        if category:
            # Find collections with this category in their metadata
            query = query.filter(
                Collection.collection_metadata.contains({"categories": [category]})
            )

        # Apply pagination
        collections_data = query.offset(skip).limit(limit).all()

        # Convert to response format
        collections = []
        for collection in collections_data:
            # Get the collection metadata
            metadata = collection.collection_metadata or {}

            # Load directories for this collection
            directories_data = collection.directories

            # Process directories and their processes
            directory_responses = []
            for directory in directories_data:
                # Get processes for this directory
                processes = self.db.query(Process).filter(
                    Process.directory_id == directory.id,
                    Process.is_template == True
                ).all()

                # Create process responses
                process_responses = []
                for process in processes:
                    # Get steps for this process
                    steps = self.db.query(Step).filter(
                        Step.process_id == process.id
                    ).order_by(Step.order).all()

                    # Create step responses
                    step_responses = []
                    for step in steps:
                        step_responses.append({
                            "title": step.content,
                            "description": ""  # Step doesn't have process_metadata field
                        })

                    # Create process response
                    process_responses.append(
                        LibraryProcessResponse(
                            id=str(process.id),
                            title=process.title,
                            description=process.description or "",
                            category=process.category or "",
                            icon=process.process_metadata.get("icon", "") if process.process_metadata else "",
                            benefits=process.process_metadata.get("benefits", []) if process.process_metadata else [],
                            steps=step_responses,
                            saves=process.process_metadata.get("saves", 0) if process.process_metadata else 0,
                            created_by=process.process_metadata.get("created_by", "") if process.process_metadata else "",
                            created_at=process.created_at.isoformat() if process.created_at else None
                        )
                    )

                # Create directory response
                directory_response = ProcessDirectoryResponse(
                    id=str(directory.id),
                    name=directory.name,
                    description=directory.description or "",
                    color=directory.color or "",
                    processes=process_responses
                )

                directory_responses.append(directory_response)

            # Create collection response
            author = metadata.get("author", {})
            collection_response = CollectionResponse(
                id=str(collection.id),
                title=collection.title,
                description=collection.description or "",
                author={
                    "name": author.get("name", ""),
                    "avatar": author.get("avatar", "")
                },
                categories=metadata.get("categories", []),
                saves=collection.saves,
                directories=directory_responses,
                createdAt=collection.created_at.isoformat() if collection.created_at else ""
            )

            collections.append(collection_response)

        return collections

    def get_collection_by_id(self, collection_id: str) -> Optional[CollectionResponse]:
        """
        Get a collection by ID.

        Args:
            collection_id: ID of the collection to retrieve

        Returns:
            Collection if found, None otherwise
        """
        # Find the collection by ID
        collection = self.db.query(Collection).filter(
            Collection.id == collection_id
        ).first()

        if not collection:
            return None

        # Get the collection metadata
        metadata = collection.collection_metadata or {}

        # Load directories for this collection
        directories_data = collection.directories

        # Process directories and their processes
        directory_responses = []
        for directory in directories_data:
            # Get processes for this directory
            processes = self.db.query(Process).filter(
                Process.directory_id == directory.id,
                Process.is_template == True
            ).all()

            # Create process responses
            process_responses = []
            for process in processes:
                # Get steps for this process
                steps = self.db.query(Step).filter(
                    Step.process_id == process.id
                ).order_by(Step.order).all()

                # Create step responses
                step_responses = []
                for step in steps:
                    step_responses.append({
                        "title": step.content,
                        "description": ""  # No description stored in step metadata
                    })

                # Create process response
                process_responses.append(
                    LibraryProcessResponse(
                        id=str(process.id),
                        title=process.title,
                        description=process.description or "",
                        category=process.category or "",
                        icon=process.process_metadata.get("icon", "") if process.process_metadata else "",
                        benefits=process.process_metadata.get("benefits", []) if process.process_metadata else [],
                        steps=step_responses,
                        saves=process.process_metadata.get("saves", 0) if process.process_metadata else 0,
                        created_by=process.process_metadata.get("created_by", "") if process.process_metadata else "",
                        created_at=process.created_at.isoformat() if process.created_at else None
                    )
                )

            # Create directory response
            directory_response = ProcessDirectoryResponse(
                id=str(directory.id),
                name=directory.name,
                description=directory.description or "",
                color=directory.color or "",
                processes=process_responses
            )

            directory_responses.append(directory_response)

        # Create collection response
        author = metadata.get("author", {})
        return CollectionResponse(
            id=str(collection.id),
            title=collection.title,
            description=collection.description or "",
            author={
                "name": author.get("name", ""),
                "avatar": author.get("avatar", "")
            },
            categories=metadata.get("categories", []),
            saves=collection.saves,
            directories=directory_responses,
            createdAt=collection.created_at.isoformat() if collection.created_at else ""
        )

    def create_collection(
        self, collection_data: CollectionCreate, created_by_id: UUID
    ) -> CollectionResponse:
        """
        Create a new collection.

        Args:
            collection_data: Collection data to create
            created_by_id: ID of the user creating the collection

        Returns:
            Created collection
        """
        # Create the collection entity
        collection = Collection(
            title=collection_data.title,
            description=collection_data.description,
            saves=collection_data.saves or 0,
            created_by_id=created_by_id,
            collection_metadata={
                "author": {
                    "name": collection_data.author.name,
                    "avatar": collection_data.author.avatar
                },
                "categories": collection_data.categories
            }
        )

        self.db.add(collection)
        self.db.flush()  # Get the ID without committing

        # Add directories to the collection
        directory_responses = []
        for dir_data in collection_data.directories:
            processes_responses = []

            if isinstance(dir_data, str):
                # It's a directory ID, find and link the directory
                existing_dir = self.db.query(Directory).filter(Directory.id == dir_data).first()
                if existing_dir:
                    # Associate existing directory with collection
                    existing_dir.collection_id = collection.id
                    self.db.add(existing_dir)
                    self.db.flush()

                    # Get processes for this directory
                    processes = self.db.query(Process).filter(
                        Process.directory_id == existing_dir.id,
                        Process.is_template == True
                    ).all()

                    # Create process responses
                    for process in processes:
                        processes_responses.append(
                            LibraryProcessResponse(
                                id=str(process.id),
                                title=process.title,
                                description=process.description or "",
                                category=process.category or "",
                                icon=process.process_metadata.get("icon", "") if process.process_metadata else "",
                                benefits=process.process_metadata.get("benefits", []) if process.process_metadata else [],
                                steps=[],  # We'll load steps if needed
                                saves=process.process_metadata.get("saves", 0) if process.process_metadata else 0,
                                created_by=process.process_metadata.get("created_by", "") if process.process_metadata else "",
                                created_at=process.created_at.isoformat() if process.created_at else None
                            )
                        )

                    directory_responses.append(
                        ProcessDirectoryResponse(
                            id=str(existing_dir.id),
                            name=existing_dir.name,
                            description=existing_dir.description or "",
                            color=existing_dir.color or "",
                            processes=processes_responses
                        )
                    )
            else:
                # It's a directory create object, create a new directory
                new_directory = Directory(
                    name=dir_data.name,
                    description=dir_data.description,
                    color=dir_data.color,
                    created_by_id=created_by_id,
                    is_template=True  # Mark as template since it belongs to a collection
                )
                self.db.add(new_directory)
                self.db.flush()  # Get ID without committing

                # Associate directory with collection
                new_directory.collection_id = collection.id
                self.db.add(new_directory)
                self.db.flush()

                # Add processes to this directory
                for process_data in dir_data.processes:
                    if isinstance(process_data, str):
                        # It's a process ID, find and link the process
                        existing_process = self.db.query(Process).filter(Process.id == process_data).first()
                        if existing_process:
                            # Update the directory ID
                            existing_process.directory_id = new_directory.id
                            processes_responses.append(
                                LibraryProcessResponse(
                                    id=str(existing_process.id),
                                    title=existing_process.title,
                                    description=existing_process.description or "",
                                    category=existing_process.category or "",
                                    icon=existing_process.process_metadata.get("icon", "") if existing_process.process_metadata else "",
                                    benefits=existing_process.process_metadata.get("benefits", []) if existing_process.process_metadata else [],
                                    steps=[],  # Load steps separately if needed
                                    saves=existing_process.process_metadata.get("saves", 0) if existing_process.process_metadata else 0,
                                    created_by=existing_process.process_metadata.get("created_by", "") if existing_process.process_metadata else "",
                                    created_at=existing_process.created_at.isoformat() if existing_process.created_at else None
                                )
                            )
                    else:
                        # It's a process create object, create a new process
                        new_process = Process(
                            title=process_data.title,
                            description=process_data.description,
                            category=process_data.category,
                            directory_id=new_directory.id,
                            created_by_id=created_by_id,
                            is_template=True,
                            process_metadata={
                                "icon": process_data.icon,
                                "benefits": process_data.benefits,
                                "saves": process_data.saves or 0,
                                "created_by": process_data.created_by,
                            }
                        )
                        self.db.add(new_process)
                        self.db.flush()  # Get ID without committing

                        # Add steps to this process
                        for i, step_data in enumerate(process_data.steps):
                            new_step = Step(
                                content=step_data.title,
                                process_id=new_process.id,
                                order=i
                                # Step model doesn't have process_metadata field
                            )
                            self.db.add(new_step)

                        # Create response
                        processes_responses.append(
                            LibraryProcessResponse(
                                id=str(new_process.id),
                                title=new_process.title,
                                description=new_process.description or "",
                                category=new_process.category or "",
                                icon=new_process.process_metadata.get("icon", "") if new_process.process_metadata else "",
                                benefits=new_process.process_metadata.get("benefits", []) if new_process.process_metadata else [],
                                steps=process_data.steps,
                                saves=new_process.process_metadata.get("saves", 0) if new_process.process_metadata else 0,
                                created_by=new_process.process_metadata.get("created_by", "") if new_process.process_metadata else "",
                                created_at=new_process.created_at.isoformat() if new_process.created_at else None
                            )
                        )

                directory_responses.append(
                    ProcessDirectoryResponse(
                        id=str(new_directory.id),
                        name=new_directory.name,
                        description=new_directory.description or "",
                        color=new_directory.color or "",
                        processes=processes_responses
                    )
                )

        # Commit the transaction
        self.db.commit()

        # Create and return the response
        return CollectionResponse(
            id=str(collection.id),
            title=collection.title,
            description=collection.description,
            author=collection_data.author,
            categories=collection_data.categories,
            saves=collection.saves,
            directories=directory_responses,
            createdAt=collection.created_at.isoformat() if collection.created_at else ""
        )

    def delete_collection(self, collection_id: str) -> None:
        """
        Delete a collection.

        Args:
            collection_id: ID of the collection to delete

        Raises:
            HTTPException: If collection not found
        """
        # Find the collection
        collection = self.db.query(Collection).filter(
            Collection.id == collection_id
        ).first()

        if not collection:
            raise HTTPException(
                status_code=404,
                detail=f"Collection with ID {collection_id} not found"
            )

        # Get associated directories
        directories = collection.directories

        # We don't want to delete the directories themselves, just the association
        # The directory entries can be reused in other collections
        # Just remove the collection_id from all associated directories
        for directory in directories:
            directory.collection_id = None
            self.db.add(directory)

        # Delete the collection
        self.db.delete(collection)
        self.db.commit()

    def duplicate_collection(self, collection_id: str, user_id: UUID) -> CollectionResponse:
        """
        Duplicate a collection for a user, creating a deep copy of all directories, processes, steps, and substeps.

        Args:
            collection_id: ID of the collection to duplicate
            user_id: ID of the user who will own the duplicate

        Returns:
            The duplicated collection

        Raises:
            HTTPException: If collection not found
        """
        # Find the original collection
        original_collection = self.db.query(Collection).filter(
            Collection.id == collection_id
        ).first()

        if not original_collection:
            raise HTTPException(
                status_code=404,
                detail=f"Collection with ID {collection_id} not found"
            )

        # Create a duplicate of the collection
        metadata = original_collection.collection_metadata or {}

        # Create a new collection based on the original
        new_collection = Collection(
            title=original_collection.title,
            description=original_collection.description,
            saves=0,  # Start with 0 saves
            created_by_id=user_id,
            collection_metadata={
                **metadata,
                "duplicated_from": str(original_collection.id),
                "duplicated_at": datetime.now().isoformat()
            }
        )

        self.db.add(new_collection)
        self.db.flush()  # Get the ID without committing

        # Get all directories from the original collection
        original_directories = original_collection.directories

        # Maps original directory ID to new directory
        directory_map = {}

        # Maps original process ID to new process
        process_map = {}

        # Duplicate directories
        for original_dir in original_directories:
            # Create a new directory
            new_dir = Directory(
                name=original_dir.name,
                description=original_dir.description,
                color=original_dir.color,
                icon=original_dir.icon,
                created_by_id=user_id,
                is_template=True,  # Mark as template since it belongs to a collection
                directory_metadata={
                    "duplicated_from": str(original_dir.id),
                    "duplicated_at": datetime.now().isoformat()
                }
            )
            self.db.add(new_dir)
            self.db.flush()

            # Associate with the new collection
            new_dir.collection_id = new_collection.id
            self.db.add(new_dir)

            # Keep track of directory mapping
            directory_map[str(original_dir.id)] = new_dir

            # Get all processes from this directory
            original_processes = self.db.query(Process).filter(
                Process.directory_id == original_dir.id,
                Process.is_template == True
            ).all()

            # Duplicate each process
            for original_process in original_processes:
                # Create new process
                new_process = Process(
                    title=original_process.title,
                    description=original_process.description,
                    color=original_process.color,
                    category=original_process.category,
                    directory_id=new_dir.id,
                    created_by_id=user_id,
                    is_template=True,
                    process_metadata={
                        **(original_process.process_metadata or {}),
                        "duplicated_from": str(original_process.id),
                        "duplicated_at": datetime.now().isoformat()
                    }
                )
                self.db.add(new_process)
                self.db.flush()
                process_map[str(original_process.id)] = new_process

                # Get steps for the original process
                original_steps = self.db.query(Step).filter(
                    Step.process_id == original_process.id
                ).order_by(Step.order).all()

                # Create steps map to track original to new
                step_map = {}

                # Duplicate steps
                for original_step in original_steps:
                    new_step = Step(
                        content=original_step.content,
                        completed=False,  # Reset completion status
                        order=original_step.order,
                        due_date=original_step.due_date,
                        process_id=new_process.id
                        # Step model doesn't have process_metadata field
                    )
                    self.db.add(new_step)
                    self.db.flush()
                    step_map[str(original_step.id)] = new_step

                    # Get substeps for the original step
                    original_substeps = self.db.query(SubStep).filter(
                        SubStep.step_id == original_step.id
                    ).order_by(SubStep.order).all()

                    # Duplicate substeps
                    for original_substep in original_substeps:
                        new_substep = SubStep(
                            content=original_substep.content,
                            completed=False,  # Reset completion status
                            order=original_substep.order,
                            step_id=new_step.id
                        )
                        self.db.add(new_substep)

        # Commit all changes
        self.db.commit()

        # Refresh the new collection
        self.db.refresh(new_collection)

        # Now build the response object
        return self.get_collection_by_id(str(new_collection.id))

    def increment_collection_saves(self, collection_id: str) -> CollectionResponse:
        """
        Increment the saves count for a collection.

        Args:
            collection_id: ID of the collection to update

        Returns:
            Updated collection

        Raises:
            HTTPException: If collection not found
        """
        # Find the collection by ID
        collection = self.db.query(Collection).filter(
            Collection.id == collection_id
        ).first()

        if not collection:
            raise HTTPException(
                status_code=404,
                detail=f"Collection with ID {collection_id} not found"
            )

        # Increment saves count
        collection.saves += 1

        # Update the collection
        self.db.add(collection)
        self.db.commit()
        self.db.refresh(collection)

        # Return updated collection
        return self.get_collection_by_id(collection_id)

    def get_directories(self) -> List[ProcessDirectoryResponse]:
        """
        Get all directories that are marked as library directories.

        Returns:
            List of directories
        """
        # Get directories that are part of the library
        directories = self.db.query(Directory).filter(
            Directory.directory_metadata.contains({"is_library": True})
        ).all()

        # Convert to response format
        directory_responses = []
        for directory in directories:
            # Get processes for this directory
            processes = self.db.query(Process).filter(
                Process.directory_id == directory.id,
                Process.is_template == True
            ).all()

            # Create process responses
            process_responses = []
            for process in processes:
                # Get steps for this process
                steps = self.db.query(Step).filter(
                    Step.process_id == process.id
                ).order_by(Step.order).all()

                # Create step responses
                step_responses = []
                for step in steps:
                    step_responses.append({
                        "title": step.content,
                        "description": ""  # No description stored in step metadata
                    })

                # Create process response
                process_responses.append(
                    LibraryProcessResponse(
                        id=str(process.id),
                        title=process.title,
                        description=process.description or "",
                        category=process.category or "",
                        icon=process.process_metadata.get("icon", "") if process.process_metadata else "",
                        benefits=process.process_metadata.get("benefits", []) if process.process_metadata else [],
                        steps=step_responses,
                        saves=process.process_metadata.get("saves", 0) if process.process_metadata else 0,
                        created_by=process.process_metadata.get("created_by", "") if process.process_metadata else "",
                        created_at=process.created_at.isoformat() if process.created_at else None
                    )
                )

            # Create directory response
            directory_responses.append(
                ProcessDirectoryResponse(
                    id=str(directory.id),
                    name=directory.name,
                    description=directory.description or "",
                    color=directory.color or "",
                    processes=process_responses
                )
            )

        return directory_responses

    def get_processes(self, category: Optional[str] = None) -> List[LibraryProcessResponse]:
        """
        Get all template processes, optionally filtered by category.

        Args:
            category: Optional category to filter by

        Returns:
            List of processes
        """
        # Query for template processes
        query = self.db.query(Process).filter(Process.is_template == True)

        # Apply category filter if provided
        if category:
            query = query.filter(Process.category == category)

        # Get processes
        processes = query.all()

        # Convert to response format
        process_responses = []
        for process in processes:
            # Get steps for this process
            steps = self.db.query(Step).filter(
                Step.process_id == process.id
            ).order_by(Step.order).all()

            # Create step responses
            step_responses = []
            for step in steps:
                step_responses.append({
                    "title": step.content,
                    "description": ""  # Step doesn't have process_metadata field
                })

            # Create process response
            process_responses.append(
                LibraryProcessResponse(
                    id=str(process.id),
                    title=process.title,
                    description=process.description or "",
                    category=process.category or "",
                    icon=process.process_metadata.get("icon", "") if process.process_metadata else "",
                    benefits=process.process_metadata.get("benefits", []) if process.process_metadata else [],
                    steps=step_responses,
                    saves=process.process_metadata.get("saves", 0) if process.process_metadata else 0,
                    created_by=process.process_metadata.get("created_by", "") if process.process_metadata else "",
                    created_at=process.created_at.isoformat() if process.created_at else None
                )
            )

        return process_responses

    def initialize_library(self) -> LibraryInitializeResponse:
        """
        Initialize the library with predefined collections, directories, and processes.

        Returns:
            Status of the initialization
        """
        try:
            # Define library data directly
            # This is hardcoded here rather than imported from frontend to avoid cross-package dependencies

            # Define processes
            WORKFLOW_PROCESSES = [
                {
                    "id": "project-kickoff",
                    "title": "Project Kickoff",
                    "description": "Start your new project with proper planning and alignment.",
                    "category": "project-management",
                    "icon": "RocketLaunch",
                    "benefits": [
                        "Never miss critical initial steps when launching a new project",
                        "Automatically create recurring check-in meetings with stakeholders",
                        "Log decisions and action items for easy reference later",
                        "Track project progress with visual indicators",
                    ],
                    "steps": [
                        {
                            "title": "Define Project Scope & Objectives",
                            "description": "Document the project goals, deliverables, constraints, and success criteria.",
                        },
                        {
                            "title": "Stakeholder Identification & Analysis",
                            "description": "Identify all project stakeholders and document their expectations and influence.",
                        },
                        {
                            "title": "Resource Planning",
                            "description": "Determine the resources needed for the project including team members, tools, and budget.",
                        },
                        {
                            "title": "Risk Assessment",
                            "description": "Identify potential risks and develop mitigation strategies.",
                        },
                        {
                            "title": "Communication Plan",
                            "description": "Establish how project updates will be communicated to stakeholders.",
                        },
                        {
                            "title": "Kickoff Meeting",
                            "description": "Schedule and conduct a kickoff meeting with all team members and key stakeholders.",
                        },
                    ],
                    "saves": 2456,
                    "createdBy": "Project Management Institute",
                    "createdAt": "2023-09-15",
                },
                {
                    "id": "one-on-one",
                    "title": "Effective One-on-Ones",
                    "description": "Transform routine check-ins into powerful opportunities for leadership growth and team development.",
                    "category": "management",
                    "icon": "ChatBubbleLeftRight",
                    "benefits": [
                        "Build trust and psychological safety through structured yet personalized conversations",
                        "Create a continuous feedback loop that enhances performance and satisfaction",
                        "Maintain a searchable timeline of discussion topics and breakthroughs",
                        "Generate insights on team engagement patterns across different time periods",
                    ],
                    "steps": [
                        {
                            "title": "Pre-Meeting Preparation",
                            "description": "Review previous notes and prepare discussion points for both ongoing and new topics.",
                        },
                        {
                            "title": "Personal Check-in",
                            "description": "Begin with a genuine inquiry into wellbeing to establish psychological safety and connection.",
                        },
                        {
                            "title": "Progress Update",
                            "description": "Review achievements and blockers since last meeting, with focus on removing obstacles.",
                        },
                        {
                            "title": "Development Discussion",
                            "description": "Dedicate time to career growth conversations and learning opportunities.",
                        },
                        {
                            "title": "Bidirectional Feedback",
                            "description": "Exchange honest, specific feedback on recent work and leadership/management style.",
                        },
                        {
                            "title": "Action Planning",
                            "description": "Collaboratively create SMART goals and commitments before the next meeting.",
                        },
                        {
                            "title": "Documentation",
                            "description": "Record key discussion points, decisions and actions in a shared, searchable format.",
                        },
                    ],
                    "saves": 1879,
                    "createdBy": "Leadership Lab",
                    "createdAt": "2023-10-22",
                }
            ]

            # Research processes
            RESEARCH_PROCESSES = [
                {
                    "id": "user-research-study",
                    "title": "User Research Study",
                    "description": "Conduct comprehensive user research to inform product decisions with evidence-based insights.",
                    "category": "research",
                    "icon": "AcademicCap",
                    "benefits": [
                        "Build deep understanding of user needs, behaviors, and pain points",
                        "Create a searchable repository of user insights for cross-team reference",
                        "Generate data-driven requirements that reduce development rework",
                        "Identify unmet needs that create new product opportunities",
                    ],
                    "steps": [
                        {
                            "title": "Research Objective Definition",
                            "description": "Clearly articulate the research questions and goals that will guide the study.",
                        },
                        {
                            "title": "Methodology Selection",
                            "description": "Choose appropriate research methods based on objectives, timeline, and resources.",
                        },
                        {
                            "title": "Participant Recruitment",
                            "description": "Identify and recruit participants that represent your target user segments.",
                        },
                        {
                            "title": "Research Protocol Development",
                            "description": "Create detailed scripts, tasks, and discussion guides for consistent execution.",
                        },
                        {
                            "title": "Study Execution",
                            "description": "Conduct research sessions with systematic data collection and documentation.",
                        },
                        {
                            "title": "Data Analysis",
                            "description": "Process collected data to identify patterns, insights, and actionable findings.",
                        },
                        {
                            "title": "Insight Synthesis",
                            "description": "Transform raw findings into structured insights that inform product decisions.",
                        },
                        {
                            "title": "Recommendations & Implementation",
                            "description": "Develop concrete recommendations and integrate findings into product planning.",
                        },
                    ],
                    "saves": 2185,
                    "createdBy": "User Research Institute",
                    "createdAt": "2023-07-12",
                }
            ]

            # Design processes
            DESIGN_PROCESSES = [
                {
                    "id": "ux-design-system",
                    "title": "UX Design System Creation",
                    "description": "Build a comprehensive design system that ensures consistency and accelerates product development.",
                    "category": "design",
                    "icon": "LightBulb",
                    "benefits": [
                        "Establish a single source of truth for design assets and patterns",
                        "Accelerate design and development with reusable components",
                        "Ensure consistent user experience across products and platforms",
                        "Facilitate collaboration between design and engineering teams",
                    ],
                    "steps": [
                        {
                            "title": "Design Audit",
                            "description": "Inventory existing design patterns and inconsistencies across products.",
                        },
                        {
                            "title": "Design Principles",
                            "description": "Define core principles that will guide all design decisions and evaluations.",
                        },
                        {
                            "title": "Visual Language Foundation",
                            "description": "Establish color systems, typography, spacing, and grid frameworks.",
                        },
                        {
                            "title": "Component Library Creation",
                            "description": "Design and document reusable UI components with usage guidelines.",
                        },
                        {
                            "title": "Pattern Documentation",
                            "description": "Create interactive documentation of interaction patterns and workflows.",
                        },
                        {
                            "title": "Technical Implementation",
                            "description": "Develop code-based components that implement the design system.",
                        },
                        {
                            "title": "Governance Structure",
                            "description": "Establish processes for maintaining and evolving the design system.",
                        },
                        {
                            "title": "Adoption & Training",
                            "description": "Roll out the system with appropriate training and support materials.",
                        },
                    ],
                    "saves": 2312,
                    "createdBy": "Design Systems Collective",
                    "createdAt": "2023-05-18",
                }
            ]

            # Define library data
            LIBRARY_DATA = [
                {
                    "id": "startup-toolkit",
                    "title": "Startup Success Toolkit",
                    "description": "Essential processes and frameworks for early-stage ventures to build strong foundations, refine product-market fit, and scale efficiently.",
                    "author": {
                        "name": "Startup Accelerator Network",
                        "avatar": "/profile/profile-picture-1.jpg",
                    },
                    "categories": ["project-management", "product", "engineering"],
                    "saves": 3245,
                    "directories": [
                        {
                            "id": "project-processes",
                            "name": "Project Management Essentials",
                            "description": "Core processes for effective project planning, execution, and delivery.",
                            "processes": WORKFLOW_PROCESSES,
                            "color": "from-blue-500 to-purple-500",
                        }
                    ],
                    "createdAt": "2023-11-15",
                },
                {
                    "id": "product-discovery",
                    "title": "Product Discovery Essentials",
                    "description": "Comprehensive toolkit for validating ideas, gathering insights, and making evidence-based product decisions.",
                    "author": {
                        "name": "Product Research Collective",
                        "avatar": "/profile/profile-picture-6.jpg",
                    },
                    "categories": ["research", "product", "design"],
                    "saves": 2346,
                    "directories": [
                        {
                            "id": "research-processes",
                            "name": "Research Methodologies",
                            "description": "Structured approaches to gather insights and inform evidence-based decisions.",
                            "processes": RESEARCH_PROCESSES,
                            "color": "from-indigo-500 to-blue-700",
                        },
                        {
                            "id": "design-processes",
                            "name": "Design Excellence",
                            "description": "Frameworks for creating exceptional user experiences and visual systems.",
                            "processes": DESIGN_PROCESSES,
                            "color": "from-purple-500 to-pink-600",
                        }
                    ],
                    "createdAt": "2023-08-28",
                },
                {
                    "id": "design-research-system",
                    "title": "Design & Research Excellence",
                    "description": "Integrated approach to user-centered design that combines robust research methodologies with advanced design practices.",
                    "author": {
                        "name": "Design Research Institute",
                        "avatar": "/profile/profile-picture-7.jpg",
                    },
                    "categories": ["design", "research"],
                    "saves": 2189,
                    "directories": [
                        {
                            "id": "design-processes",
                            "name": "Design Excellence",
                            "description": "Frameworks for creating exceptional user experiences and visual systems.",
                            "processes": DESIGN_PROCESSES,
                            "color": "from-purple-500 to-pink-600",
                        },
                        {
                            "id": "research-processes",
                            "name": "Research Methodologies",
                            "description": "Structured approaches to gather insights and inform evidence-based decisions.",
                            "processes": RESEARCH_PROCESSES,
                            "color": "from-indigo-500 to-blue-700",
                        }
                    ],
                    "createdAt": "2023-06-15",
                }
            ]

            # Track created items
            collections_created = 0
            directories_created = 0
            processes_created = 0

            # Find or create admin user as creator
            admin = self.db.query(User).filter(User.email == "admin@convers.me").first()
            if not admin:
                admin = User(
                    email="admin@convers.me",
                    name="Admin User",
                    handle="admin",
                    is_admin=True
                )
                self.db.add(admin)
                self.db.flush()

            # Create the collections
            for collection_data in LIBRARY_DATA:
                # Check if collection already exists
                existing = self.db.query(Collection).filter(
                    Collection.title == collection_data["title"]
                ).first()

                if not existing:
                    # Create the collection
                    collection = Collection(
                        title=collection_data["title"],
                        description=collection_data["description"],
                        saves=collection_data.get("saves", 0),
                        created_by_id=admin.id,
                        collection_metadata={
                            "author": {
                                "name": collection_data["author"]["name"],
                                "avatar": collection_data["author"]["avatar"]
                            },
                            "categories": collection_data["categories"]
                        }
                    )
                    self.db.add(collection)
                    self.db.flush()
                    collections_created += 1

                    # Create directories within the collection
                    for directory_data in collection_data["directories"]:
                        # Create the directory as a template
                        directory = Directory(
                            name=directory_data["name"],
                            description=directory_data["description"],
                            color=directory_data["color"],
                            created_by_id=admin.id,
                            is_template=True  # Mark as template since it belongs to a collection
                        )
                        self.db.add(directory)
                        self.db.flush()
                        directories_created += 1

                        # Associate directory with collection
                        directory.collection_id = collection.id
                        self.db.add(directory)
                        self.db.flush()

                        # Create processes in the directory
                        for process_data in directory_data["processes"]:
                            process = Process(
                                title=process_data["title"],
                                description=process_data["description"],
                                category=process_data["category"],
                                directory_id=directory.id,
                                created_by_id=admin.id,
                                is_template=True,
                                process_metadata={
                                    "icon": process_data["icon"],
                                    "benefits": process_data["benefits"],
                                    "saves": process_data.get("saves", 0),
                                    "created_by": process_data.get("createdBy", ""),
                                }
                            )
                            self.db.add(process)
                            self.db.flush()
                            processes_created += 1

                            # Create steps for the process
                            for i, step_data in enumerate(process_data["steps"]):
                                # Create step without using process_metadata
                                step = Step(
                                    content=step_data["title"],
                                    process_id=process.id,
                                    order=i
                                )
                                self.db.add(step)

            # Commit all changes
            self.db.commit()

            return LibraryInitializeResponse(
                success=True,
                message="Library initialized successfully",
                collections_created=collections_created,
                directories_created=directories_created,
                processes_created=processes_created
            )

        except Exception as e:
            self.db.rollback()
            logger.error(f"Error initializing library: {str(e)}")
            return LibraryInitializeResponse(
                success=False,
                message=f"Error initializing library: {str(e)}"
            )
