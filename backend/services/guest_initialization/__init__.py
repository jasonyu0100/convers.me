"""
Data initialization package for creating sample data.

This package contains modules for initializing different types of data in the application.
Each module is responsible for a specific type of data (users, topics, processes, etc.)
"""

from .service import GuestInitializationService

__all__ = ["GuestInitializationService"]
