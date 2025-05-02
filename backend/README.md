# Convers.me Backend

Backend API for the Convers.me platform built with FastAPI, PostgreSQL, SQLAlchemy, and Celery. This API provides the core functionality for process management, AI-assisted operations, event scheduling, and team collaboration.

## Quick Start

We've added convenient scripts for quickly setting up your development environment:

```bash
# Clone the repository if you haven't already
git clone https://github.com/jasonyu0100/convers.me.git
cd convers.me/backend

# Full development setup (installs dependencies, sets up database, and initializes data)
./scripts/dev.sh

# Or run the API server directly if already set up
uvicorn app:app --reload --log-level=info
```

## Manual Setup

If you prefer to set up manually, follow these steps:

1. Install dependencies:

```bash
# Install uv if not already installed
pip install uv

# Setup virtual environment and install dependencies
./scripts/setup.sh

# Or manually:
uv venv
source venv/bin/activate
uv pip install -r requirements.txt -r requirements-dev.txt
```

2. Set up environment variables:

Copy the `.env.example` file to create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Then update the values in the `.env` file as needed:

```
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4
DEBUG=True
DATABASE_URL=postgresql://postgres:postgres@localhost:15432/conversme
DB_POOL_SIZE=5
DB_MAX_OVERFLOW=10
DB_POOL_TIMEOUT=30
FRONTEND_URL=http://localhost:3000
REDIRECT_URL=http://localhost:3000/auth/callback
OPENAI_API_KEY=your_openai_api_key
SECRET_KEY=your_secret_key - generate your own with: openssl rand -hex 32
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

3. Database Setup:

If using Docker (recommended):

```bash
# Start PostgreSQL container if not already running
docker run --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -p 15432:5432 -d postgres:16

# Create the database
docker exec -it postgres psql -U postgres -c "CREATE DATABASE conversme;"
```

If using local PostgreSQL:

```bash
# Create the database
createdb conversme
```

Default database credentials:

- Username: postgres
- Password: postgres
- Database: conversme
- Host: localhost
- Port: 15432 (Docker) or 5432 (local)

Database URL formats:

SQLAlchemy connection string (used in .env file):

```
postgresql://postgres:postgres@localhost:15432/conversme
```

Format: `postgresql://{username}:{password}@{host}:{port}/{database}`

JDBC connection string (for Java applications):

```
jdbc:postgresql://localhost:15432/conversme?user=postgres&password=postgres
```

Format: `jdbc:postgresql://{host}:{port}/{database}?user={username}&password={password}`

4. Initialize the database:

There are two ways to initialize the database:

Option 1: Use the built-in initialization endpoint:

```bash
# Start the server first with logging
cd backend
uvicorn app:app --reload --log-level=info

# Then initialize the database by making a POST request to:
curl -X POST http://localhost:8000/admin/initialize
curl -X POST http://localhost:8000/admin/initialize-library
```

This will:

- Run migrations if tables don't exist
- Create a default admin user (admin@convers.me / admin1234)
- Add default topics and seed data

Option 2: Manual setup:

```bash
# Navigate to the backend directory
cd backend

# Run migrations manually
alembic upgrade head

# Create an admin user through the API
# POST to http://localhost:8000/users with:
# {
#   "name": "Admin User",
#   "email": "admin@example.com",
#   "handle": "admin",
#   "password": "securepassword"
# }
```

The initialization endpoint is the recommended method for development environments.

5. Start the complete backend stack with a single command:

```bash
# Navigate to the backend directory
cd backend

# Start everything: FastAPI server, Redis, Celery worker, and scheduler
./start_backend.sh

# To start with Flower monitoring UI
./start_backend.sh --flower

# To use an existing Redis instance instead of starting a container
./start_backend.sh --no-redis

# Show usage help
./start_backend.sh --help
```

This script starts all necessary services:

- FastAPI server
- Redis (in a Docker container, if needed)
- Celery worker
- Celery beat scheduler
- Flower monitoring UI (optional)

All logs are saved to the `logs/` directory for easy troubleshooting.

Alternatively, you can start individual components:

```bash
# Start just the FastAPI server with logging
uvicorn app:app --reload --log-level=info

# Start just the Celery worker and scheduler
./start_worker.sh

# Start with monitoring UI
./start_worker.sh --flower  # Access at http://localhost:5555
```

## Docker Setup and Operations

