#!/usr/bin/env bash
# Avatar Persistence Testing Guide

echo "🧪 Avatar Persistence Testing Guide"
echo "===================================="
echo ""
echo "This guide will help you verify that profile pictures now persist across deployments."
echo ""

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    echo ""
    echo "Steps:"
    echo "1. Open Docker Desktop"
    echo "2. Wait for it to start"
    echo "3. Run this script again"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if containers are running
if ! docker ps | grep -q rythm-db-1; then
    echo "⚠️  Containers not running. Starting them now..."
    ./scripts/start.sh
    echo ""
else
    echo "✅ Containers are running"
    echo ""
fi

# Apply migration
echo "📊 Applying avatar_data migration..."
./scripts/apply-avatar-migration.sh
echo ""

# Verify migration
echo "🔍 Verifying database schema..."
COLUMNS=$(docker exec rythm-db-1 psql -U rythm_api -d rythm -t -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name LIKE 'avatar%' ORDER BY column_name;")

echo "Found columns:"
echo "$COLUMNS" | sed 's/^/ - /'
echo ""

if echo "$COLUMNS" | grep -q "avatar_data"; then
    echo "✅ avatar_data column exists"
else
    echo "❌ avatar_data column NOT found"
fi

if echo "$COLUMNS" | grep -q "avatar_content_type"; then
    echo "✅ avatar_content_type column exists"
else
    echo "❌ avatar_content_type column NOT found"
fi

echo ""
echo "📝 Manual Testing Steps:"
echo "========================"
echo ""
echo "1. Open mobile app: http://localhost:3000"
echo "2. Login with your test account"
echo "3. Navigate to Profile page"
echo "4. Upload a profile picture"
echo "5. Verify the image displays correctly"
echo "6. Restart API container:"
echo "   docker restart rythm-api-1"
echo "7. Refresh profile page"
echo "8. ✅ Image should still be visible (persisted in database)"
echo ""
echo "🔍 Debug Commands:"
echo "=================="
echo ""
echo "# Check if avatar data exists for a user"
echo "docker exec rythm-db-1 psql -U rythm_api -d rythm -c \"SELECT user_id, email, LENGTH(avatar_data) as avatar_size, avatar_content_type FROM users WHERE avatar_data IS NOT NULL;\""
echo ""
echo "# View API logs"
echo "docker logs -f rythm-api-1"
echo ""
echo "# Test avatar endpoint (replace USER_ID with actual UUID)"
echo "curl http://localhost:3001/api/auth/avatar/USER_ID -o test-avatar.jpg"
echo ""
