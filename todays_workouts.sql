-- Generate 2 workouts for today (September 11, 2025) for lars-olof@allerhed.com
-- This script creates workouts with realistic data for the current date

-- Session 1: Morning Strength Training (8:30 AM)
INSERT INTO sessions (session_id, tenant_id, user_id, name, category, notes, started_at, training_load, perceived_exertion, duration_seconds)
VALUES (
    'a1b2c3d4-e5f6-4789-9012-k1l2m3n4o5p6',
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'e8d9e60d-aa7a-4066-984f-53371b902c68',
    'Morning Strength Training',
    'strength',
    'Great morning session! Feeling strong and ready for the day.',
    '2025-09-11 08:30:00+00',
    285,  -- Training load
    7,    -- Perceived exertion
    3900  -- 65 minutes
);

-- Session 2: Evening Hybrid Training (6:45 PM)
INSERT INTO sessions (session_id, tenant_id, user_id, name, category, notes, started_at, training_load, perceived_exertion, duration_seconds)
VALUES (
    'b2c3d4e5-f6g7-4890-1234-l2m3n4o5p6q7',
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'e8d9e60d-aa7a-4066-984f-53371b902c68',
    'Evening Hybrid Training',
    'hybrid',
    'Perfect end to the day! Combined cardio and strength for a balanced session.',
    '2025-09-11 18:45:00+00',
    220,  -- Training load
    8,    -- Perceived exertion
    2700  -- 45 minutes
);

-- Get some exercise IDs for the sets
-- We'll use common exercises: Back Squat, Push-Up, Row, Air Squat, Run
-- Let's get their IDs first and then add sets

-- Sets for Morning Strength Training
-- Exercise 1: Back Squat (4 sets)
INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    exercise_id,
    1,
    'weight', 100,
    'reps', 8,
    'Feeling good, solid form'
FROM exercises WHERE name = 'Back Squat' LIMIT 1;

INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    exercise_id,
    2,
    'weight', 105,
    'reps', 6,
    'Increased weight'
FROM exercises WHERE name = 'Back Squat' LIMIT 1;

INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    exercise_id,
    3,
    'weight', 110,
    'reps', 5,
    'Heavy set, good depth'
FROM exercises WHERE name = 'Back Squat' LIMIT 1;

INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    exercise_id,
    4,
    'weight', 105,
    'reps', 6,
    'Drop back down, perfect form'
FROM exercises WHERE name = 'Back Squat' LIMIT 1;

-- Exercise 2: Overhead Press (4 sets)
INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    exercise_id,
    1,
    'weight', 65,
    'reps', 10,
    'Good warm-up set'
FROM exercises WHERE name = 'Overhead Press' LIMIT 1;

INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    exercise_id,
    2,
    'weight', 70,
    'reps', 8,
    'Feeling strong'
FROM exercises WHERE name = 'Overhead Press' LIMIT 1;

INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    exercise_id,
    3,
    'weight', 72,
    'reps', 6,
    'Challenging set'
FROM exercises WHERE name = 'Overhead Press' LIMIT 1;

INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    exercise_id,
    4,
    'weight', 68,
    'reps', 8,
    'Solid finish'
FROM exercises WHERE name = 'Overhead Press' LIMIT 1;

-- Exercise 3: Deadlift (3 sets)
INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    exercise_id,
    1,
    'weight', 130,
    'reps', 5,
    'Good form, controlled'
FROM exercises WHERE name = 'Deadlift' LIMIT 1;

INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    exercise_id,
    2,
    'weight', 140,
    'reps', 3,
    'Heavy, but manageable'
FROM exercises WHERE name = 'Deadlift' LIMIT 1;

INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'a1b2c3d4-e5f6-7g8h-9i0j-k1l2m3n4o5p6',
    exercise_id,
    3,
    'weight', 135,
    'reps', 4,
    'Perfect finish'
FROM exercises WHERE name = 'Deadlift' LIMIT 1;

-- Sets for Evening Hybrid Training
-- Exercise 1: Row (Cardio - 2000m)
INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7',
    exercise_id,
    1,
    'distance', 2000,
    'time', 480,
    'Steady pace, 8:00 split - great cardio!'
FROM exercises WHERE name = 'Row' LIMIT 1;

-- Exercise 2: Air Squat (3 sets)
INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7',
    exercise_id,
    1,
    'reps', 20,
    NULL, NULL,
    'Good warm-up'
FROM exercises WHERE name = 'Air Squat' LIMIT 1;

INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7',
    exercise_id,
    2,
    'reps', 25,
    NULL, NULL,
    'Increased reps'
FROM exercises WHERE name = 'Air Squat' LIMIT 1;

INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7',
    exercise_id,
    3,
    'reps', 30,
    NULL, NULL,
    'Burnout set - legs on fire!'
FROM exercises WHERE name = 'Air Squat' LIMIT 1;

-- Exercise 3: Push-Up (3 sets)
INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7',
    exercise_id,
    1,
    'reps', 15,
    NULL, NULL,
    'Clean form'
FROM exercises WHERE name = 'Push-Up' LIMIT 1;

INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7',
    exercise_id,
    2,
    'reps', 12,
    NULL, NULL,
    'Getting tired'
FROM exercises WHERE name = 'Push-Up' LIMIT 1;

INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
SELECT 
    '9386cbbf-24eb-4593-a2e2-b94b9578caba',
    'b2c3d4e5-f6g7-8h9i-0j1k-l2m3n4o5p6q7',
    exercise_id,
    3,
    'reps', 10,
    NULL, NULL,
    'Final push - great session!'
FROM exercises WHERE name = 'Push-Up' LIMIT 1;