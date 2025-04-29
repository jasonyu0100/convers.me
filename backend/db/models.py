"""
SQLAlchemy models for the database.
"""

import enum
from typing import Any, Dict

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Index, Integer, String, Table, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from db.database import Base


# Enum definitions
class MediaTypeEnum(str, enum.Enum):
    """Media type enum."""

    VIDEO = "video"
    IMAGE = "image"
    AUDIO = "audio"
    QUOTE = "quote"
    EVENT = "event"


class EventStatusEnum(str, enum.Enum):
    """Event status enum."""

    PENDING = "Pending"
    PLANNING = "Planning"
    EXECUTION = "Execution"
    REVIEW = "Review"
    ADMINISTRATIVE = "Administrative"
    DONE = "Done"


class ParticipantStatusEnum(str, enum.Enum):
    """Participant status enum."""

    INVITED = "invited"
    CONFIRMED = "confirmed"
    DECLINED = "declined"
    ATTENDED = "attended"


class NotificationTypeEnum(str, enum.Enum):
    """Notification type enum."""

    MENTION = "mention"
    COMMENT = "comment"
    EVENT_INVITE = "event_invite"
    EVENT_REMINDER = "event_reminder"
    EVENT_UPDATE = "event_update"
    NEW_MESSAGE = "new_message"
    SYSTEM = "system"
    FOLLOW = "follow"


# Association tables for many-to-many relationships
event_topics = Table(
    "event_topics",
    Base.metadata,
    Column("event_id", UUID, ForeignKey("events.id", ondelete="CASCADE"), primary_key=True),
    Column("topic_id", UUID, ForeignKey("topics.id", ondelete="CASCADE"), primary_key=True),
    Index("idx_event_topics_event_id", "event_id"),
    Index("idx_event_topics_topic_id", "topic_id"),
)


