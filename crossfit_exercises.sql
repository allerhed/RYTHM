-- Add CrossFit/Olympic Lifting exercises to the database
-- This script checks for duplicates and adds only new exercises

BEGIN;

-- Insert new exercises, avoiding duplicates
INSERT INTO exercises (
    tenant_id, 
    name, 
    muscle_groups, 
    equipment, 
    exercise_category, 
    exercise_type, 
    default_value_1_type, 
    default_value_2_type,
    notes
) 
SELECT 
    t.tenant_id,
    exercise_data.name,
    exercise_data.muscle_groups,
    exercise_data.equipment,
    exercise_data.exercise_category,
    exercise_data.exercise_type::exercise_type,
    exercise_data.default_value_1_type::set_value_type,
    exercise_data.default_value_2_type::set_value_type,
    exercise_data.notes
FROM tenants t
CROSS JOIN (
    VALUES 
        -- Olympic Lifting Variations
        ('Front Squat', ARRAY['quadriceps', 'glutes', 'core', 'shoulders'], 'Barbell, Squat Rack', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Front-loaded squat variation with increased core demand'),
        ('Overhead Squat', ARRAY['quadriceps', 'glutes', 'shoulders', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body mobility and strength exercise'),
        ('Power Clean', ARRAY['hamstrings', 'glutes', 'traps', 'shoulders'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive Olympic lift variation'),
        ('Squat Clean', ARRAY['hamstrings', 'glutes', 'quadriceps', 'traps', 'shoulders'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full squat clean Olympic lift'),
        ('Push Jerk', ARRAY['shoulders', 'triceps', 'legs', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive overhead pressing movement'),
        ('Split Jerk', ARRAY['shoulders', 'triceps', 'legs', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Split stance overhead jerk'),
        ('Power Snatch', ARRAY['hamstrings', 'glutes', 'traps', 'shoulders'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Power position snatch Olympic lift'),
        ('Squat Snatch', ARRAY['hamstrings', 'glutes', 'quadriceps', 'traps', 'shoulders'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full squat snatch Olympic lift'),
        ('Thruster', ARRAY['quadriceps', 'glutes', 'shoulders', 'triceps'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Front squat to overhead press combination'),
        ('Sumo Deadlift High Pull', ARRAY['hamstrings', 'glutes', 'traps', 'rhomboids'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Wide stance deadlift with high pull'),

        -- Pressing Variations
        ('Strict Press', ARRAY['shoulders', 'triceps', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Strict overhead barbell press'),
        ('Push Press', ARRAY['shoulders', 'triceps', 'legs', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Leg drive assisted overhead press'),

        -- Pull-Up Variations
        ('Strict Pull-Up', ARRAY['lats', 'rhomboids', 'biceps'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Dead hang strict pull-up'),
        ('Kipping Pull-Up', ARRAY['lats', 'rhomboids', 'core'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Dynamic kipping pull-up'),
        ('Butterfly Pull-Up', ARRAY['lats', 'rhomboids', 'core'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Continuous butterfly pull-up'),
        ('Chest-to-Bar Pull-Up', ARRAY['lats', 'rhomboids', 'biceps'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up with chest touching bar'),

        -- Muscle-Up Variations
        ('Bar Muscle-Up', ARRAY['lats', 'chest', 'triceps', 'core'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up to dip transition on bar'),
        ('Ring Muscle-Up', ARRAY['lats', 'chest', 'triceps', 'core'], 'Gymnastic Rings', 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up to dip transition on rings'),

        -- Handstand Variations
        ('Strict Handstand Push-Up', ARRAY['shoulders', 'triceps', 'core'], 'Wall', 'strength', 'STRENGTH', 'reps', NULL, 'Strict handstand push-up against wall'),
        ('Kipping Handstand Push-Up', ARRAY['shoulders', 'triceps', 'core'], 'Wall', 'strength', 'STRENGTH', 'reps', NULL, 'Kipping handstand push-up with leg drive'),
        ('Handstand Walk', ARRAY['shoulders', 'core', 'wrists'], 'Open Space', 'strength', 'STRENGTH', 'distance_m', NULL, 'Walking on hands in handstand position'),

        -- Core & Gymnastics
        ('Toes-to-Bar', ARRAY['abs', 'hip_flexors', 'lats'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Hanging toes to bar movement'),
        ('Sit-Up', ARRAY['abs', 'hip_flexors'], 'Bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Traditional sit-up exercise'),

        -- Dip Variations
        ('Ring Dip', ARRAY['chest', 'triceps', 'shoulders'], 'Gymnastic Rings', 'strength', 'STRENGTH', 'reps', NULL, 'Dips performed on gymnastic rings'),
        ('Bar Dip', ARRAY['chest', 'triceps', 'shoulders'], 'Parallel Bars', 'strength', 'STRENGTH', 'reps', NULL, 'Dips performed on parallel bars'),

        -- Functional Movements
        ('Rope Climb', ARRAY['lats', 'biceps', 'forearms', 'core'], 'Climbing Rope', 'strength', 'STRENGTH', 'distance_m', NULL, 'Rope climbing exercise'),
        ('Box Jump Over', ARRAY['legs', 'glutes', 'calves'], 'Box', 'strength', 'STRENGTH', 'reps', NULL, 'Box jump with step or jump over'),
        ('Wall Ball Shot', ARRAY['legs', 'shoulders', 'core'], 'Medicine Ball, Wall', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Squat to overhead throw against wall'),

        -- Burpee Variations
        ('Burpee', ARRAY['chest', 'legs', 'core'], 'Bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Full body burpee movement'),
        ('Bar-Facing Burpee', ARRAY['chest', 'legs', 'core'], 'Barbell', 'strength', 'STRENGTH', 'reps', NULL, 'Burpee facing and jumping over barbell'),
        ('Lateral Burpee', ARRAY['chest', 'legs', 'core'], 'Bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Burpee with lateral movement'),

        -- Jump Rope
        ('Single-Under', ARRAY['calves', 'shoulders', 'forearms'], 'Jump Rope', 'cardio', 'CARDIO', 'reps', 'duration_s', 'Single jump rope revolution per jump'),
        ('Double-Under', ARRAY['calves', 'shoulders', 'forearms'], 'Jump Rope', 'cardio', 'CARDIO', 'reps', 'duration_s', 'Double jump rope revolution per jump')

) AS exercise_data(name, muscle_groups, equipment, exercise_category, exercise_type, default_value_1_type, default_value_2_type, notes)
WHERE t.name = 'Default Gym'
AND NOT EXISTS (
    SELECT 1 FROM exercises e2 
    WHERE e2.name = exercise_data.name 
    AND e2.tenant_id = t.tenant_id
);

COMMIT;

-- Show what was added
SELECT 
    'NEW EXERCISES ADDED' as status,
    exercise_category as category,
    COUNT(*) as count
FROM exercises e
JOIN tenants t ON e.tenant_id = t.tenant_id
WHERE t.name = 'Default Gym'
AND e.created_at > (NOW() - INTERVAL '1 minute')
GROUP BY exercise_category

UNION ALL

SELECT 
    'TOTAL AFTER ADDITION' as status,
    exercise_category as category,
    COUNT(*) as count
FROM exercises e
JOIN tenants t ON e.tenant_id = t.tenant_id
WHERE t.name = 'Default Gym'
GROUP BY exercise_category

UNION ALL

SELECT 
    'GRAND TOTAL' as status,
    'All Categories' as category,
    COUNT(*) as count
FROM exercises e
JOIN tenants t ON e.tenant_id = t.tenant_id
WHERE t.name = 'Default Gym'

ORDER BY status, category;