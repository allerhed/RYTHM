#!/bin/bash

# Local migration script without authentication

echo "Starting local database migrations..."

export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
export PGHOST="localhost"
export PGPORT="5432"
export PGUSER="$(whoami)"
export PGDATABASE="rythm"

echo "Connecting to PostgreSQL server: localhost"

# Test connection
if ! psql -c "SELECT 1;" > /dev/null 2>&1; then
    echo "Error: Could not connect to database"
    exit 1
fi

echo "Connected successfully!"

# Run migrations in order
for migration_file in packages/db/migrations/*.sql; do
    if [ -f "$migration_file" ]; then
        echo "Running migration: $(basename "$migration_file")"
        if psql -f "$migration_file"; then
            echo "✓ Migration $(basename "$migration_file") completed successfully"
        else
            echo "✗ Migration $(basename "$migration_file") failed"
            exit 1
        fi
    fi
done

echo "All migrations completed successfully!"