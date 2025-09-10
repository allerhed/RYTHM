-- Add missing exercises and ensure complete coverage
-- This script will only insert exercises that don't already exist

BEGIN;

-- Insert exercises that don't already exist
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
        -- Lower Body Strength
        ('Box Jump', ARRAY['legs', 'glutes', 'calves'], 'Box', 'strength', 'STRENGTH', 'reps', NULL, 'Explosive lower body power exercise'),
        ('Run', ARRAY['legs', 'glutes', 'calves'], 'None', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Running for cardiovascular fitness'),
        ('Echo Bike', ARRAY['legs', 'arms', 'core'], 'Echo Bike', 'cardio', 'CARDIO', 'calories', 'duration_s', 'Full body cardio exercise'),
        ('Back Squat', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'Barbell, Squat Rack', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Compound lower body strength exercise'),
        ('Deadlift', ARRAY['hamstrings', 'glutes', 'lower_back', 'traps'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body compound movement'),
        ('Bulgarian Split Squat', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'Dumbbells, Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral leg strength exercise'),
        ('Leg Extensions', ARRAY['quadriceps'], 'Leg Extension Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated quadriceps exercise'),
        ('Leg Curl', ARRAY['hamstrings'], 'Leg Curl Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated hamstring exercise'),
        ('GHD Back', ARRAY['lower_back', 'glutes', 'hamstrings'], 'GHD Machine', 'strength', 'STRENGTH', 'reps', NULL, 'Posterior chain strengthening'),
        ('Pallof Press', ARRAY['core', 'obliques'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Anti-rotation core exercise'),
        ('GHD Situps', ARRAY['abs', 'hip_flexors'], 'GHD Machine', 'strength', 'STRENGTH', 'reps', NULL, 'Core strengthening exercise'),
        ('Sled Push', ARRAY['legs', 'glutes', 'core'], 'Weight Sled', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Functional pushing exercise'),
        ('Sled Pull', ARRAY['lats', 'rhomboids', 'legs'], 'Weight Sled', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Functional pulling exercise'),
        ('Ski-erg', ARRAY['lats', 'core', 'legs'], 'Ski Erg Machine', 'cardio', 'CARDIO', 'calories', 'duration_s', 'Full body pulling cardio'),
        ('Med-ball Chest Pass', ARRAY['chest', 'shoulders', 'core'], 'Medicine Ball', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive chest exercise'),
        ('Row', ARRAY['lats', 'rhomboids', 'legs'], 'Rowing Machine', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Full body rowing exercise'),
        ('Incline Dumbbell Press', ARRAY['chest', 'shoulders', 'triceps'], 'Dumbbells, Incline Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper chest focused press'),
        ('Bench Press', ARRAY['chest', 'triceps', 'shoulders'], 'Barbell, Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Compound chest exercise'),
        ('Push-ups', ARRAY['chest', 'triceps', 'shoulders'], 'Bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Bodyweight pushing exercise'),
        ('Standing Overhead Press', ARRAY['shoulders', 'triceps', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body overhead pressing'),
        ('Seated Trap Pull', ARRAY['traps', 'rhomboids', 'rear_delts'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper trap focused exercise'),
        ('Ring Rows', ARRAY['rhomboids', 'lats', 'biceps'], 'Gymnastic Rings', 'strength', 'STRENGTH', 'reps', NULL, 'Bodyweight horizontal pull'),
        ('Lat Pull Down Wide', ARRAY['lats', 'rhomboids', 'biceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Wide grip lat pulldown'),
        ('Lat Pull Down Narrow', ARRAY['lats', 'rhomboids', 'biceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Narrow grip lat pulldown'),
        ('Seated Row', ARRAY['rhomboids', 'mid_traps', 'biceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Horizontal pulling exercise'),
        ('Dumbbell Biceps Curl', ARRAY['biceps'], 'Dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated biceps exercise'),
        ('Cable Triceps Push', ARRAY['triceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated triceps exercise'),
        ('Farmers Carry', ARRAY['traps', 'forearms', 'core'], 'Dumbbells/Kettlebells', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Grip and core strength'),
        ('Wall-balls', ARRAY['legs', 'shoulders', 'core'], 'Medicine Ball', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body explosive exercise'),
        ('Banded Y,T,W', ARRAY['rear_delts', 'rhomboids', 'mid_traps'], 'Resistance Bands', 'strength', 'STRENGTH', 'reps', NULL, 'Shoulder rehabilitation exercise'),
        ('Seated Z-press', ARRAY['shoulders', 'triceps', 'core'], 'Barbell, Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Strict overhead press variation'),
        ('Landmine Press', ARRAY['shoulders', 'chest', 'core'], 'Barbell, Landmine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral pressing movement'),
        ('Landmine Chest Press', ARRAY['chest', 'shoulders', 'core'], 'Barbell, Landmine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Chest focused landmine press'),
        ('Leaning Flyes', ARRAY['chest', 'front_delts'], 'Dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Chest isolation exercise'),
        ('Cross Body Rear Delt Cable', ARRAY['rear_delts', 'rhomboids'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Rear deltoid isolation'),
        ('Shoulder Y', ARRAY['shoulders', 'traps'], 'Dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Shoulder stability exercise')
) AS exercise_data(name, muscle_groups, equipment, exercise_category, exercise_type, default_value_1_type, default_value_2_type, notes)
WHERE t.name = 'Default Gym'
AND NOT EXISTS (
    SELECT 1 FROM exercises e2 
    WHERE e2.name = exercise_data.name 
    AND e2.tenant_id = t.tenant_id
);

COMMIT;

-- Show final exercise summary
SELECT 
    'FINAL SUMMARY' as status,
    exercise_category as category,
    COUNT(*) as count
FROM exercises e
JOIN tenants t ON e.tenant_id = t.tenant_id
WHERE t.name = 'Default Gym'
GROUP BY exercise_category

UNION ALL

SELECT 
    'TOTAL EXERCISES' as status,
    'All Categories' as category,
    COUNT(*) as count
FROM exercises e
JOIN tenants t ON e.tenant_id = t.tenant_id
WHERE t.name = 'Default Gym'

ORDER BY status, category;