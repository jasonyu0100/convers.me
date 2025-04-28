"""
Database connection module.
"""

import logging
import os
import time
from typing import Generator

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Set up logging
logging.basicConfig(
    level=logging.INFO,  # Use INFO level for less verbose logging
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Get database URL from environment variable
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:postgres@localhost:15432/conversme")
# Ensure URL uses 'postgresql://' not 'postgres://' (which causes dialect loading issues)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Configure connection pool
pool_size = int(os.environ.get("DB_POOL_SIZE", "5"))
max_overflow = int(os.environ.get("DB_MAX_OVERFLOW", "10"))
pool_timeout = int(os.environ.get("DB_POOL_TIMEOUT", "30"))

# Log database connection
logger.info(f"Connecting to database at: {DATABASE_URL.split('@')[1]}")

# Create SQLAlchemy engine with connection pool settings
engine = create_engine(
    DATABASE_URL,
    pool_size=pool_size,
    max_overflow=max_overflow,
    pool_timeout=pool_timeout,
    pool_pre_ping=True,  # Verify connections before usage
    connect_args={"options": "-c timezone=utc"},  # Set UTC timezone for connections
)


# Simple query timing and logging of slow queries only
@event.listens_for(Engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    # Store the start time for this query
    conn.info.setdefault("query_start_time", []).append(time.time())


@event.listens_for(Engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    # Get the query duration
    total = time.time() - conn.info["query_start_time"].pop()

    # Only log slow queries to reduce noise
    if total > 0.5:  # Slow query (> 500ms)
        # Truncate very long queries for readability
        log_stmt = statement
        if len(log_stmt) > 300:
            log_stmt = log_stmt[:300] + "... [truncated]"
        logger.warning(f"SLOW QUERY ({total:.2f}s): {log_stmt}")


# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


def get_db() -> Generator:
    """
    Get database session dependency.

    This function creates a new database session for each request,
    and closes it when the request is done.

    Yields:
        Session: A SQLAlchemy session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class DBSessionContextManager:
    """Context manager for database sessions in background tasks."""

    def __enter__(self):
        self.db = SessionLocal()
        return self.db

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.db.close()


def get_db_session() -> DBSessionContextManager:
    """
    Get a database session context manager for background tasks.

    This function returns a context manager that can be used in
    background tasks to safely manage database sessions.

    Returns:
        DBSessionContextManager: A context manager for database sessions
    """
    return DBSessionContextManager()
