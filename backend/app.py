"""
Main application entry point for convers.me API.
"""

import logging
import os

from dotenv import load_dotenv

# Configure logging first
logging.basicConfig(
    level=logging.getLevelName(os.environ.get("LOG_LEVEL", "INFO")),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Load environment variables
logger.info("Loading environment variables")
load_dotenv()

# Import necessary modules
from db.setup_db import setup_database

# Initialize database setup
logger.info("Setting up database")
if not setup_database():
    logger.error("Failed to set up database")
    raise RuntimeError("Database setup failed")

# Import the FastAPI app instance - this needs to come after database setup to avoid circular imports
logger.info("Importing FastAPI app")
from api.main import app

# Make the app available for import
__all__ = ["app"]

if __name__ == "__main__":
    import uvicorn

    host = os.environ.get("API_HOST", "0.0.0.0")
    port = int(os.environ.get("API_PORT", "8000"))
    workers = int(os.environ.get("API_WORKERS", "1"))

    uvicorn.run(
        "app:app",
        host=host,
        port=port,
        workers=workers,
        reload=os.environ.get("DEBUG", "False").lower() == "true",
        log_level=os.environ.get("LOG_LEVEL", "info").lower(),
        access_log=True,  # Enable access logs for API requests
    )
