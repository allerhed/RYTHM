#!/usr/bin/env bash
set -euo pipefail

# Apply avatar_data migration to add database storage for profile pictures
# This ensures profile pictures persist across container redeployments

echo "▶ Applying avatar_data migration..."

docker exec rythm-db-1 psql -U rythm_api -d rythm -f /docker-entrypoint-initdb.d/017_add_avatar_data_column.sql

echo "✅ Migration completed successfully"
echo ""
echo "Profile pictures will now be stored in the database and persist across deployments."
echo "Users will need to re-upload their profile pictures for them to be stored in the new format."
