-- Migration: Change duration from seconds to minutes
-- File: 005_duration_seconds_to_minutes.sql
-- This migration changes all duration measurements from seconds to minutes

BEGIN;

-- Step 1: Add the new enum value 'duration_m' to set_value_type
ALTER TYPE set_value_type ADD VALUE 'duration_m';

-- Step 2: Update all exercise templates that use duration_s to duration_m and convert values
-- First, let's update exercise_templates table
UPDATE exercise_templates 
SET default_value_1_type = 'duration_m' 
WHERE default_value_1_type = 'duration_s';

UPDATE exercise_templates 
SET default_value_2_type = 'duration_m' 
WHERE default_value_2_type = 'duration_s';

-- Step 3: Update all exercises that use duration_s to duration_m
UPDATE exercises 
SET default_value_1_type = 'duration_m' 
WHERE default_value_1_type = 'duration_s';

UPDATE exercises 
SET default_value_2_type = 'duration_m' 
WHERE default_value_2_type = 'duration_s';

-- Step 4: Update all existing sets data - convert seconds to minutes
-- Update value_1_type and convert value_1_numeric from seconds to minutes
UPDATE sets 
SET 
  value_1_type = 'duration_m',
  value_1_numeric = ROUND(value_1_numeric / 60.0, 2)
WHERE value_1_type = 'duration_s';

-- Update value_2_type and convert value_2_numeric from seconds to minutes  
UPDATE sets 
SET 
  value_2_type = 'duration_m',
  value_2_numeric = ROUND(value_2_numeric / 60.0, 2)
WHERE value_2_type = 'duration_s';

-- Step 5: Update workout_templates if they contain duration_s references
-- This updates the JSONB exercises array where duration_s might be referenced
UPDATE workout_templates 
SET exercises = (
  SELECT jsonb_agg(
    CASE 
      WHEN elem->>'value_1_type' = 'duration_s' THEN 
        elem || jsonb_build_object('value_1_type', 'duration_m')
      ELSE elem
    END ||
    CASE 
      WHEN elem->>'value_2_type' = 'duration_s' THEN 
        jsonb_build_object('value_2_type', 'duration_m')
      ELSE '{}'::jsonb
    END
  )
  FROM jsonb_array_elements(exercises) AS elem
)
WHERE EXISTS (
  SELECT 1 
  FROM jsonb_array_elements(exercises) AS elem 
  WHERE elem->>'value_1_type' = 'duration_s' OR elem->>'value_2_type' = 'duration_s'
);

-- Step 6: Remove the old 'duration_s' enum value
-- Note: PostgreSQL doesn't directly support removing enum values
-- We'll create a new enum type and migrate to it

-- Create new enum without duration_s
CREATE TYPE set_value_type_new AS ENUM ('weight_kg', 'distance_m', 'duration_m', 'calories', 'reps');

-- Update all tables to use the new enum type
ALTER TABLE exercise_templates 
  ALTER COLUMN default_value_1_type TYPE set_value_type_new USING default_value_1_type::text::set_value_type_new,
  ALTER COLUMN default_value_2_type TYPE set_value_type_new USING default_value_2_type::text::set_value_type_new;

ALTER TABLE exercises 
  ALTER COLUMN default_value_1_type TYPE set_value_type_new USING default_value_1_type::text::set_value_type_new,
  ALTER COLUMN default_value_2_type TYPE set_value_type_new USING default_value_2_type::text::set_value_type_new;

ALTER TABLE sets 
  ALTER COLUMN value_1_type TYPE set_value_type_new USING value_1_type::text::set_value_type_new,
  ALTER COLUMN value_2_type TYPE set_value_type_new USING value_2_type::text::set_value_type_new;

-- Drop old enum and rename new one
DROP TYPE set_value_type;
ALTER TYPE set_value_type_new RENAME TO set_value_type;

-- Step 7: Add comment explaining the change
COMMENT ON TYPE set_value_type IS 'Value types for exercise measurements. Duration is now stored in minutes (duration_m) instead of seconds.';

-- Step 8: Verify the migration by checking some data
DO $$
DECLARE
    duration_count INTEGER;
BEGIN
    -- Check if any duration_s values remain (should be 0)
    SELECT COUNT(*) INTO duration_count
    FROM (
        SELECT value_1_type FROM sets WHERE value_1_type::text = 'duration_s'
        UNION ALL
        SELECT value_2_type FROM sets WHERE value_2_type::text = 'duration_s'
        UNION ALL
        SELECT default_value_1_type FROM exercises WHERE default_value_1_type::text = 'duration_s'
        UNION ALL
        SELECT default_value_2_type FROM exercises WHERE default_value_2_type::text = 'duration_s'
        UNION ALL
        SELECT default_value_1_type FROM exercise_templates WHERE default_value_1_type::text = 'duration_s'
        UNION ALL
        SELECT default_value_2_type FROM exercise_templates WHERE default_value_2_type::text = 'duration_s'
    ) AS subquery;
    
    IF duration_count > 0 THEN
        RAISE EXCEPTION 'Migration failed: Found % remaining duration_s references', duration_count;
    END IF;
    
    RAISE NOTICE 'Migration completed successfully. All duration values converted from seconds to minutes.';
END $$;

COMMIT;