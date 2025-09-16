#!/bin/bash

# populate-hybrid-exercises.sh
# Script to populate the database with hybrid training exercises

set -e

echo "🏃‍♂️ Loading RYTHM consolidated exercise templates..."

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

# Load the consolidated exercise templates
echo "🔄 Loading consolidated exercise templates..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f exercise_templates_master.sql

if [ $? -eq 0 ]; then
    echo "✅ Exercise templates loaded successfully!"
else
    echo "❌ Exercise template loading failed!"
    exit 1
fi

# Verify the data
echo "📊 Verifying exercise data..."
EXERCISE_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM exercise_templates;")
STRENGTH_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM exercise_templates WHERE exercise_type = 'STRENGTH';")
CARDIO_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM exercise_templates WHERE exercise_type = 'CARDIO';")

echo "📈 Database Statistics:"
echo "   Total exercises: $(echo $EXERCISE_COUNT | xargs)"
echo "   Strength exercises: $(echo $STRENGTH_COUNT | xargs)"
echo "   Cardio exercises: $(echo $CARDIO_COUNT | xargs)"

# Show sample exercises by type
echo ""
echo "💪 Sample STRENGTH exercises:"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT name, muscle_groups[1] as primary_muscle, equipment, default_value_1_type, default_value_2_type 
FROM exercise_templates 
WHERE exercise_type = 'STRENGTH' 
ORDER BY name 
LIMIT 10;"

echo ""
echo "🏃 Sample CARDIO exercises:"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "
SELECT name, muscle_groups[1] as primary_muscle, equipment, default_value_1_type, default_value_2_type 
FROM exercise_templates 
WHERE exercise_type = 'CARDIO' 
ORDER BY name 
LIMIT 10;"

echo ""
echo "🎉 Consolidated exercise template database loaded successfully!"
echo "🔥 Your RYTHM app now has $(echo $EXERCISE_COUNT | xargs) exercises optimized for hybrid training!"
echo ""
echo "💡 Next steps:"
echo "   1. Restart your API server to pick up the changes"
echo "   2. Test the exercise selection in your workout creation interface"
echo "   3. Start building hybrid training workouts!"