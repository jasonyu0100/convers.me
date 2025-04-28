"""
Background tasks for event-related operations.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List

from db.database import get_db_session
from db.models import Event, EventParticipant, NotificationTypeEnum, User
from tasks.notification_tasks import send_notification
from worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="tasks.event_tasks.send_event_reminders")
def send_event_reminders(hours_before: int = 24) -> int:
    """
    Send reminders for upcoming events.

    Args:
        hours_before: Hours before the event to send reminders

    Returns:
        int: Number of reminders sent
    """
    logger.info("Sending event reminders for events starting in %d hours", hours_before)

    with get_db_session() as db:
        # Calculate the target time range
        target_date = datetime.utcnow() + timedelta(hours=hours_before)
        date_str = target_date.date().isoformat()

        # Find events occurring around the target time
        # This is a simplified query assuming date is stored as ISO string
        events = db.query(Event).filter(Event.date == date_str).all()

        logger.info("Found %d events scheduled for %s", len(events), date_str)

        reminder_count = 0
        for event in events:
            # Skip events without participants
            if not event.participants:
                continue

            # Send reminder to each confirmed participant
            for participant in event.participants:
                if participant.status in ["confirmed", "invited"]:
                    try:
                        send_notification.delay(
                            user_id=str(participant.user_id),
                            notification_type=NotificationTypeEnum.EVENT_REMINDER.value,
                            title=f"Reminder: {event.title}",
                            message=f"Your event '{event.title}' is scheduled to start in about {hours_before} hours.",
                            link=f"/events/{event.id}",
                            reference_id=str(event.id),
                            reference_type="event",
                            metadata={"hours_before": hours_before},
                        )
                        reminder_count += 1
                    except Exception as e:
                        logger.error(
                            "Failed to send reminder for event %s to user %s: %s", event.id, participant.user_id, str(e)
                        )

        logger.info("Sent %d event reminders", reminder_count)
        return reminder_count


@celery_app.task(name="tasks.event_tasks.notify_event_updates")
def notify_event_updates(event_id: str, updated_by_id: str, changes: Dict[str, Dict]) -> int:
    """
    Notify participants when an event is updated.

    Args:
        event_id: ID of the updated event
        updated_by_id: ID of the user who made the update
        changes: Dictionary of changes {field: {old: value, new: value}}

    Returns:
        int: Number of notifications sent
    """
    logger.info("Notifying participants of updates to event %s", event_id)

    with get_db_session() as db:
        # Get the event
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            logger.error("Event not found: %s", event_id)
            return 0

        # Skip notifications for the user who made the changes
        participant_ids = [str(p.user_id) for p in event.participants if str(p.user_id) != updated_by_id]

        # Construct a readable message about the changes
        change_descriptions = []
        for field, values in changes.items():
            if field == "date" or field == "time":
                change_descriptions.append("schedule")
            elif field == "title":
                change_descriptions.append("title")
            elif field == "description":
                change_descriptions.append("description")
            elif field == "location":
                change_descriptions.append("location")

        # Remove duplicates and format message
        unique_changes = list(set(change_descriptions))
        change_message = ", ".join(unique_changes)

        # Determine the message based on number of changes
        if len(unique_changes) > 2:
            message = f"Multiple details were updated for '{event.title}'."
        elif len(unique_changes) > 0:
            message = f"The {change_message} was updated for '{event.title}'."
        else:
            message = f"'{event.title}' was updated."

        # Send notifications
        notification_count = 0
        for user_id in participant_ids:
            try:
                send_notification.delay(
                    user_id=user_id,
                    notification_type=NotificationTypeEnum.EVENT_UPDATE.value,
                    title=f"Event Updated: {event.title}",
                    message=message,
                    link=f"/events/{event.id}",
                    sender_id=updated_by_id,
                    reference_id=str(event.id),
                    reference_type="event",
                    metadata={"changes": changes},
                )
                notification_count += 1
            except Exception as e:
                logger.error(
                    "Failed to send update notification for event %s to user %s: %s", event.id, user_id, str(e)
                )

        logger.info("Sent %d event update notifications", notification_count)
        return notification_count


@celery_app.task(name="tasks.event_tasks.process_event_invitations")
def process_event_invitations(event_id: str, user_ids: List[str], invited_by_id: str) -> int:
    """
    Process event invitations for multiple users.

    Args:
        event_id: ID of the event
        user_ids: List of user IDs to invite
        invited_by_id: ID of the user sending invitations

    Returns:
        int: Number of invitations processed
    """
    logger.info("Processing invitations for event %s: %d users", event_id, len(user_ids))

    with get_db_session() as db:
        # Get the event
        event = db.query(Event).filter(Event.id == event_id).first()
        if not event:
            logger.error("Event not found: %s", event_id)
            return 0

        # Get the inviter
        inviter = db.query(User).filter(User.id == invited_by_id).first()
        inviter_name = inviter.name if inviter else "Someone"

        # Process each invitation
        invitation_count = 0
        for user_id in user_ids:
            # Check if the user is already a participant
            existing = (
                db.query(EventParticipant)
                .filter(EventParticipant.event_id == event_id, EventParticipant.user_id == user_id)
                .first()
            )

            if existing:
                logger.info("User %s is already a participant of event %s", user_id, event_id)
                continue

            # Create the participant record
            participant = EventParticipant(
                event_id=event_id, user_id=user_id, role="participant", status="invited", joined_at=datetime.utcnow()
            )
            db.add(participant)

            # Send notification
            try:
                send_notification.delay(
                    user_id=user_id,
                    notification_type=NotificationTypeEnum.EVENT_INVITE.value,
                    title=f"New Event Invitation: {event.title}",
                    message=f"{inviter_name} invited you to '{event.title}'.",
                    link=f"/events/{event.id}",
                    sender_id=invited_by_id,
                    reference_id=str(event.id),
                    reference_type="event",
                )
                invitation_count += 1
            except Exception as e:
                logger.error("Failed to send invitation for event %s to user %s: %s", event.id, user_id, str(e))

        db.commit()
        logger.info("Processed %d event invitations", invitation_count)
        return invitation_count
