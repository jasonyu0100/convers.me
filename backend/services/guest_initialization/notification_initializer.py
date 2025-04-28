"""
Notification initialization module for sample notification creation.
"""

import logging
import random
import uuid
from datetime import datetime, timedelta
from typing import List

from sqlalchemy.orm import Session

from db.models import Event, Notification, NotificationTypeEnum, Post, User

# Set up logging
logger = logging.getLogger(__name__)


class NotificationInitializer:
    """Handles creation of notifications for users."""

    def __init__(self, db: Session):
        """Initialize with database session."""
        self.db = db

    async def create_sample_notifications(self, users: List[User], posts: List[Post], events: List[Event]) -> List[Notification]:
        """
        Create sample notifications for users.

        Args:
            users: List of users to create notifications for
            posts: List of posts to reference in notifications
            events: List of events to reference in notifications

        Returns:
            List[Notification]: Created notifications
        """
        # Delete existing notifications
        self.db.query(Notification).delete()
        self.db.commit()

        notifications = []

        # Create notifications for each user
        for user in users:
            # Create a variety of notification types
            user_notifications = []

            # Comment notifications
            if posts:
                for _ in range(random.randint(1, 2)):
                    random_commenter = random.choice([u for u in users if u.id != user.id]) if len(users) > 1 else users[0]

                    user_notifications.append(
                        {
                            "type": NotificationTypeEnum.COMMENT,
                            "title": "New comment on your post",
                            "message": f"{random_commenter.name} commented on your post about the new feature design",
                            "link": "/feed",
                            "read": random.random() > 0.7,  # 30% chance of being unread
                            "sender_id": random_commenter.id,
                            "reference_type": "post",
                            "reference_id": random.choice(posts).id if posts else None,
                        }
                    )

            # Event invitations
            if events:
                for _ in range(random.randint(1, 2)):
                    random_event = random.choice(events)
                    random_inviter = next((u for u in users if u.id == random_event.created_by_id), users[0])

                    user_notifications.append(
                        {
                            "type": NotificationTypeEnum.EVENT_INVITE,
                            "title": "Meeting invitation",
                            "message": f'You have been invited to "{random_event.title}" meeting',
                            "link": f"/calendar?event={random_event.id}",
                            "read": random.random() > 0.7,
                            "sender_id": random_inviter.id,
                            "reference_type": "event",
                            "reference_id": random_event.id,
                        }
                    )

            # Mentions
            for _ in range(random.randint(1, 2)):
                random_mentioner = random.choice([u for u in users if u.id != user.id]) if len(users) > 1 else users[0]
                context = ""

                if random.random() > 0.5 and events:
                    random_event = random.choice(events)
                    context = f'in "{random_event.title}" room'
                    reference_type = "event"
                    reference_id = random_event.id
                    link = f"/room?event={random_event.id}"
                else:
                    context = "in a comment"
                    reference_type = "post"
                    reference_id = random.choice(posts).id if posts else None
                    link = "/feed"

                user_notifications.append(
                    {
                        "type": NotificationTypeEnum.MENTION,
                        "title": "You were mentioned",
                        "message": f"{random_mentioner.name} mentioned you {context}",
                        "link": link,
                        "read": random.random() > 0.7,
                        "sender_id": random_mentioner.id,
                        "reference_type": reference_type,
                        "reference_id": reference_id,
                    }
                )

            # System notifications
            user_notifications.append(
                {
                    "type": NotificationTypeEnum.SYSTEM,
                    "title": "System update",
                    "message": "A new version of the platform is available with enhanced features",
                    "link": "/settings",
                    "read": random.random() > 0.5,
                    "sender_id": None,
                    "reference_type": "system",
                    "reference_id": None,
                }
            )

            # Event reminders
            if events:
                upcoming_events = [e for e in events if e.status == "upcoming"]
                if upcoming_events:
                    for _ in range(random.randint(1, 2)):
                        random_event = random.choice(upcoming_events)

                        user_notifications.append(
                            {
                                "type": NotificationTypeEnum.EVENT_REMINDER,
                                "title": "Upcoming meeting",
                                "message": f'Reminder: "{random_event.title}" starts in 15 minutes',
                                "link": f"/calendar?event={random_event.id}",
                                "read": random.random() > 0.8,  # Most reminders are unread
                                "sender_id": None,
                                "reference_type": "event",
                                "reference_id": random_event.id,
                            }
                        )

            # Follow notifications
            if random.random() > 0.5:
                random_follower = random.choice([u for u in users if u.id != user.id]) if len(users) > 1 else users[0]

                user_notifications.append(
                    {
                        "type": NotificationTypeEnum.FOLLOW,
                        "title": "New follower",
                        "message": f"{random_follower.name} started following you",
                        "link": f"/profile/{random_follower.handle}",
                        "read": random.random() > 0.7,
                        "sender_id": random_follower.id,
                        "reference_type": "user",
                        "reference_id": random_follower.id,
                    }
                )

            # Shuffle and create notifications with timestamps spread over time
            random.shuffle(user_notifications)

            # Create notifications with timestamps spread over the last week
            for i, notif_data in enumerate(user_notifications):
                # Set creation time: newest notifications first, older ones later
                hours_ago = random.randint(i * 8, (i + 1) * 8)  # Spread over time
                created_at = datetime.utcnow() - timedelta(hours=hours_ago)

                notification = Notification(
                    id=uuid.uuid4(),
                    type=notif_data["type"],
                    title=notif_data["title"],
                    message=notif_data["message"],
                    link=notif_data["link"],
                    read=notif_data["read"],
                    user_id=user.id,
                    sender_id=notif_data["sender_id"],
                    reference_type=notif_data.get("reference_type"),
                    reference_id=notif_data.get("reference_id"),
                    created_at=created_at,
                    notification_metadata={
                        "priority": "normal" if random.random() > 0.2 else "high",
                        "category": "work",
                    },
                )

                self.db.add(notification)
                notifications.append(notification)

        self.db.commit()
        for notification in notifications:
            self.db.refresh(notification)

        logger.info(f"Created {len(notifications)} sample notifications")
        return notifications

    async def create_guest_notifications(self, guest_user: User, team_users: List[User], posts: List[Post], events: List[Event]) -> List[Notification]:
        """
        Create sample notifications for a guest user.

        Args:
            guest_user: The guest user to create notifications for
            team_users: List of team members
            posts: List of posts to reference in notifications
            events: List of events to reference in notifications

        Returns:
            List[Notification]: Created notifications
        """
        # Clear existing notifications for this user
        self.db.query(Notification).filter(Notification.user_id == guest_user.id).delete()
        self.db.commit()

        notifications = []

        # Create welcome notification
        welcome_notification = Notification(
            id=uuid.uuid4(),
            type=NotificationTypeEnum.SYSTEM,
            title="Welcome to Convers.me!",
            message="Welcome! Here's your custom workspace with sample data to help you get started.",
            link="/",
            read=False,
            user_id=guest_user.id,
            sender_id=None,
            reference_type="system",
            reference_id=None,
            created_at=datetime.utcnow() - timedelta(minutes=5),
            notification_metadata={
                "priority": "high",
                "category": "system",
            },
        )
        self.db.add(welcome_notification)
        notifications.append(welcome_notification)

        # Create mention notifications from team members
        for i, team_member in enumerate(random.sample(team_users, min(3, len(team_users)))):
            if team_member.id == guest_user.id:
                continue

            context = ""
            reference_id = None
            link = "/feed"

            # Alternate between post and event mentions
            if i % 2 == 0 and posts:
                reference_post = random.choice(posts)
                context = "in a post"
                reference_type = "post"
                reference_id = reference_post.id
                link = "/feed"
            elif events:
                reference_event = random.choice(events)
                context = f'in "{reference_event.title}" room'
                reference_type = "event"
                reference_id = reference_event.id
                link = f"/room?event={reference_event.id}"
            else:
                context = "in a message"
                reference_type = "message"

            # Create mention notification
            mention_notification = Notification(
                id=uuid.uuid4(),
                type=NotificationTypeEnum.MENTION,
                title="You were mentioned",
                message=f"{team_member.name} mentioned you {context}",
                link=link,
                read=i == 0,  # First notification is read, others unread
                user_id=guest_user.id,
                sender_id=team_member.id,
                reference_type=reference_type,
                reference_id=reference_id,
                created_at=datetime.utcnow() - timedelta(hours=i + 1),
                notification_metadata={
                    "priority": "normal",
                    "category": "social",
                },
            )
            self.db.add(mention_notification)
            notifications.append(mention_notification)

        # Create event notifications
        if events:
            for i, event in enumerate(events[:2]):  # Limit to first 2 events
                # Create event reminder
                event_notification = Notification(
                    id=uuid.uuid4(),
                    type=NotificationTypeEnum.EVENT_REMINDER,
                    title="Upcoming meeting",
                    message=f'Reminder: "{event.title}" is scheduled for today',
                    link=f"/calendar?event={event.id}",
                    read=False,
                    user_id=guest_user.id,
                    sender_id=None,
                    reference_type="event",
                    reference_id=event.id,
                    created_at=datetime.utcnow() - timedelta(hours=3 + i),
                    notification_metadata={
                        "priority": "high",
                        "category": "meeting",
                    },
                )
                self.db.add(event_notification)
                notifications.append(event_notification)

        # Add comment notification if posts exist
        if posts and team_users:
            # Find post by guest user
            guest_posts = [p for p in posts if p.author_id == guest_user.id]
            if guest_posts:
                # Random team member comments on guest post
                commenter = random.choice([u for u in team_users if u.id != guest_user.id])
                post = random.choice(guest_posts)

                comment_notification = Notification(
                    id=uuid.uuid4(),
                    type=NotificationTypeEnum.COMMENT,
                    title="New comment on your post",
                    message=f"{commenter.name} commented on your post",
                    link="/feed",
                    read=False,
                    user_id=guest_user.id,
                    sender_id=commenter.id,
                    reference_type="post",
                    reference_id=post.id,
                    created_at=datetime.utcnow() - timedelta(hours=2),
                    notification_metadata={
                        "priority": "normal",
                        "category": "social",
                    },
                )
                self.db.add(comment_notification)
                notifications.append(comment_notification)

        # Add feature update notification
        feature_notification = Notification(
            id=uuid.uuid4(),
            type=NotificationTypeEnum.SYSTEM,
            title="New Feature Available",
            message="Check out our new integration capabilities in the settings page!",
            link="/settings",
            read=True,
            user_id=guest_user.id,
            sender_id=None,
            reference_type="system",
            reference_id=None,
            created_at=datetime.utcnow() - timedelta(days=1),
            notification_metadata={
                "priority": "normal",
                "category": "system",
            },
        )
        self.db.add(feature_notification)
        notifications.append(feature_notification)

        self.db.commit()
        for notification in notifications:
            self.db.refresh(notification)

        logger.info(f"Created {len(notifications)} notifications for guest user {guest_user.handle}")
        return notifications
