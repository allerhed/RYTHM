-- Generate 2 workouts for today (September 11, 2025) for lars-olof@allerhed.com

-- First, create the sessions with generated UUIDs
INSERT INTO sessions (tenant_id, user_id, name, category, notes, started_at, training_load, perceived_exertion, duration_seconds)
VALUES 
    ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid,
     'e8d9e60d-aa7a-4066-984f-53371b902c68'::uuid,
     'Morning Strength Training',
     'strength',
     'Great morning session! Feeling strong and ready for the day.',
     '2025-09-11 08:30:00+00'::timestamp with time zone,
     285,
     7,
     3900),
    ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid,
     'e8d9e60d-aa7a-4066-984f-53371b902c68'::uuid,
     'Evening Hybrid Training',
     'hybrid',
     'Perfect end to the day! Combined cardio and strength for a balanced session.',
     '2025-09-11 18:45:00+00'::timestamp with time zone,
     220,
     8,
     2700);

-- Get the session IDs for the workouts we just created
DO $$
DECLARE
    morning_session_id UUID;
    evening_session_id UUID;
    back_squat_id UUID;
    overhead_press_id UUID;
    deadlift_id UUID;
    row_id UUID;
    air_squat_id UUID;
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

    -- Get exercise IDs
    SELECT exercise_id INTO back_squat_id FROM exercises WHERE name = 'Back Squat' LIMIT 1;
    SELECT exercise_id INTO overhead_press_id FROM exercises WHERE name = 'Overhead Press' LIMIT 1;
    SELECT exercise_id INTO deadlift_id FROM exercises WHERE name = 'Deadlift' LIMIT 1;
    SELECT exercise_id INTO row_id FROM exercises WHERE name = 'Row' LIMIT 1;
    SELECT exercise_id INTO air_squat_id FROM exercises WHERE name = 'Air Squat' LIMIT 1;
    SELECT exercise_id INTO push_up_id FROM exercises WHERE name = 'Push-Up' LIMIT 1;

    -- Morning workout sets (Back Squat, Overhead Press, Deadlift)
    INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
    VALUES 
        -- Back Squat sets
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, back_squat_id, 1, 'weight', 100, 'reps', 8, 'Feeling good, solid form'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, back_squat_id, 2, 'weight', 105, 'reps', 6, 'Increased weight'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, back_squat_id, 3, 'weight', 110, 'reps', 5, 'Heavy set, good depth'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, back_squat_id, 4, 'weight', 105, 'reps', 6, 'Drop back down, perfect form'),
        
        -- Overhead Press sets  
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, overhead_press_id, 1, 'weight', 65, 'reps', 10, 'Good warm-up set'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, overhead_press_id, 2, 'weight', 70, 'reps', 8, 'Feeling strong'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, overhead_press_id, 3, 'weight', 72, 'reps', 6, 'Challenging set'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, overhead_press_id, 4, 'weight', 68, 'reps', 8, 'Solid finish'),
        
        -- Deadlift sets
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, deadlift_id, 1, 'weight', 130, 'reps', 5, 'Good form, controlled'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, deadlift_id, 2, 'weight', 140, 'reps', 3, 'Heavy, but manageable'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, morning_session_id, deadlift_id, 3, 'weight', 135, 'reps', 4, 'Perfect finish');

    -- Evening workout sets (Row, Air Squat, Push-Up)
    INSERT INTO sets (tenant_id, session_id, exercise_id, set_index, value_1_type, value_1_numeric, value_2_type, value_2_numeric, notes)
    VALUES 
        -- Row set
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, evening_session_id, row_id, 1, 'distance', 2000, 'time', 480, 'Steady pace, 8:00 split - great cardio!'),
        
        -- Air Squat sets
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, evening_session_id, air_squat_id, 1, 'reps', 20, NULL, NULL, 'Good warm-up'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, evening_session_id, air_squat_id, 2, 'reps', 25, NULL, NULL, 'Increased reps'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, evening_session_id, air_squat_id, 3, 'reps', 30, NULL, NULL, 'Burnout set - legs on fire!'),
        
        -- Push-Up sets
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, evening_session_id, push_up_id, 1, 'reps', 15, NULL, NULL, 'Clean form'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, evening_session_id, push_up_id, 2, 'reps', 12, NULL, NULL, 'Getting tired'),
        ('9386cbbf-24eb-4593-a2e2-b94b9578caba'::uuid, evening_session_id, push_up_id, 3, 'reps', 10, NULL, NULL, 'Final push - great session!');
        
END $$;

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
WHERE s.user_id = 'e8d9e60d-aa7a-4066-984f-53371b902c68'::uuid 
    AND DATE(s.started_at) = '2025-09-11'
GROUP BY s.session_id, s.name, s.category, s.started_at, s.training_load, s.perceived_exertion
ORDER BY s.started_at;