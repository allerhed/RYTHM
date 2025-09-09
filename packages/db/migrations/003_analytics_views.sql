-- Migration: 003_analytics_views.sql
-- Description: Create materialized views and functions for analytics

-- Create materialized view for training volume analytics
CREATE MATERIALIZED VIEW training_volume_weekly AS
SELECT 
    s.tenant_id,
    s.user_id,
    s.category,
    DATE_TRUNC('week', s.started_at) as week_start,
    COUNT(DISTINCT s.session_id) as session_count,
    COUNT(st.set_id) as total_sets,
    
    -- Strength volume (weight * reps)
    COALESCE(SUM(
        CASE 
            WHEN st.value_1_type = 'weight_kg' AND st.reps IS NOT NULL 
            THEN st.value_1_numeric * st.reps
            WHEN st.value_2_type = 'weight_kg' AND st.reps IS NOT NULL 
            THEN st.value_2_numeric * st.reps
            ELSE 0
        END
    ), 0) as strength_volume,
    
    -- Total distance
    COALESCE(SUM(
        CASE 
            WHEN st.value_1_type = 'distance_m' THEN st.value_1_numeric
            WHEN st.value_2_type = 'distance_m' THEN st.value_2_numeric
            ELSE 0
        END
    ), 0) as total_distance,
    
    -- Total duration
    COALESCE(SUM(
        CASE 
            WHEN st.value_1_type = 'duration_s' THEN st.value_1_numeric
            WHEN st.value_2_type = 'duration_s' THEN st.value_2_numeric
            ELSE 0
        END
    ), 0) as total_duration,
    
    -- Total calories
    COALESCE(SUM(
        CASE 
            WHEN st.value_1_type = 'calories' THEN st.value_1_numeric
            WHEN st.value_2_type = 'calories' THEN st.value_2_numeric
            ELSE 0
        END
    ), 0) as total_calories
    
FROM sessions s
LEFT JOIN sets st ON s.session_id = st.session_id
WHERE s.completed_at IS NOT NULL
GROUP BY s.tenant_id, s.user_id, s.category, DATE_TRUNC('week', s.started_at);

-- Create index on materialized view
CREATE UNIQUE INDEX idx_training_volume_weekly_unique 
ON training_volume_weekly (tenant_id, user_id, category, week_start);

-- Create materialized view for muscle group analytics
CREATE MATERIALIZED VIEW muscle_group_volume AS
SELECT 
    s.tenant_id,
    s.user_id,
    s.category,
    UNNEST(e.muscle_groups) as muscle_group,
    DATE_TRUNC('month', s.started_at) as month_start,
    COUNT(st.set_id) as sets_count,
    COALESCE(SUM(
        CASE 
            WHEN st.value_1_type = 'weight_kg' AND st.reps IS NOT NULL 
            THEN st.value_1_numeric * st.reps
            WHEN st.value_2_type = 'weight_kg' AND st.reps IS NOT NULL 
            THEN st.value_2_numeric * st.reps
            ELSE 0
        END
    ), 0) as volume
FROM sessions s
JOIN sets st ON s.session_id = st.session_id
JOIN exercises e ON st.exercise_id = e.exercise_id
WHERE s.completed_at IS NOT NULL
GROUP BY s.tenant_id, s.user_id, s.category, UNNEST(e.muscle_groups), DATE_TRUNC('month', s.started_at);

-- Create index on muscle group view
CREATE INDEX idx_muscle_group_volume ON muscle_group_volume 
(tenant_id, user_id, muscle_group, month_start);

-- Function to calculate 1RM estimates
CREATE OR REPLACE FUNCTION calculate_one_rm(weight NUMERIC, reps INTEGER)
RETURNS NUMERIC AS $$
BEGIN
    IF reps = 1 THEN
        RETURN weight;
    END IF;
    
    -- Epley formula: 1RM = weight * (1 + reps/30)
    RETURN weight * (1 + reps::NUMERIC / 30);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create view for personal records
CREATE VIEW personal_records AS
WITH weight_prs AS (
    SELECT DISTINCT ON (s.tenant_id, s.user_id, st.exercise_id)
        s.tenant_id,
        s.user_id,
        st.exercise_id,
        e.name as exercise_name,
        'weight' as pr_type,
        GREATEST(
            CASE WHEN st.value_1_type = 'weight_kg' THEN st.value_1_numeric ELSE 0 END,
            CASE WHEN st.value_2_type = 'weight_kg' THEN st.value_2_numeric ELSE 0 END
        ) as value,
        s.started_at as achieved_at
    FROM sessions s
    JOIN sets st ON s.session_id = st.session_id
    JOIN exercises e ON st.exercise_id = e.exercise_id
    WHERE (st.value_1_type = 'weight_kg' OR st.value_2_type = 'weight_kg')
        AND s.completed_at IS NOT NULL
    ORDER BY s.tenant_id, s.user_id, st.exercise_id, 
             GREATEST(
                 CASE WHEN st.value_1_type = 'weight_kg' THEN st.value_1_numeric ELSE 0 END,
                 CASE WHEN st.value_2_type = 'weight_kg' THEN st.value_2_numeric ELSE 0 END
             ) DESC, s.started_at DESC
),
one_rm_prs AS (
    SELECT DISTINCT ON (s.tenant_id, s.user_id, st.exercise_id)
        s.tenant_id,
        s.user_id,
        st.exercise_id,
        e.name as exercise_name,
        '1rm_estimate' as pr_type,
        calculate_one_rm(
            GREATEST(
                CASE WHEN st.value_1_type = 'weight_kg' THEN st.value_1_numeric ELSE 0 END,
                CASE WHEN st.value_2_type = 'weight_kg' THEN st.value_2_numeric ELSE 0 END
            ),
            st.reps
        ) as value,
        s.started_at as achieved_at
    FROM sessions s
    JOIN sets st ON s.session_id = st.session_id
    JOIN exercises e ON st.exercise_id = e.exercise_id
    WHERE (st.value_1_type = 'weight_kg' OR st.value_2_type = 'weight_kg')
        AND st.reps IS NOT NULL
        AND s.completed_at IS NOT NULL
    ORDER BY s.tenant_id, s.user_id, st.exercise_id,
             calculate_one_rm(
                 GREATEST(
                     CASE WHEN st.value_1_type = 'weight_kg' THEN st.value_1_numeric ELSE 0 END,
                     CASE WHEN st.value_2_type = 'weight_kg' THEN st.value_2_numeric ELSE 0 END
                 ),
                 st.reps
             ) DESC, s.started_at DESC
)
SELECT * FROM weight_prs
UNION ALL
SELECT * FROM one_rm_prs;

-- Function to refresh analytics materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY training_volume_weekly;
    REFRESH MATERIALIZED VIEW CONCURRENTLY muscle_group_volume;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT ON training_volume_weekly TO rythm_api;
GRANT SELECT ON muscle_group_volume TO rythm_api;
GRANT SELECT ON personal_records TO rythm_api;
GRANT EXECUTE ON FUNCTION calculate_one_rm(NUMERIC, INTEGER) TO rythm_api;
GRANT EXECUTE ON FUNCTION refresh_analytics_views() TO rythm_api;