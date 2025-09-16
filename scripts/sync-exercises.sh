#!/bin/bash

# sync-exercises.sh
# Script to sync exercises table from exercise_templates

set -e

echo "🔄 Synchronizing exercises table from exercise_templates..."

# Database connection parameters
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="rythm"
DB_USER="rythm_api"
DB_PASSWORD="password"

# Check if PostgreSQL is running
echo "📡 Checking PostgreSQL connection..."
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running or not accessible"
    echo "💡 Please start PostgreSQL first:"
    echo "   docker-compose up -d db"
    exit 1
fi

echo "✅ PostgreSQL is running"

# Sync exercises from templates
echo "🔄 Syncing exercises table from exercise_templates..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME << 'EOF'
-- Populate exercises table from exercise_templates
DELETE FROM exercises;

INSERT INTO exercises (
    name, 
    muscle_groups, 
    equipment, 
    exercise_category, 
    exercise_type, 
    default_value_1_type, 
    default_value_2_type,
    notes
)
SELECT 
    name, 
    muscle_groups, 
    equipment, 
    exercise_category, 
    exercise_type, 
    default_value_1_type, 
    default_value_2_type,
    COALESCE(description, instructions, 'Exercise from template') as notes
FROM exercise_templates
ORDER BY exercise_type, name;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Exercises table synchronized successfully!"
else
    echo "❌ Synchronization failed!"
    exit 1
fi

# Verify the sync
echo "📊 Verifying synchronization..."
TEMPLATES_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM exercise_templates;")
EXERCISES_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM exercises;")

echo "📈 Synchronization Results:"
echo "   Exercise Templates: $(echo $TEMPLATES_COUNT | xargs)"
echo "   Exercises: $(echo $EXERCISES_COUNT | xargs)"

if [ "$(echo $TEMPLATES_COUNT | xargs)" = "$(echo $EXERCISES_COUNT | xargs)" ]; then
    echo "✅ Perfect sync! Both tables have the same count."
else
    echo "⚠️  Warning: Counts don't match. Please check for issues."
fi

# Show breakdown by type
echo ""
echo "📊 Exercise breakdown by type:"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT 
    exercise_type,
    COUNT(*) as count
FROM exercises 
GROUP BY exercise_type
ORDER BY exercise_type;
"

echo ""
echo "🎉 Exercise synchronization complete!"
echo "💡 All exercises are now available in both templates and exercises tables."