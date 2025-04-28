#!/bin/bash
set -e

# Script to reset Alembic version control on the database
# WARNING: This will force the database to accept a new migration history
# Only run this if you understand the implications

echo "===== WARNING ====="
echo "This script will reset the Alembic version control table."
echo "This should ONLY be used when:"
echo "1. The migration history is broken"
echo "2. You're certain the current schema matches your migration files"
echo "===== WARNING ====="
echo

# Default to using environment variable if available
DB_URL=${DATABASE_URL:-$1}

if [ -z "$DB_URL" ]; then
    echo "Error: No database URL provided."
    echo "Usage: $0 <database_url>"
    echo "or set DATABASE_URL environment variable"
    exit 1
fi

# Connect to PostgreSQL and drop/reset the alembic_version table
echo "Connecting to database..."
psql "$DB_URL" << EOF
-- First, drop the existing alembic_version table
DROP TABLE IF EXISTS alembic_version;

-- Create a new alembic_version table with the correct structure
CREATE TABLE alembic_version (
    version_num VARCHAR(32) NOT NULL,
    CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num)
);

-- Insert the current head migration version
-- Update this with your actual migration head
INSERT INTO alembic_version (version_num) VALUES ('fe368046e22c');
EOF

echo "Alembic version table has been reset to 'fe368046e22c'"
echo "The database is now set to the latest migration version."
echo "Next steps:"
echo "1. Restart your application"
echo "2. Verify that the application starts correctly"
echo "3. If needed, run alembic upgrade head to apply any missing schema changes"
