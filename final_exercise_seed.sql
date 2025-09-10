-- Create default tenant and exercise seed data
BEGIN;

-- First, create a default tenant (check if it exists first)
INSERT INTO tenants (name) 
VALUES ('Default Gym')
ON CONFLICT DO NOTHING;

-- Insert exercises with proper categorization and muscle groups
-- Using a simple subquery to get the first tenant_id
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
        ('Back Squat', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'Barbell, Squat Rack', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Compound lower body strength exercise'),
        ('Deadlift', ARRAY['hamstrings', 'glutes', 'lower_back', 'traps'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body compound movement'),
        ('Bulgarian Split Squat', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'Dumbbells, Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral leg strength exercise'),
        ('Leg Extensions', ARRAY['quadriceps'], 'Leg Extension Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated quadriceps exercise'),
        ('Leg Curl', ARRAY['hamstrings'], 'Leg Curl Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated hamstring exercise'),

        -- Upper Body Push
        ('Bench Press', ARRAY['chest', 'triceps', 'shoulders'], 'Barbell, Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Compound chest exercise'),
        ('Incline Dumbbell Press', ARRAY['chest', 'shoulders', 'triceps'], 'Dumbbells, Incline Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper chest focused press'),
        ('Push-ups', ARRAY['chest', 'triceps', 'shoulders'], 'Bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Bodyweight pushing exercise'),
        ('Standing Overhead Press', ARRAY['shoulders', 'triceps', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body overhead pressing'),
        ('Seated Z-press', ARRAY['shoulders', 'triceps', 'core'], 'Barbell, Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Strict overhead press variation'),
        ('Landmine Press', ARRAY['shoulders', 'chest', 'core'], 'Barbell, Landmine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral pressing movement'),
        ('Landmine Chest Press', ARRAY['chest', 'shoulders', 'core'], 'Barbell, Landmine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Chest focused landmine press'),

        -- Upper Body Pull
        ('Lat Pull Down Wide', ARRAY['lats', 'rhomboids', 'biceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Wide grip lat pulldown'),
        ('Lat Pull Down Narrow', ARRAY['lats', 'rhomboids', 'biceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Narrow grip lat pulldown'),
        ('Seated Row', ARRAY['rhomboids', 'mid_traps', 'biceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Horizontal pulling exercise'),
        ('Ring Rows', ARRAY['rhomboids', 'lats', 'biceps'], 'Gymnastic Rings', 'strength', 'STRENGTH', 'reps', NULL, 'Bodyweight horizontal pull'),
        ('Seated Trap Pull', ARRAY['traps', 'rhomboids', 'rear_delts'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper trap focused exercise'),

        -- Arms
        ('Dumbbell Biceps Curl', ARRAY['biceps'], 'Dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated biceps exercise'),
        ('Cable Triceps Push', ARRAY['triceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated triceps exercise'),

        -- Core & Posterior Chain
        ('GHD Back', ARRAY['lower_back', 'glutes', 'hamstrings'], 'GHD Machine', 'strength', 'STRENGTH', 'reps', NULL, 'Posterior chain strengthening'),
        ('GHD Situps', ARRAY['abs', 'hip_flexors'], 'GHD Machine', 'strength', 'STRENGTH', 'reps', NULL, 'Core strengthening exercise'),
        ('Pallof Press', ARRAY['core', 'obliques'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Anti-rotation core exercise'),

        -- Cardio Equipment
        ('Run', ARRAY['legs', 'glutes', 'calves'], 'None', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Running for cardiovascular fitness'),
        ('Echo Bike', ARRAY['legs', 'arms', 'core'], 'Echo Bike', 'cardio', 'CARDIO', 'calories', 'duration_s', 'Full body cardio exercise'),
        ('Ski-erg', ARRAY['lats', 'core', 'legs'], 'Ski Erg Machine', 'cardio', 'CARDIO', 'calories', 'duration_s', 'Full body pulling cardio'),
        ('Row', ARRAY['lats', 'rhomboids', 'legs'], 'Rowing Machine', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Full body rowing exercise'),

        -- Functional/CrossFit Style
        ('Sled Push', ARRAY['legs', 'glutes', 'core'], 'Weight Sled', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Functional pushing exercise'),
        ('Sled Pull', ARRAY['lats', 'rhomboids', 'legs'], 'Weight Sled', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Functional pulling exercise'),
        ('Farmers Carry', ARRAY['traps', 'forearms', 'core'], 'Dumbbells/Kettlebells', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Grip and core strength'),
        ('Wall-balls', ARRAY['legs', 'shoulders', 'core'], 'Medicine Ball', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body explosive exercise'),
        ('Med-ball Chest Pass', ARRAY['chest', 'shoulders', 'core'], 'Medicine Ball', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive chest exercise'),

        -- Rehabilitation/Accessory
        ('Banded Y,T,W', ARRAY['rear_delts', 'rhomboids', 'mid_traps'], 'Resistance Bands', 'strength', 'STRENGTH', 'reps', NULL, 'Shoulder rehabilitation exercise'),
        ('Leaning Flyes', ARRAY['chest', 'front_delts'], 'Dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Chest isolation exercise'),
        ('Cross Body Rear Delt Cable', ARRAY['rear_delts', 'rhomboids'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Rear deltoid isolation'),
        ('Shoulder Y', ARRAY['shoulders', 'traps'], 'Dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Shoulder stability exercise')
) AS exercise_data(name, muscle_groups, equipment, exercise_category, exercise_type, default_value_1_type, default_value_2_type, notes)
WHERE t.name = 'Default Gym';

COMMIT;

-- Display summary of what was inserted
SELECT 
    'SUCCESS: Tenant Created' as status,
    name as details,
    tenant_id::text as count
FROM tenants 
WHERE name = 'Default Gym'

UNION ALL

SELECT 
    'SUCCESS: Exercises Added by Category' as status,
    exercise_category as details,
    COUNT(*)::text as count
FROM exercises e
JOIN tenants t ON e.tenant_id = t.tenant_id
WHERE t.name = 'Default Gym'
GROUP BY exercise_category

UNION ALL

SELECT 
    'TOTAL EXERCISES ADDED' as status,
    'All Categories' as details,
    COUNT(*)::text as count
FROM exercises e
JOIN tenants t ON e.tenant_id = t.tenant_id
WHERE t.name = 'Default Gym'

ORDER BY status;