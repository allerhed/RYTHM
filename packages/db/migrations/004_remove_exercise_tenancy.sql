-- Migration 004: Remove tenant concept from exercises
-- This migration makes exercises globally available to all tenants
-- Run after: 003_analytics_views.sql

BEGIN;

-- Step 1: Drop row-level security policy for exercises
DROP POLICY IF EXISTS exercise_isolation_policy ON exercises;

-- Step 2: Drop tenant-specific indexes
DROP INDEX IF EXISTS idx_exercises_tenant_name;

-- Step 3: Create unique constraint on exercise name globally
-- This prevents duplicate exercise names across the entire system
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_name_unique ON exercises(name);

-- Step 4: Remove foreign key constraint to tenants table
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_tenant_id_fkey;

-- Step 5: Remove tenant_id column from exercises table
ALTER TABLE exercises DROP COLUMN IF EXISTS tenant_id;

-- Step 6: Clean up any potential duplicates
-- Keep the most recently created version of each exercise
WITH duplicate_exercises AS (
    SELECT exercise_id, 
           ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rn
    FROM exercises
)
DELETE FROM exercises 
WHERE exercise_id IN (
    SELECT exercise_id 
    FROM duplicate_exercises 
    WHERE rn > 1
);

-- Step 7: Update any application functions that might reference tenant_id in exercises
-- Note: This step may require additional application code updates

COMMIT;

-- Verification queries (informational only)
-- SELECT COUNT(*) as total_global_exercises FROM exercises;
-- SELECT exercise_category, COUNT(*) as count FROM exercises GROUP BY exercise_category;