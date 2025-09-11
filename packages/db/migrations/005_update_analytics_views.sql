-- Migration: Update analytics views to remove tenant_id references
-- File: 005_update_analytics_views.sql
-- Purpose: Update analytics views to work with global exercises (no tenant_id)

-- Drop existing views that reference exercises.tenant_id
DROP VIEW IF EXISTS exercise_pr_tracking CASCADE;
DROP VIEW IF EXISTS exercise_volume_tracking CASCADE;

-- Recreate exercise_pr_tracking view without tenant_id filtering
CREATE VIEW exercise_pr_tracking AS
SELECT DISTINCT ON (s.tenant_id, s.user_id, st.exercise_id)
    s.tenant_id,
    s.user_id,
    st.exercise_id,
    e.name AS exercise_name,
    e.exercise_category,
    e.exercise_type,
    s.started_at AS pr_date,
    st.value_1_numeric AS weight_kg,
    st.value_2_numeric AS reps,
    (st.value_1_numeric * st.value_2_numeric * 0.033 + st.value_1_numeric) AS estimated_1rm
FROM sessions s
    JOIN sets st ON st.session_id = s.session_id
    JOIN exercises e ON e.exercise_id = st.exercise_id
WHERE 
    s.completed_at IS NOT NULL
    AND st.value_1_type = 'weight_kg'
    AND st.value_2_type = 'reps'
    AND st.value_1_numeric > 0
    AND st.value_2_numeric > 0
ORDER BY s.tenant_id, s.user_id, st.exercise_id, 
         (st.value_1_numeric * st.value_2_numeric * 0.033 + st.value_1_numeric) DESC NULLS LAST,
         s.started_at DESC;

-- Recreate exercise_volume_tracking view without tenant_id filtering
CREATE VIEW exercise_volume_tracking AS
SELECT DISTINCT ON (s.tenant_id, s.user_id, st.exercise_id)
    s.tenant_id,
    s.user_id,
    st.exercise_id,
    e.name AS exercise_name,
    e.exercise_category,
    e.exercise_type,
    s.started_at AS session_date,
    COUNT(st.set_id) AS total_sets,
    SUM(st.value_1_numeric * st.value_2_numeric) AS total_volume_kg_reps,
    AVG(st.value_1_numeric) AS avg_weight_kg,
    AVG(st.value_2_numeric) AS avg_reps
FROM sessions s
    JOIN sets st ON st.session_id = s.session_id
    JOIN exercises e ON e.exercise_id = st.exercise_id
WHERE 
    s.completed_at IS NOT NULL
    AND st.value_1_type = 'weight_kg'
    AND st.value_2_type = 'reps'
    AND st.value_1_numeric > 0
    AND st.value_2_numeric > 0
GROUP BY s.tenant_id, s.user_id, st.exercise_id, e.name, e.exercise_category, e.exercise_type, s.started_at
ORDER BY s.tenant_id, s.user_id, st.exercise_id,
         SUM(st.value_1_numeric * st.value_2_numeric) DESC NULLS LAST,
         s.started_at DESC;

-- Add indexes for performance on the updated views
CREATE INDEX IF NOT EXISTS idx_sets_exercise_session ON sets(exercise_id, session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_completed ON sessions(user_id, completed_at) WHERE completed_at IS NOT NULL;

-- Verification queries
-- Check that views are working correctly
-- SELECT COUNT(*) FROM exercise_pr_tracking;
-- SELECT COUNT(*) FROM exercise_volume_tracking;
-- SELECT * FROM exercise_pr_tracking LIMIT 5;
-- SELECT * FROM exercise_volume_tracking LIMIT 5;