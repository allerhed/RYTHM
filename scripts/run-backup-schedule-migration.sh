#!/usr/bin/env bash
set -euo pipefail

echo "🔄 Running backup schedule migration..."

# Get database connection details from Azure
DB_HOST="psql-tvqklipuckq3a.postgres.database.azure.com"
DB_NAME="rythm"
DB_USER="rythm_admin"

# Prompt for password
echo "Please enter the database password for user $DB_USER:"
read -s DB_PASSWORD

export PGPASSWORD="$DB_PASSWORD"

# Run migration
echo "Executing migration 006_backup_schedule.sql..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f "$(dirname "$0")/../packages/db/migrations/006_backup_schedule.sql"

echo "✅ Migration completed successfully!"
echo ""
echo "You can now:"
echo "1. Go to https://admin.rythm.training/backups"
echo "2. Toggle the automated backups switch"
echo "3. View the schedule configuration (2:00 AM UTC daily, 30-day retention)"
