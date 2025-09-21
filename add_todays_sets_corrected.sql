-- Generate sets for the 2 workouts created today (September 11, 2025)
-- Using actual exercise names from the database

DO $$
DECLARE
    morning_session_id UUID;
    evening_session_id UUID;
    back_squat_id UUID;
    overhead_press_id UUID;
    deadlift_id UUID;
    row_id UUID;
    front_squat_id UUID;
    push_up_id UUID;
BEGIN
    -- Get session IDs
    SELECT session_id INTO morning_session_id 
    FROM sessions 
    WHERE user_id = 'e8d9e60d-aa7a-4066-984f-53371b902c68'::uuid 
        AND name = 'Morning Strength Training' 
        AND DATE(started_at) = '2025-09-11';
        
    SELECT session_id INTO evening_session_id 
    FROM sessions 
    WHERE user_id = 'e8d9e60d-aa7a-4066-984f-53371b902c68'::uuid 
        AND name = 'Evening Hybrid Training' 
        AND DATE(started_at) = '2025-09-11';

    -- Get exercise IDs (using actual names from database)
    SELECT exercise_id INTO back_squat_id FROM exercises WHERE name = 'Back Squat' LIMIT 1;
    SELECT exercise_id INTO overhead_press_id FROM exercises WHERE name = 'Standing Overhead Press' LIMIT 1;
    SELECT exercise_id INTO deadlift_id FROM exercises WHERE name = 'Deadlift' LIMIT 1;
    SELECT exercise_id INTO row_id FROM exercises WHERE name = 'Row' LIMIT 1;
    SELECT exercise_id INTO front_squat_id FROM exercises WHERE name = 'Front Squat' LIMIT 1;  -- using as bodyweight squat
    SELECT exercise_id INTO push_up_id FROM exercises WHERE name = 'Push-ups' LIMIT 1;

    -- Morning workout sets (Back Squat, Standing Overhead Press, Deadlift)
    INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
    VALUES 
        -- Back Squat sets (weight_kg + reps)
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, back_squat_id, 1, 'weight_kg', 100, 'reps', 8, 'Feeling good, solid form'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, back_squat_id, 2, 'weight_kg', 105, 'reps', 6, 'Increased weight'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, back_squat_id, 3, 'weight_kg', 110, 'reps', 5, 'Heavy set, good depth'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, back_squat_id, 4, 'weight_kg', 105, 'reps', 6, 'Drop back down, perfect form'),
        
        -- Standing Overhead Press sets (weight_kg + reps)
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, overhead_press_id, 1, 'weight_kg', 65, 'reps', 10, 'Good warm-up set'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, overhead_press_id, 2, 'weight_kg', 70, 'reps', 8, 'Feeling strong'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, overhead_press_id, 3, 'weight_kg', 72, 'reps', 6, 'Challenging set'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, overhead_press_id, 4, 'weight_kg', 68, 'reps', 8, 'Solid finish'),
        
        -- Deadlift sets (weight_kg + reps)
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, deadlift_id, 1, 'weight_kg', 130, 'reps', 5, 'Good form, controlled'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, deadlift_id, 2, 'weight_kg', 140, 'reps', 3, 'Heavy, but manageable'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, deadlift_id, 3, 'weight_kg', 135, 'reps', 4, 'Perfect finish');

    -- Evening workout sets (Row, Front Squat as bodyweight, Push-ups)
    INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
    VALUES 
        -- Row set (distance_m + duration_m)
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, evening_session_id, row_id, 1, 'distance_m', 2000, 'duration_m', 8, 'Steady pace, 8:00 split - great cardio!'),
        
        -- Front Squat sets (bodyweight - reps only)
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, evening_session_id, front_squat_id, 1, 'reps', 20, NULL, NULL, 'Bodyweight squats - good warm-up'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, evening_session_id, front_squat_id, 2, 'reps', 25, NULL, NULL, 'Increased reps'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, evening_session_id, front_squat_id, 3, 'reps', 30, NULL, NULL, 'Burnout set - legs on fire!'),
        
        -- Push-up sets (reps only)
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, evening_session_id, push_up_id, 1, 'reps', 15, NULL, NULL, 'Clean form'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, evening_session_id, push_up_id, 2, 'reps', 12, NULL, NULL, 'Getting tired'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, evening_session_id, push_up_id, 3, 'reps', 10, NULL, NULL, 'Final push - great session!');
        
END $$;

-- Final verification
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
WHERE s.user_id = 'e8d9e60d-aa7a-4066-984f-53371b902c68'::uuid 
    AND DATE(s.started_at) = '2025-09-11'
GROUP BY s.session_id, s.name, s.category, s.started_at, s.training_load, s.perceived_exertion
ORDER BY s.started_at;