-- Generate 2 workouts for today (September 11, 2025) for lars-olof@allerhed.com
-- Using uuid_generate_v4() for proper UUID generation

-- Session 1: Morning Strength Training
WITH session1 AS (
    INSERT INTO sessions (tenant_id, user_id, name, category, notes, started_at, training_load, perceived_exertion, duration_seconds)
    VALUES (
        '9386cbbf-24eb-4593-a2e2-b94b9578caba',
        'e8d9e60d-aa7a-4066-984f-53371b902c68',
        'Morning Strength Training',
        'strength',
        'Great morning session! Feeling strong and ready for the day.',
        '2025-09-11 08:30:00+00',
        285,  -- Training load
        7,    -- Perceived exertion
        3900  -- 65 minutes
    )
    RETURNING session_id
),
-- Get exercise IDs
back_squat AS (SELECT exercise_id FROM exercises WHERE name = 'Back Squat' LIMIT 1),
overhead_press AS (SELECT exercise_id FROM exercises WHERE name = 'Overhead Press' LIMIT 1),
deadlift AS (SELECT exercise_id FROM exercises WHERE name = 'Deadlift' LIMIT 1)

-- Insert sets for session 1
INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s1.session_id,
    bs.exercise_id,
    1,
    'weight', 100, 'reps', 8, 'Feeling good, solid form'
FROM session1 s1, back_squat bs
UNION ALL
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s1.session_id,
    bs.exercise_id,
    2,
    'weight', 105, 'reps', 6, 'Increased weight'
FROM session1 s1, back_squat bs
UNION ALL
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s1.session_id,
    bs.exercise_id,
    3,
    'weight', 110, 'reps', 5, 'Heavy set, good depth'
FROM session1 s1, back_squat bs
UNION ALL
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s1.session_id,
    bs.exercise_id,
    4,
    'weight', 105, 'reps', 6, 'Drop back down, perfect form'
FROM session1 s1, back_squat bs
UNION ALL
-- Overhead Press sets
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s1.session_id,
    op.exercise_id,
    1,
    'weight', 65, 'reps', 10, 'Good warm-up set'
FROM session1 s1, overhead_press op
UNION ALL
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s1.session_id,
    op.exercise_id,
    2,
    'weight', 70, 'reps', 8, 'Feeling strong'
FROM session1 s1, overhead_press op
UNION ALL
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s1.session_id,
    op.exercise_id,
    3,
    'weight', 72, 'reps', 6, 'Challenging set'
FROM session1 s1, overhead_press op
UNION ALL
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s1.session_id,
    op.exercise_id,
    4,
    'weight', 68, 'reps', 8, 'Solid finish'
FROM session1 s1, overhead_press op
UNION ALL
-- Deadlift sets
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s1.session_id,
    dl.exercise_id,
    1,
    'weight', 130, 'reps', 5, 'Good form, controlled'
FROM session1 s1, deadlift dl
UNION ALL
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s1.session_id,
    dl.exercise_id,
    2,
    'weight', 140, 'reps', 3, 'Heavy, but manageable'
FROM session1 s1, deadlift dl
UNION ALL
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s1.session_id,
    dl.exercise_id,
    3,
    'weight', 135, 'reps', 4, 'Perfect finish'
FROM session1 s1, deadlift dl;

-- Session 2: Evening Hybrid Training
WITH session2 AS (
    INSERT INTO sessions (tenant_id, user_id, name, category, notes, started_at, training_load, perceived_exertion, duration_seconds)
    VALUES (
        '9386cbbf-24eb-4593-a2e2-b94b9578caba',
        'e8d9e60d-aa7a-4066-984f-53371b902c68',
        'Evening Hybrid Training',
        'hybrid',
        'Perfect end to the day! Combined cardio and strength for a balanced session.',
        '2025-09-11 18:45:00+00',
        220,  -- Training load
        8,    -- Perceived exertion
        2700  -- 45 minutes
    )
    RETURNING session_id
),
-- Get exercise IDs for session 2
row_ex AS (SELECT exercise_id FROM exercises WHERE name = 'Row' LIMIT 1),
air_squat AS (SELECT exercise_id FROM exercises WHERE name = 'Air Squat' LIMIT 1),
push_up AS (SELECT exercise_id FROM exercises WHERE name = 'Push-Up' LIMIT 1)

-- Insert sets for session 2
INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s2.session_id,
    r.exercise_id,
    1,
    'distance', 2000, 'time', 480, 'Steady pace, 8:00 split - great cardio!'
FROM session2 s2, row_ex r
UNION ALL
-- Air Squat sets
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s2.session_id,
    a.exercise_id,
    1,
    'reps', 20, NULL, NULL, 'Good warm-up'
FROM session2 s2, air_squat a
UNION ALL
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s2.session_id,
    a.exercise_id,
    2,
    'reps', 25, NULL, NULL, 'Increased reps'
FROM session2 s2, air_squat a
UNION ALL
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s2.session_id,
    a.exercise_id,
    3,
    'reps', 30, NULL, NULL, 'Burnout set - legs on fire!'
FROM session2 s2, air_squat a
UNION ALL
-- Push-Up sets
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s2.session_id,
    p.exercise_id,
    1,
    'reps', 15, NULL, NULL, 'Clean form'
FROM session2 s2, push_up p
UNION ALL
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s2.session_id,
    p.exercise_id,
    2,
    'reps', 12, NULL, NULL, 'Getting tired'
FROM session2 s2, push_up p
UNION ALL
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    s2.session_id,
    p.exercise_id,
    3,
    'reps', 10, NULL, NULL, 'Final push - great session!'
FROM session2 s2, push_up p;

-- Verify the workouts were created
SELECT 
    s.name,
    s.category,
    s.started_at,
    s.training_load,
    s.perceived_exertion,
    COUNT(st.set_id) as total_sets,
    COUNT(DISTINCT st.exercise_id) as exercise_count
FROM sessions s
LEFT JOIN sets st ON s.session_id = st.session_id
WHERE s.user_id = 'e8d9e60d-aa7a-4066-984f-53371b902c68' 
    AND DATE(s.started_at) = '2025-09-11'
GROUP BY s.session_id, s.name, s.category, s.started_at, s.training_load, s.perceived_exertion
ORDER BY s.started_at;