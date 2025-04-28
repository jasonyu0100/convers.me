"""
Database setup script for creating types and tables conditionally
"""

import logging
import os

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get database URL from environment variable
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:15432/conversme")


def create_enum_type_if_not_exists(conn, enum_name, enum_values):
    """Create an enum type if it doesn't exist already"""
    try:
        # Check if the enum type exists
        result = conn.execute(text(f"SELECT 1 FROM pg_type WHERE typname = '{enum_name}'")).fetchone()

        if not result:
            logger.info(f"Creating enum type {enum_name}")
            conn.execute(text(f"CREATE TYPE {enum_name} AS ENUM {enum_values}"))
            return True
        else:
            logger.info(f"Enum type {enum_name} already exists")
            return False
    except Exception as e:
        logger.error(f"Error creating enum type {enum_name}: {e}")
        return False


def setup_database():
    """Setup database types and tables if they don't exist"""
    engine = create_engine(DATABASE_URL)
    logger.info(f"Connecting to database at: {DATABASE_URL.split('@')[1]}")

    with engine.connect() as conn:
        # Handle transactions manually
        conn.execute(text("BEGIN"))
        try:
            # Create enum types
            enums = [
                ("media_type", "('video', 'image', 'audio', 'quote', 'event')"),
                (
                    "event_status",
                    "('Pending', 'Planning', 'Execution', 'Review', 'Administrative', 'Done', 'ongoing', 'upcoming', 'completed', 'ready')",
                ),
                (
                    "participant_status",
                    "('invited', 'confirmed', 'declined', 'attended')",
                ),
            ]

            for enum_name, enum_values in enums:
                create_enum_type_if_not_exists(conn, enum_name, enum_values)

            # Check if tables exist
            inspector = inspect(engine)
            if not inspector.get_table_names():
                logger.info("No tables found, running migrations")
                conn.execute(text("COMMIT"))

                # Run migrations using alembic
                alembic_cfg = Config("alembic.ini")
                command.upgrade(alembic_cfg, "head")
                logger.info("Database migrations completed successfully")
                return True
            else:
                logger.info("Tables already exist, skipping migrations")
                conn.execute(text("COMMIT"))
                return True

        except Exception as e:
            conn.execute(text("ROLLBACK"))
            logger.error(f"Error setting up database: {e}")
            return False


if __name__ == "__main__":
    setup_database()
