-- Migration: Remove tenant concept from exercises table
-- This makes exercises globally available to all tenants

BEGIN;

-- Step 1: Drop the row-level security policy
DROP POLICY IF EXISTS exercise_isolation_policy ON exercises;

-- Step 2: Drop the tenant-specific index
DROP INDEX IF EXISTS idx_exercises_tenant_name;

-- Step 3: Create a new unique index on exercise name only (to prevent global duplicates)
CREATE UNIQUE INDEX idx_exercises_name_unique ON exercises(name);

-- Step 4: Drop the foreign key constraint to tenants
ALTER TABLE exercises DROP CONSTRAINT IF EXISTS exercises_tenant_id_fkey;

-- Step 5: Drop the tenant_id column
ALTER TABLE exercises DROP COLUMN IF EXISTS tenant_id;

-- Step 6: Clean up any duplicate exercises that might now exist
-- (Keep the most recently created version of each exercise)
WITH duplicates AS (
    SELECT exercise_id, 
           ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at DESC) as rn
    FROM exercises
)
DELETE FROM exercises 
WHERE exercise_id IN (
    SELECT exercise_id 
    FROM duplicates 
    WHERE rn > 1
);

COMMIT;

-- Verify the changes
SELECT 
    'MIGRATION COMPLETED' as status,
    COUNT(*) as total_exercises
FROM exercises

UNION ALL

SELECT 
    'EXERCISES BY CATEGORY' as status,
    exercise_category || ': ' || COUNT(*) as total_exercises
FROM exercises
GROUP BY exercise_category

ORDER BY status DESC;