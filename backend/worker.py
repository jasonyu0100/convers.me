"""
Celery worker setup for background tasks.
"""

import logging
import os
from functools import lru_cache

from celery import Celery
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Set up logging
logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger(__name__)

# Celery configuration
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")


@lru_cache(maxsize=1)
def get_celery_app():
    """
    Create and configure Celery application.
    Uses LRU cache to ensure only one instance is created.
    """
    celery_app = Celery(
        "convers.me",
        broker=CELERY_BROKER_URL,
        backend=CELERY_RESULT_BACKEND,
        include=[
            "tasks.notification_tasks",
            "tasks.media_processing_tasks",
            "tasks.event_tasks",
        ],
    )

    # Configure Celery
    celery_app.conf.update(
        task_serializer="json",
        accept_content=["json"],
        result_serializer="json",
        timezone="UTC",
        enable_utc=True,
        worker_prefetch_multiplier=1,
        task_track_started=os.getenv("CELERY_TASK_TRACK_STARTED", "True") == "True",
        task_time_limit=int(os.getenv("CELERY_TASK_TIME_LIMIT", str(30 * 60))),
    )

    # Configure task routes
    celery_app.conf.task_routes = {
        "tasks.notification_tasks.*": {"queue": "notifications"},
        "tasks.media_processing_tasks.*": {"queue": "media"},
        "tasks.event_tasks.*": {"queue": "events"},
    }

    # Configure periodic tasks
    celery_app.conf.beat_schedule = {
        "send-daily-event-reminders": {
            "task": "tasks.event_tasks.send_event_reminders",
            "schedule": 3600.0,  # Run every hour
            "args": (24,),  # Send reminders for events 24 hours away
        },
        "send-immediate-event-reminders": {
            "task": "tasks.event_tasks.send_event_reminders",
            "schedule": 3600.0,  # Run every hour
            "args": (1,),  # Send reminders for events 1 hour away
        },
    }

    return celery_app


# Create Celery app instance
celery_app = get_celery_app()


if __name__ == "__main__":
    logger.info("Starting Celery worker with broker: %s", CELERY_BROKER_URL)
    celery_app.start()