# Base model mixin with common fields
class TimestampMixin:
    """Base mixin for timestamp fields."""

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# Models
class User(Base, TimestampMixin):
    """User model."""

    __tablename__ = "users"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    name = Column(String, nullable=False)
    handle = Column(String, nullable=False, unique=True)
    email = Column(String, unique=True)
    profile_image = Column(String)
    bio = Column(Text)
    password_hash = Column(String)
    user_metadata = Column(JSONB, default={})
    is_admin = Column(Boolean, default=False)  # Renamed from 'metadata' to avoid SQLAlchemy conflict

    # Relationships
    events_created = relationship("Event", back_populates="created_by")
    processes_created = relationship("Process", back_populates="created_by")
    posts = relationship("Post", back_populates="author")
    event_participants = relationship("EventParticipant", back_populates="user")
    preferences = relationship("UserPreferences", back_populates="user", uselist=False)
    notifications = relationship("Notification", foreign_keys="Notification.user_id", back_populates="user")
    sent_notifications = relationship("Notification", foreign_keys="Notification.sender_id", back_populates="sender")
    status_logs = relationship("StatusLog", back_populates="user")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    live_contexts = relationship("LiveContext", foreign_keys="LiveContext.user_id", back_populates="user", cascade="all, delete-orphan")

    # Indices
    __table_args__ = (Index("idx_users_email", email), Index("idx_users_handle", handle))

    @property
    def is_guest(self) -> bool:
        """Check if this user is a guest account."""
        if not self.user_metadata:
            return False
        return bool(self.user_metadata.get("is_guest", False))

    @property
    def guest_role(self) -> str:
        """Get the guest role if user is a guest account."""
        if not self.is_guest or not self.user_metadata:
            return ""
        return str(self.user_metadata.get("guest_role", "dev"))

    def to_dict(self) -> Dict[str, Any]:
        """Convert User object to dictionary."""
        # Ensure metadata is always a dict
        metadata = self.user_metadata or {}
        if not isinstance(metadata, dict):
            metadata = {}

        return {
            "id": str(self.id),
            "name": self.name,
            "handle": self.handle,
            "email": self.email,
            "profileImage": self.profile_image,  # Use camelCase for frontend
            "bio": self.bio,
            "metadata": metadata,  # Include renamed field as a dictionary
            "isGuest": self.is_guest,  # Include guest status
            "isAdmin": self.is_admin,  # Include admin status
            "guestRole": self.guest_role if self.is_guest else None,  # Include role if guest
            "reports": [report.to_dict() for report in getattr(self, "reports", [])] if hasattr(self, "reports") else [],  # Include reports if loaded
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class Topic(Base, TimestampMixin):
    """Topic model."""

    __tablename__ = "topics"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    name = Column(String, nullable=False)
    category = Column(String)
    color = Column(String)

    # Relationships
    events = relationship("Event", secondary=event_topics, back_populates="topics")

    # Indices
    __table_args__ = (Index("idx_topics_name", name), Index("idx_topics_category", category))

    def to_dict(self) -> Dict[str, Any]:
        """Convert Topic object to dictionary."""
        return {
            "id": str(self.id),
            "name": self.name,
            "category": self.category,
            "color": self.color,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class Event(Base, TimestampMixin):
    """Event model."""

    __tablename__ = "events"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    title = Column(String, nullable=False)
    description = Column(Text)
    # New datetime fields replacing date/time/duration
    start_time = Column(DateTime(timezone=True), nullable=False)  # Start time with timezone
    end_time = Column(DateTime(timezone=True), nullable=False)  # End time with timezone
    # Keep original fields for backwards compatibility during migration
    date = Column(String)  # ISO date string
    time = Column(String)  # Time of day
    duration = Column(String)  # Duration format (e.g. "60min")
    status = Column(Enum(EventStatusEnum))
    complexity = Column(Integer)  # 1-5 scale
    color = Column(String)
    location = Column(String)
    # Removed is_recurring field - recurring events are no longer supported
    recording_url = Column(String)
    event_metadata = Column(JSONB, default={})  # Renamed from 'metadata' to avoid SQLAlchemy conflict

    # Foreign keys
    created_by_id = Column(UUID, ForeignKey("users.id", ondelete="SET NULL"))
    process_id = Column(UUID, ForeignKey("processes.id", ondelete="SET NULL"))

    # Relationships
    created_by = relationship("User", back_populates="events_created")
    process = relationship("Process", back_populates="events")
    participants = relationship("EventParticipant", back_populates="event", cascade="all, delete-orphan")
    topics = relationship("Topic", secondary=event_topics, back_populates="events")
    posts = relationship("Post", back_populates="event", cascade="all, delete-orphan")
    media = relationship("Media", back_populates="event", cascade="all, delete-orphan")
    status_logs = relationship("StatusLog", back_populates="event", cascade="all, delete-orphan")

    # Indices
    __table_args__ = (
        Index("idx_events_created_by_id", created_by_id),
        Index("idx_events_process_id", process_id),
        Index("idx_events_start_time", start_time),
        Index("idx_events_end_time", end_time),
        Index("idx_events_date", date),  # Keep for backwards compatibility
        Index("idx_events_status", status),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert Event object to dictionary."""
        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "startTime": self.start_time.isoformat() if self.start_time else None,
            "endTime": self.end_time.isoformat() if self.end_time else None,
            # Keep old fields for backwards compatibility
            "date": self.date,
            "time": self.time,
            "duration": self.duration,
            "status": self.status.value if self.status else None,
            "complexity": self.complexity,
            "color": self.color,
            "location": self.location,
            # Removed isRecurring field - recurring events are no longer supported
            "recordingUrl": self.recording_url,
            "metadata": self.event_metadata,
            "createdById": str(self.created_by_id) if self.created_by_id else None,
            "processId": str(self.process_id) if self.process_id else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "topics": [topic.to_dict() for topic in self.topics] if self.topics else [],
            "participants": ([p.to_dict() for p in self.participants] if self.participants else []),
        }


class StatusLog(Base, TimestampMixin):
    """Status Log model for tracking event status changes."""

    __tablename__ = "status_logs"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    previous_status = Column(Enum(EventStatusEnum), nullable=True)  # Null for initial status
    new_status = Column(Enum(EventStatusEnum), nullable=False)

    # Foreign keys
    event_id = Column(UUID, ForeignKey("events.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID, ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    event = relationship("Event", back_populates="status_logs")
    user = relationship("User", back_populates="status_logs")

    # Indices
    __table_args__ = (
        Index("idx_status_logs_event_id", event_id),
        Index("idx_status_logs_user_id", user_id),
        Index("idx_status_logs_new_status", new_status),
        Index("idx_status_logs_created_at", "created_at"),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert StatusLog object to dictionary."""
        return {
            "id": str(self.id),
            "previousStatus": self.previous_status.value if self.previous_status else None,
            "newStatus": self.new_status.value,
            "eventId": str(self.event_id),
            "userId": str(self.user_id) if self.user_id else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class Directory(Base, TimestampMixin):
    """Directory model for organizing processes."""

    __tablename__ = "directories"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    name = Column(String, nullable=False)
    description = Column(Text)
    color = Column(String)
    icon = Column(String)
    directory_metadata = Column(JSONB, default={})  # Any additional metadata

    # Foreign keys
    created_by_id = Column(UUID, ForeignKey("users.id", ondelete="SET NULL"))
    parent_id = Column(UUID, ForeignKey("directories.id", ondelete="SET NULL"))  # For nested directories

    # Relationships
    created_by = relationship("User")
    parent = relationship("Directory", remote_side=[id], backref="subdirectories")
    processes = relationship("Process", back_populates="directory")

    # Indices
    __table_args__ = (Index("idx_directories_created_by_id", created_by_id), Index("idx_directories_parent_id", parent_id), Index("idx_directories_name", name))

    def to_dict(self) -> Dict[str, Any]:
        """Convert Directory object to dictionary."""
        # Get process IDs if processes have been loaded
        process_ids = []
        if hasattr(self, "processes") and self.processes:
            process_ids = [str(process.id) for process in self.processes]

        return {
            "id": str(self.id),
            "name": self.name,
            "description": self.description,
            "color": self.color,
            "icon": self.icon,
            "metadata": self.directory_metadata,
            "createdById": str(self.created_by_id) if self.created_by_id else None,
            "parentId": str(self.parent_id) if self.parent_id else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "processes": process_ids,
        }


class Process(Base, TimestampMixin):
    """Process model."""

    __tablename__ = "processes"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    title = Column(String, nullable=False)
    description = Column(Text)
    color = Column(String)
    last_updated = Column(String)
    favorite = Column(Boolean, default=False)
    category = Column(String)
    process_metadata = Column(JSONB, default={})  # Renamed from 'metadata' to avoid SQLAlchemy conflict
    is_template = Column(Boolean, default=False)  # Whether this is a template or an actual process

    # Foreign keys
    created_by_id = Column(UUID, ForeignKey("users.id", ondelete="SET NULL"))
    directory_id = Column(UUID, ForeignKey("directories.id", ondelete="SET NULL"))  # Field for directory association
    template_id = Column(UUID, ForeignKey("processes.id", ondelete="SET NULL"))  # For processes created from templates

    # Relationships
    created_by = relationship("User", back_populates="processes_created")
    directory = relationship("Directory", back_populates="processes")
    events = relationship("Event", back_populates="process")
    steps = relationship("Step", back_populates="process", cascade="all, delete-orphan")
    template = relationship("Process", remote_side=[id], backref="instances")

    # Indices
    __table_args__ = (
        Index("idx_processes_created_by_id", created_by_id),
        Index("idx_processes_directory_id", directory_id),
        Index("idx_processes_category", category),
        Index("idx_processes_favorite", favorite),
        Index("idx_processes_is_template", is_template),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert Process object to dictionary."""
        steps_data = []

        # Get steps from the relationship descriptor
        # This works with both eager loading and lazy loading
        steps = getattr(self, "steps", None)

        # Ensure steps and their substeps are properly included
        if steps:
            # Sort steps by order for consistent output
            sorted_steps = sorted(steps, key=lambda s: s.order if s.order is not None else 999)
            for step in sorted_steps:
                step_dict = {
                    "id": str(step.id),
                    "content": step.content,
                    "completed": step.completed,
                    "completedAt": step.completed_at.isoformat() if step.completed_at else None,
                    "order": step.order,
                    "dueDate": step.due_date,
                    "processId": str(step.process_id),
                    "createdAt": step.created_at.isoformat() if step.created_at else None,
                    "updatedAt": step.updated_at.isoformat() if step.updated_at else None,
                    "subSteps": [],
                }

                # Include substeps if they exist
                # Get substeps from the relationship descriptor
                substeps = getattr(step, "sub_steps", None)
                if substeps:
                    # Sort substeps by order for consistent output
                    sorted_substeps = sorted(substeps, key=lambda ss: ss.order if ss.order is not None else 999)
                    step_dict["subSteps"] = [sub.to_dict() for sub in sorted_substeps]

                steps_data.append(step_dict)

        # Collect instance IDs if instances have been loaded and this is a template
        instance_ids = []
        if self.is_template and hasattr(self, "instances") and self.instances:
            instance_ids = [str(instance.id) for instance in self.instances]

        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "color": self.color,
            "lastUpdated": self.last_updated,
            "favorite": self.favorite,
            "category": self.category,
            "metadata": self.process_metadata,
            "isTemplate": self.is_template,
            "createdById": str(self.created_by_id) if self.created_by_id else None,
            "directoryId": str(self.directory_id) if self.directory_id else None,
            "templateId": str(self.template_id) if self.template_id else None,
            "instanceIds": instance_ids if instance_ids else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "steps": steps_data,
        }


class Step(Base, TimestampMixin):
    """Step model."""

    __tablename__ = "steps"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    content = Column(Text, nullable=False)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)  # When the step was completed
    order = Column(Integer, nullable=False)
    due_date = Column(String)

    # Foreign key - only process_id is valid now
    process_id = Column(UUID, ForeignKey("processes.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    process = relationship("Process", back_populates="steps")
    sub_steps = relationship("SubStep", back_populates="step", cascade="all, delete-orphan")

    # Indices
    __table_args__ = (
        Index("idx_steps_process_id", process_id),
        Index("idx_steps_order", order),
        Index("idx_steps_completed", completed),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert Step object to dictionary."""
        return {
            "id": str(self.id),
            "content": self.content,
            "completed": self.completed,
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
            "order": self.order,
            "dueDate": self.due_date,
            "processId": str(self.process_id),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "subSteps": ([sub.to_dict() for sub in self.sub_steps] if self.sub_steps else []),
        }


class SubStep(Base, TimestampMixin):
    """SubStep model."""

    __tablename__ = "sub_steps"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    content = Column(Text, nullable=False)
    completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)  # When the substep was completed
    order = Column(Integer, nullable=False)

    # Foreign keys
    step_id = Column(UUID, ForeignKey("steps.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    step = relationship("Step", back_populates="sub_steps")

    # Indices
    __table_args__ = (Index("idx_sub_steps_step_id", step_id), Index("idx_sub_steps_order", order), Index("idx_sub_steps_completed", completed))

    def to_dict(self) -> Dict[str, Any]:
        """Convert SubStep object to dictionary."""
        return {
            "id": str(self.id),
            "content": self.content,
            "completed": self.completed,
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
            "order": self.order,
            "stepId": str(self.step_id),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class Post(Base, TimestampMixin):
    """Post model."""

    __tablename__ = "posts"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    content = Column(Text, nullable=False)
    visibility = Column(String, default="public")  # 'public', 'private', 'team'

    # Foreign keys
    author_id = Column(UUID, ForeignKey("users.id", ondelete="SET NULL"), nullable=False)
    event_id = Column(UUID, ForeignKey("events.id", ondelete="SET NULL"))

    # Relationships
    author = relationship("User", back_populates="posts")
    event = relationship("Event", back_populates="posts")
    media = relationship("Media", back_populates="post", cascade="all, delete-orphan")

    # Indices
    __table_args__ = (Index("idx_posts_author_id", author_id), Index("idx_posts_event_id", event_id), Index("idx_posts_created_at", "created_at"))

    def to_dict(self) -> Dict[str, Any]:
        """Convert Post object to dictionary."""
        return {
            "id": str(self.id),
            "content": self.content,
            "visibility": self.visibility,
            "authorId": str(self.author_id),
            "eventId": str(self.event_id) if self.event_id else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "media": [m.to_dict() for m in self.media] if self.media else [],
            "author": self.author.to_dict() if self.author else None,
        }


# Note: The Room model has been removed. It was deprecated and replaced by the Event model.
# The frontend should use Event objects directly rather than Room objects.


class Media(Base, TimestampMixin):
    """Media model."""

    __tablename__ = "media"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    type = Column(Enum(MediaTypeEnum), nullable=False)
    title = Column(String)
    url = Column(String, nullable=False)
    duration = Column(String)
    aspect_ratio = Column(String)
    file_size = Column(Integer)  # Size in bytes
    mime_type = Column(String)
    thumbnail_url = Column(String)
    media_metadata = Column(JSONB, default={})  # Renamed from 'metadata' to avoid SQLAlchemy conflict

    # Foreign keys
    post_id = Column(UUID, ForeignKey("posts.id", ondelete="CASCADE"))
    event_id = Column(UUID, ForeignKey("events.id", ondelete="CASCADE"))
    created_by_id = Column(UUID, ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    post = relationship("Post", back_populates="media")
    event = relationship("Event", back_populates="media")

    # Indices
    __table_args__ = (Index("idx_media_post_id", post_id), Index("idx_media_event_id", event_id), Index("idx_media_type", type))

    def to_dict(self) -> Dict[str, Any]:
        """Convert Media object to dictionary."""
        return {
            "id": str(self.id),
            "type": self.type.value if self.type else None,
            "title": self.title,
            "url": self.url,
            "duration": self.duration,
            "aspectRatio": self.aspect_ratio,
            "fileSize": self.file_size,
            "mimeType": self.mime_type,
            "thumbnailUrl": self.thumbnail_url,
            "metadata": self.media_metadata,
            "postId": str(self.post_id) if self.post_id else None,
            "eventId": str(self.event_id) if self.event_id else None,
            "createdById": str(self.created_by_id) if self.created_by_id else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class EventParticipant(Base):
    """EventParticipant model."""

    __tablename__ = "event_participants"

    event_id = Column(UUID, ForeignKey("events.id", ondelete="CASCADE"), primary_key=True)
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role = Column(String)
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    status = Column(Enum(ParticipantStatusEnum), default=ParticipantStatusEnum.INVITED)

    # Relationships
    event = relationship("Event", back_populates="participants")
    user = relationship("User", back_populates="event_participants")

    # Indices
    __table_args__ = (
        Index("idx_event_participants_event_id", event_id),
        Index("idx_event_participants_user_id", user_id),
        Index("idx_event_participants_status", status),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert EventParticipant object to dictionary."""
        return {
            "eventId": str(self.event_id),
            "userId": str(self.user_id),
            "role": self.role,
            "joinedAt": self.joined_at.isoformat() if self.joined_at else None,
            "status": self.status.value if self.status else None,
            "user": self.user.to_dict() if self.user else None,
        }


class UserPreferences(Base, TimestampMixin):
    """UserPreferences model."""

    __tablename__ = "user_preferences"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    theme = Column(String, default="system")  # 'light', 'dark', 'system'
    email_notifications = Column(Boolean, default=True)
    time_zone = Column(String, default="UTC")
    language = Column(String, default="en")
    additional_settings = Column(JSONB, default={})

    # Foreign key
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)

    # Relationships
    user = relationship("User", back_populates="preferences")

    # Indices
    __table_args__ = (Index("idx_user_preferences_user_id", user_id),)

    def to_dict(self) -> Dict[str, Any]:
        """Convert UserPreferences object to dictionary."""
        return {
            "id": str(self.id),
            "theme": self.theme,
            "emailNotifications": self.email_notifications,
            "timeZone": self.time_zone,
            "language": self.language,
            "additionalSettings": self.additional_settings,
            "userId": str(self.user_id),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class Notification(Base, TimestampMixin):
    """Notification model."""

    __tablename__ = "notifications"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    type = Column(Enum(NotificationTypeEnum), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    link = Column(String)
    read = Column(Boolean, default=False)
    reference_id = Column(UUID)  # ID of related entity (event, post, etc.)
    reference_type = Column(String)  # Type of related entity ("event", "post", etc.)
    notification_metadata = Column(JSONB, default={})

    # Foreign keys
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sender_id = Column(UUID, ForeignKey("users.id", ondelete="SET NULL"))

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="notifications")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_notifications")

    # Indices
    __table_args__ = (
        Index("idx_notifications_user_id", user_id),
        Index("idx_notifications_sender_id", sender_id),
        Index("idx_notifications_read", read),
        Index("idx_notifications_created_at", "created_at"),
        Index("idx_notifications_type", type),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert Notification object to dictionary."""
        return {
            "id": str(self.id),
            "type": self.type.value if self.type else None,
            "title": self.title,
            "message": self.message,
            "link": self.link,
            "read": self.read,
            "referenceId": str(self.reference_id) if self.reference_id else None,
            "referenceType": self.reference_type,
            "metadata": self.notification_metadata,
            "userId": str(self.user_id),
            "senderId": str(self.sender_id) if self.sender_id else None,
            "sender": self.sender.to_dict() if self.sender else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class Report(Base, TimestampMixin):
    """Report model for downloadable reports."""

    __tablename__ = "reports"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    title = Column(String, nullable=False)
    description = Column(Text)
    file_url = Column(String, nullable=False)  # URL to the PDF file
    report_type = Column(String, nullable=False)  # weekly, quarterly, yearly
    date_range = Column(String)  # e.g., "2023-Q1", "Week 32, 2023"
    size = Column(Integer)  # Size in bytes
    report_metadata = Column(JSONB, default={})

    # Foreign keys
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    # Relationships
    user = relationship("User", back_populates="reports")

    # Indices
    __table_args__ = (Index("idx_reports_user_id", user_id), Index("idx_reports_report_type", report_type), Index("idx_reports_created_at", "created_at"))

    def to_dict(self) -> Dict[str, Any]:
        """Convert Report object to dictionary."""
        return {
            "id": str(self.id),
            "title": self.title,
            "description": self.description,
            "fileUrl": self.file_url,
            "reportType": self.report_type,
            "dateRange": self.date_range,
            "size": self.size,
            "metadata": self.report_metadata,
            "userId": str(self.user_id),
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }


class LiveContext(Base, TimestampMixin):
    """Live Context model for storing AI conversation context."""

    __tablename__ = "live_contexts"

    id = Column(UUID, primary_key=True, server_default=func.gen_random_uuid())
    messages = Column(JSONB, default=[])  # List of message objects with role, content, etc.
    live_context_metadata = Column(JSONB, default={})  # Any additional metadata for the context

    # Foreign keys
    user_id = Column(UUID, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    process_id = Column(UUID, ForeignKey("processes.id", ondelete="SET NULL"))
    event_id = Column(UUID, ForeignKey("events.id", ondelete="SET NULL"))
    template_id = Column(UUID, ForeignKey("processes.id", ondelete="SET NULL"))  # For referencing template processes

    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="live_contexts")
    process = relationship("Process", foreign_keys=[process_id])
    event = relationship("Event")
    template = relationship("Process", foreign_keys=[template_id])

    # Indices
    __table_args__ = (
        Index("idx_live_contexts_user_id", user_id),
        Index("idx_live_contexts_process_id", process_id),
        Index("idx_live_contexts_event_id", event_id),
        Index("idx_live_contexts_template_id", template_id),
        Index("idx_live_contexts_created_at", "created_at"),
    )

    def to_dict(self) -> Dict[str, Any]:
        """Convert LiveContext object to dictionary."""
        return {
            "id": str(self.id),
            "messages": self.messages,
            "metadata": self.live_context_metadata,
            "userId": str(self.user_id),
            "processId": str(self.process_id) if self.process_id else None,
            "eventId": str(self.event_id) if self.event_id else None,
            "templateId": str(self.template_id) if self.template_id else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
