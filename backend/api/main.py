"""Main entry point for the API."""

import logging
import os
import time
import traceback
from contextlib import asynccontextmanager
from datetime import datetime

import sentry_sdk
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

from api.routes import (
    admin,
    auth,
    calendar,
    directories,
    events,
    feed,
    insights,
    live,
    media,
    notifications,
    plan,
    posts,
    processes,
    reports,
    search,
    settings,
    topics,
    users,
)
from api.security import extract_user_info_from_token
from api.utils.rate_limiter import check_rate_limit, get_rate_limit_headers

# Set up logging with appropriate level based on environment
log_level = os.environ.get("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    # Default to INFO if invalid level
    level=getattr(logging, log_level, logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize Sentry
sentry_dsn = "https://90f4f61b0d0d4bd9a27af89aaad0cffb@o4509218061615104.ingest.us.sentry.io/4509218062925824"
environment = os.environ.get("ENVIRONMENT", "development")
sentry_sdk.init(
    dsn=sentry_dsn,
    environment=environment,
    traces_sample_rate=1.0,  # Adjust based on traffic (lower for production)
    profiles_sample_rate=0.5,
    integrations=[
        FastApiIntegration(transaction_style="endpoint"),
        SqlalchemyIntegration(),
    ],
)
logger.info(f"Sentry initialized for {environment} environment")

# Custom startup and shutdown events


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting up convers.me API")
    yield
    # Shutdown
    logger.info("Shutting down convers.me API")


# Create FastAPI app
app = FastAPI(title="convers.me API", description="API for convers.me platform",
              version="0.1.0", lifespan=lifespan)

# Add startup time to app
app.startup_time = time.time()

# Setup CORS with hardcoded domains
origins = [
    "http://localhost:3000",
    "https://conversme-frontend.fly.dev",
    "https://conversme-backend.fly.dev",
    "http://convers.me",
    "https://convers.me",
    "http://www.convers.me",
    "https://www.convers.me"
]
app.add_middleware(CORSMiddleware, allow_origins=origins,
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


# Rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """
    Middleware to apply rate limiting to all API requests.
    Limits are different for authenticated vs unauthenticated users,
    and admin users have higher limits.

    Set the environment variable DISABLE_RATE_LIMIT=true to turn off rate limiting during development.
    """
    # Option to disable rate limiting completely during development
    if os.environ.get("DISABLE_RATE_LIMIT", "False").lower() == "true":
        return await call_next(request)
    # Get client IP
    # Use X-Forwarded-For if present (common with reverse proxies)
    # Otherwise fall back to client.host
    client_ip = request.headers.get("X-Forwarded-For", request.client.host)
    if client_ip and "," in client_ip:  # X-Forwarded-For can be comma-separated
        client_ip = client_ip.split(",")[0].strip()

    # Skip rate limiting for:
    # - health checks
    # - static files
    # - OPTIONS requests (preflight)
    # - essential app functionality
    path = request.url.path
    if (
        path == "/health"
        or path.startswith("/uploads/")
        or path.startswith("/static/")
        or path == "/users/me"  # Ensure current user info is always available
        or path == "/auth/token"  # Allow authentication attempts
        or path == "/auth/refresh"  # Allow token refreshes
        or path == "/admin/initialize"  # Allow initialization without auth
        or path.endswith("/health")  # All health check endpoints
        or request.method == "OPTIONS"
    ):
        return await call_next(request)

    # Check if user is authenticated and get user info
    user_id = None
    is_admin = False

    try:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            # Extract user information from the token
            # This doesn't validate the token fully (route handlers will do that)
            # but gives us enough info for rate limiting purposes
            user_id, is_admin = extract_user_info_from_token(auth_header)

            # We don't need to log successful rate limiting operations
    except Exception:
        # Continue with unauthenticated rate limits
        pass

    # Check rate limits
    is_allowed, reason, retry_after = await check_rate_limit(
        request=path,
        ip=client_ip,
        user_id=user_id,
        is_admin=is_admin
    )

    if not is_allowed:
        # Log rate limit events
        logger.warning(f"Rate limit exceeded: {reason} for IP {client_ip}, path {path}")

        # Return 429 Too Many Requests
        headers = {
            "Retry-After": str(retry_after),
            "Content-Type": "application/json"
        }
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content={"detail": reason, "retry_after": retry_after},
            headers=headers
        )

    # Process the request
    response = await call_next(request)

    # Add rate limit headers to response
    rate_limit_headers = get_rate_limit_headers(
        user_id=user_id,
        is_admin=is_admin,
        ip=client_ip
    )

    # Add headers to response
    for header_name, header_value in rate_limit_headers.items():
        response.headers[header_name] = header_value

    return response


# API response formatting middleware
@app.middleware("http")
async def response_formatting_middleware(request: Request, call_next):
    response = await call_next(request)

    # Skip non-JSON responses
    if response.headers.get("content-type") != "application/json":
        return response

    # Get the original response body
    body = b""
    async for chunk in response.body_iterator:
        body += chunk

    # Parse and format the response body
    import json
    try:
        # Get request ID for logging context
        request_id = request.headers.get("X-Request-ID", "unknown")

        # Decode the response body to JSON
        data = json.loads(body.decode("utf-8", errors="replace"))
        from api.utils.response_utils import format_response

        # Format the response data - this handles UUID conversion and camelCase transformation
        formatted_data = format_response(data)

        # Create a new response with the formatted data
        new_response = JSONResponse(
            content=formatted_data,
            status_code=response.status_code,
            headers=dict(response.headers),
        )
        # Remove the Content-Length header to let FastAPI calculate it correctly
        if "content-length" in new_response.headers:
            del new_response.headers["content-length"]
        return new_response
    except Exception as e:
        # Get request ID for logging context
        request_id = request.headers.get("X-Request-ID", "unknown")

        logger.error(f"[{request_id}] Error formatting response: {str(e)}")
        logger.error(f"[{request_id}] Response data: {body.decode('utf-8', errors='replace')}")

        # Import utilities we need for direct fixing

        # Return a new response without the Content-Length header
        try:
            # Try to return the JSON content if it's valid
            content = json.loads(body.decode("utf-8", errors="replace"))

            # Deep fix function to recursively process problematic objects
            def deep_fix(obj):
                if obj is None:
                    return None

                # Handle primitive types
                if isinstance(obj, (str, int, float, bool)):
                    return obj

                # Handle lists
                if isinstance(obj, list):
                    return [deep_fix(item) for item in obj]

                # Handle dictionaries
                if isinstance(obj, dict):
                    # Check for UUID special case
                    if "__class__" in obj and obj["__class__"] == "UUID" and "hex" in obj:
                        return str(obj.get("hex", ""))

                    # Check for MetaData special case
                    if "__class__" in obj and obj["__class__"] == "MetaData":
                        return {}

                    # Process normal dictionary
                    result = {}
                    for key, value in obj.items():
                        # Special handling for common UUID fields
                        if key in ["id", "user_id", "created_by_id", "directory_id", "sender_id",
                                   "reference_id", "event_id", "process_id", "step_id", "parent_id"]:
                            if isinstance(value, dict) and value.get("__class__") == "UUID" and "hex" in value:
                                result[key] = str(value.get("hex", ""))
                            else:
                                result[key] = deep_fix(value)
                        # Special handling for metadata fields
                        elif key == "metadata" or key.endswith("_metadata"):
                            if isinstance(value, dict) and value.get("__class__") == "MetaData":
                                result[key] = {}
                            else:
                                result[key] = deep_fix(value)
                        # Default handling
                        else:
                            result[key] = deep_fix(value)
                    return result

                # Default case
                return obj

            # Apply the deep fix
            fixed_content = deep_fix(content)
            # No need to log successful fixes
            # logger.info(f"[{request_id}] Applied deep fix to response data")

        except json.JSONDecodeError:
            # If JSON parsing fails, return a simple error message
            fixed_content = {
                "detail": "Error processing response", "requestId": request_id}

        # Create a new response with the fixed content
        new_response = JSONResponse(
            content=fixed_content,
            status_code=response.status_code,
            headers=dict(response.headers),
        )
        # Remove the Content-Length header to let FastAPI calculate it correctly
        if "content-length" in new_response.headers:
            del new_response.headers["content-length"]
        return new_response


# Request timing middleware with simplified logging
@app.middleware("http")
async def log_requests_and_timing(request, call_next):
    # Generate a unique request ID
    import uuid

    request_id = str(uuid.uuid4())[:8]  # Shorter ID for brevity

    # Process the request and measure timing
    start_time = time.time()
    try:
        # Only log requests in development mode or for non-common endpoints
        if environment == "development" or not request.url.path.startswith(("/users/", "/health", "/feed/", "/events/")):
            logger.info(f"[{request_id}] {request.method} {request.url.path}")

        # Process the request
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request_id

        # Log based on response status or timing
        status_code = response.status_code
        if status_code >= 400:
            # Log errors with more detail
            logger.warning(f"[{request_id}] Error {status_code}: {request.method} {request.url.path} - {process_time:.2f}s")
        elif process_time > 1.5:  # Only log very slow requests with higher threshold
            logger.warning(f"[{request_id}] Slow: {request.method} {request.url.path} - {process_time:.2f}s")

        return response
    except Exception as e:
        # Log exceptions
        process_time = time.time() - start_time
        logger.error(f"[{request_id}] Exception: {request.method} {request.url.path} - {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error",
                     "request_id": request_id},
            headers={
                "X-Process-Time": str(process_time), "X-Request-ID": request_id},
        )


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    # Get request ID from headers if available
    request_id = request.headers.get("X-Request-ID", "unknown")

    # Log the exception (concise but useful)
    logger.warning(f"[{request_id}] HTTP {exc.status_code}: {request.method} {request.url.path} - {exc.detail}")

    # Capture HTTP exceptions in Sentry (4xx and 5xx)
    if exc.status_code >= 500:
        # Always capture 5xx errors
        with sentry_sdk.configure_scope() as scope:
            scope.set_tag("request_id", request_id)
            scope.set_tag("endpoint", request.url.path)
            scope.set_tag("status_code", str(exc.status_code))
            sentry_sdk.capture_exception(exc)

    # Return response with just the essential details
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": exc.detail,
            "request_id": request_id,
        },
        headers=exc.headers,
    )


# Catch-all exception handler
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    # Get request ID from headers if available
    request_id = request.headers.get("X-Request-ID", "unknown")

    # Log the exception with traceback for server-side debugging
    logger.error(f"[{request_id}] Exception: {request.method} {request.url.path} - {type(exc).__name__}: {str(exc)}")
    logger.error(f"Traceback: {traceback.format_exc()}")

    # Capture exception in Sentry with additional context
    with sentry_sdk.configure_scope() as scope:
        scope.set_tag("request_id", request_id)
        scope.set_tag("endpoint", request.url.path)
        scope.set_tag("method", request.method)
        scope.set_extra("url", str(request.url))
        sentry_sdk.capture_exception(exc)

    # Return simple error response to client
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error occurred",
            "request_id": request_id,
        },
    )


# Static files for media uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(events.router)
app.include_router(processes.router)  # Original processes router
app.include_router(processes.templates_router)  # New templates router
# New live processes router
app.include_router(processes.live_processes_router)
app.include_router(directories.router)  # Directory router
app.include_router(posts.router)
app.include_router(topics.router)
app.include_router(admin.router)
# Calendar router can now be included since we fixed the route conflicts
app.include_router(calendar.router)
app.include_router(search.router)
app.include_router(feed.router)
app.include_router(media.router)
app.include_router(settings.router)
app.include_router(notifications.router)
app.include_router(insights.router)
app.include_router(reports.router)
app.include_router(live.router)  # Live router for handling real-time conversation contexts
app.include_router(plan.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Welcome to convers.me API", "version": "0.1.0", "docs": "/docs"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "environment": os.environ.get("ENVIRONMENT", "development"),
        "uptime": int(time.time() - app.startup_time),
        "routes": len(app.routes),
        "version": "0.1.0",
    }