The backend is fully containerized for easy deployment and consistent development environments. We use Docker and Docker Compose to manage the containerized services.

### Docker Compose Setup

The `docker-compose.yml` file defines all the services needed for a complete backend stack:

```bash
# Start all services defined in docker-compose.yml
docker-compose up

# Start in detached mode (background)
docker-compose up -d

# Start only specific services
docker-compose up api redis

# Rebuild containers after code changes
docker-compose up --build
```

### Key Docker Services

- **api**: The main FastAPI application
- **postgres**: PostgreSQL database
- **redis**: Redis for caching and Celery message broker
- **worker**: Celery worker for background tasks
- **beat**: Celery beat for scheduled tasks
- **flower**: Celery monitoring UI

### Useful Docker Commands

```bash
# View logs for a specific service
docker-compose logs api

# Follow logs (stream in real-time)
docker-compose logs -f worker

# SSH into a running container for debugging
docker-compose exec api bash

# Check service status
docker-compose ps

# Stop all services
docker-compose down

# Stop and remove volumes (caution: this will delete all data)
docker-compose down -v

# Reset a specific service
docker-compose restart worker
```

### Using the Docker Development Environment

For a consistent development environment, you can use:

```bash
# Start the development environment
docker-compose -f docker-compose.dev.yml up

# Run tests within the container
docker-compose exec api pytest

# Apply migrations within the container
docker-compose exec api alembic upgrade head
```

### Dockerfile Explained

The `Dockerfile` in the backend directory defines the container build process:

1. Starts from a Python 3.10 base image
2. Sets up the working directory
3. Installs production dependencies
4. Copies application code
5. Configures the entrypoint

The `tigris.Dockerfile` provides an alternative configuration for Tigris Vector DB integration when needed.

## Deployment to Fly.io

We've included deployment scripts for Fly.io:

```bash
# Deploy the backend to Fly.io
./scripts/deploy_fly.sh
```

This script will:

1. Check for the Fly CLI and install it if needed
2. Set up a new Fly application if needed
3. Create a PostgreSQL database on Fly
4. Configure environment variables securely
5. Create and deploy a Docker container with your app

## Authentication

The API uses JWT tokens for authentication. To authenticate:

1. Create a user with the `/users` POST endpoint
2. Obtain a token with the `/token` POST endpoint using your email and password
3. Include the token in the Authorization header for protected endpoints:
   `Authorization: Bearer your_token_here`

### JWT Implementation

The authentication system uses the following components:

- `security.py`: JWT token handling, password hashing
- `auth_utils.py`: Authentication helper functions
- `router/auth.py`: Auth-related endpoints

## API Documentation

API documentation is available at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

The API is documented using FastAPI's automatic OpenAPI schema generation, with additional docstrings for detailed endpoint descriptions.

## Database Schema

The database schema is managed using SQLAlchemy and Alembic. The main models are:

### Core Models

- **User**: Application users with profile information and authentication details
- **UserPreferences**: User settings including theme, notifications, timezone, and language preferences
- **Directory**: Organizational structure for grouping processes (like folders)
- **Topic**: Tags/categories that can be associated with events

### Process Management

- **Process**: Templates or instances that can generate events, with step-by-step instructions
- **Step**: Individual tasks or instructions within a process or event
- **SubStep**: Smaller tasks or details within a step
- **StatusLog**: Tracks status changes of events over time

### Events & Communication

- **Event**: Time-boxed activities that may be associated with processes
- **EventParticipant**: Tracks participation and roles in events
- **Post**: Social content or updates shared between users
- **Media**: Attachments for posts or events (images, videos, audio, etc.)
- **Notification**: System messages and alerts for users

### AI & Insights

- **LiveContext**: Stores conversation context for AI-powered live sessions
- **Report**: Generated analytics and insights available for download

### Recent Additions

- **LiveContext**: Added in the latest migration to support AI conversations that maintain context about processes, events, and templates.

### Additional Features

Background processing is handled by Celery with Redis as the message broker:

- **notification_tasks**: Send notifications and process notification status changes
- **media_processing_tasks**: Process uploaded media (thumbnails, transcoding, metadata)
- **event_tasks**: Handle event reminders, invitations, and update notifications

## Entity Relationships

- **Users** can create **Processes** and **Events**
- **Processes** contain **Steps**, which can contain **SubSteps**
- **Events** can be created from **Processes** and inherit their steps
- **Events** track status changes through **StatusLogs**
- **Events** have **Participants** (users with specific roles)
- **Posts** can be associated with **Events** and contain **Media**
- **LiveContext** stores conversation history for AI interactions related to **Processes** or **Events**

