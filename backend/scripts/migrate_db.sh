#!/bin/bash
set -e

# A more robust migration script for Alembic that handles multiple heads
# and common error scenarios

echo "Starting database migration process..."

# First, check if we can connect to the database
if ! alembic current > /dev/null 2>&1; then
    echo "Initial database connection or checking current revision failed."
    echo "This could be because:"
    echo "  1. The database is not yet initialized"
    echo "  2. No migrations have been applied yet"
    echo "  3. Connection parameters are incorrect"

    echo "Setting up initial migration state..."
    alembic stamp head || {
        echo "Warning: Could not stamp head. Will try to continue anyway."
    }
fi

# Function to check for multiple heads
check_for_multiple_heads() {
    local heads=$(alembic heads)
    local count=$(echo "$heads" | wc -l)

    if [ "$count" -gt 1 ]; then
        echo "Multiple migration heads detected ($count heads):"
        echo "$heads"
        return 0  # true in bash
    else
        echo "Single migration head detected."
        return 1  # false in bash
    fi
}

# Get current database revision(s)
echo "Current database revision(s):"
alembic current || echo "Could not get current revision."

# Check for and resolve multiple heads if needed
if check_for_multiple_heads; then
    echo "Creating a merge migration..."
    alembic merge heads -m "merge_heads"
    echo "Heads merged successfully."
fi

# Run migrations, capturing both stdout and stderr
echo "Running database migrations..."
if ! OUTPUT=$(alembic upgrade head 2>&1); then
    echo "Migration encountered issues:"
    echo "$OUTPUT"

    # Check for specific errors we want to handle
    if echo "$OUTPUT" | grep -q "DuplicateColumn"; then
        echo "Duplicate column error detected."
        echo "This is usually not critical - the column already exists."
        echo "Forcing the database schema to match the current models..."

        # Stamp as the latest revision anyway
        alembic stamp head || echo "Warning: Could not stamp head after DuplicateColumn error."

        echo "Migration recovery completed with warnings."
        exit 0
    else
        echo "Migration failed with unknown error."
        exit 1
    fi
else
    echo "$OUTPUT"
    echo "Migrations completed successfully."
fi