## Database Migrations

Create a new migration:

```bash
alembic revision --autogenerate -m "Description of changes"
```

Apply migrations:

```bash
alembic upgrade head
```

Revert to a specific migration:

```bash
alembic downgrade <revision>
```

### Migration Best Practices

1. Make incremental changes to ensure smooth upgrades
2. Test migrations on development before production
3. Include data migrations when schema changes affect existing data
4. Document complex migrations in the migration script comments

## Connecting to the Database with DBeaver

### Local Database Connection

For local development, use these settings in DBeaver:

- **Connection Type**: PostgreSQL
- **Host**: localhost
- **Port**: 15432 (Docker) or 5432 (local)
- **Database**: conversme
- **Username**: postgres
- **Password**: postgres
- **URL**: jdbc:postgresql://localhost:15432/conversme

### Fly.io Production Database Connection

To connect to the Fly.io hosted PostgreSQL database:

1. **Direct CLI Connection**:
   The simplest way to connect directly to the database:

   ```bash
   # Replace conversme-db with your actual PostgreSQL app name
   fly pg connect -a conversme-db
   ```

2. **Using Fly.io Proxy** (For GUI Tools):
   This method is reliable for connecting from your local machine with tools like DBeaver:

   ```bash
   # Replace conversme-db with your actual PostgreSQL app name
   fly proxy 15432:5432 -a conversme-db
   ```

   Then connect in DBeaver using:

   - **Connection Type**: PostgreSQL
   - **Host**: localhost
   - **Port**: 15432
   - **Database**: postgres
   - **Username**: postgres
   - **Password**: Your Fly.io PostgreSQL password
   - **No SSL required** for proxy connections

   **JDBC URL**: `jdbc:postgresql://localhost:15432/postgres`

3. **Direct Connection via Private Network**:
   For connecting from another Fly.io app:

   - **Host**: conversme-db.internal
   - **Port**: 5432
   - **Database**: postgres
   - **Username**: postgres
   - **Password**: Your Fly.io PostgreSQL password

   **JDBC URL**: `jdbc:postgresql://conversme-db.internal:5432/postgres`

4. **Using Flycast**:
   Only works from within Fly.io network or with WireGuard VPN:

   - **Host**: conversme-db.flycast
   - **Port**: 5432
   - **Database**: postgres
   - **Username**: postgres
   - **Password**: Your Fly.io PostgreSQL password

   **JDBC URL**: `jdbc:postgresql://conversme-db.flycast:5432/postgres`

5. **Troubleshooting Connection Issues**:
   - **Check credentials**:
     ```bash
     fly secrets list -a conversme-db
     ```
   - **Connect directly to the database via CLI**:
     ```bash
     fly pg connect -a conversme-db
     ```
   - **Set up WireGuard VPN** for direct access:
     ```bash
     fly wireguard create personal
     # Follow instructions to install WireGuard client
     fly wireguard list
     ```
   - **Test connection parameters**:
     ```bash
     # First set up proxy
     fly proxy 15432:5432 -a conversme-db
     # Then test connection
     psql -h localhost -p 15432 -U postgres
     ```

## API Development

To add new endpoints:

1. Define Pydantic models for request/response in `schemas/`
2. Add the endpoint to the appropriate router in `routes/`
3. Implement database queries using SQLAlchemy
4. Document with docstrings for OpenAPI spec generation

### Route Structure

Routes are organized by feature area:

- `routes/auth.py`: Authentication endpoints
- `routes/users.py`: User management
- `routes/processes.py`: Process management
- `routes/events.py`: Event scheduling
- `routes/live.py`: Live AI sessions

### Background Tasks

For operations that may take time or should be processed asynchronously:

1. Add a new task to the appropriate module in `/tasks`
2. Use the Celery decorator to register the task: `@celery_app.task(name="tasks.module.task_name")`
3. Call the task asynchronously from your route using `.delay()`
4. For scheduled tasks, add a new entry to the `beat_schedule` in `worker.py`

## Performance Considerations

- Use database indexes for frequently queried fields
- Implement pagination for endpoints that return large collections
- Use appropriate caching strategies for repeated queries
- Consider using async queries for IO-bound operations
- Profile and optimize slow endpoints
