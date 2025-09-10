-- Create default tenant and exercise seed data
BEGIN;

-- First, create a default tenant
INSERT INTO tenants (name, domain) 
VALUES ('Default Gym', 'default.rythm.app')
ON CONFLICT (domain) DO NOTHING;

-- Get the tenant_id for our default tenant
SET @tenant_id = (SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app');

-- Insert exercises with proper categorization and muscle groups
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
) VALUES 
    -- Lower Body Strength
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Box Jump', ARRAY['legs', 'glutes', 'calves'], 'Box', 'strength', 'STRENGTH', 'reps', NULL, 'Explosive lower body power exercise'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Back Squat', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'Barbell, Squat Rack', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Compound lower body strength exercise'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Deadlift', ARRAY['hamstrings', 'glutes', 'lower_back', 'traps'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body compound movement'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Bulgarian Split Squat', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'Dumbbells, Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral leg strength exercise'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Leg Extensions', ARRAY['quadriceps'], 'Leg Extension Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated quadriceps exercise'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Leg Curl', ARRAY['hamstrings'], 'Leg Curl Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated hamstring exercise'),

    -- Upper Body Push
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Bench Press', ARRAY['chest', 'triceps', 'shoulders'], 'Barbell, Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Compound chest exercise'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Incline Dumbbell Press', ARRAY['chest', 'shoulders', 'triceps'], 'Dumbbells, Incline Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper chest focused press'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Push-ups', ARRAY['chest', 'triceps', 'shoulders'], 'Bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Bodyweight pushing exercise'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Standing Overhead Press', ARRAY['shoulders', 'triceps', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body overhead pressing'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Seated Z-press', ARRAY['shoulders', 'triceps', 'core'], 'Barbell, Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Strict overhead press variation'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Landmine Press', ARRAY['shoulders', 'chest', 'core'], 'Barbell, Landmine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral pressing movement'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Landmine Chest Press', ARRAY['chest', 'shoulders', 'core'], 'Barbell, Landmine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Chest focused landmine press'),

    -- Upper Body Pull
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Lat Pull Down Wide', ARRAY['lats', 'rhomboids', 'biceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Wide grip lat pulldown'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Lat Pull Down Narrow', ARRAY['lats', 'rhomboids', 'biceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Narrow grip lat pulldown'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Seated Row', ARRAY['rhomboids', 'mid_traps', 'biceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Horizontal pulling exercise'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Ring Rows', ARRAY['rhomboids', 'lats', 'biceps'], 'Gymnastic Rings', 'strength', 'STRENGTH', 'reps', NULL, 'Bodyweight horizontal pull'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Seated Trap Pull', ARRAY['traps', 'rhomboids', 'rear_delts'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper trap focused exercise'),

    -- Arms
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Dumbbell Biceps Curl', ARRAY['biceps'], 'Dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated biceps exercise'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Cable Triceps Push', ARRAY['triceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated triceps exercise'),

    -- Core & Posterior Chain
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'GHD Back', ARRAY['lower_back', 'glutes', 'hamstrings'], 'GHD Machine', 'strength', 'STRENGTH', 'reps', NULL, 'Posterior chain strengthening'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'GHD Situps', ARRAY['abs', 'hip_flexors'], 'GHD Machine', 'strength', 'STRENGTH', 'reps', NULL, 'Core strengthening exercise'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Pallof Press', ARRAY['core', 'obliques'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Anti-rotation core exercise'),

    -- Cardio Equipment
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Run', ARRAY['legs', 'glutes', 'calves'], 'None', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Running for cardiovascular fitness'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Echo Bike', ARRAY['legs', 'arms', 'core'], 'Echo Bike', 'cardio', 'CARDIO', 'calories', 'duration_s', 'Full body cardio exercise'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Ski-erg', ARRAY['lats', 'core', 'legs'], 'Ski Erg Machine', 'cardio', 'CARDIO', 'calories', 'duration_s', 'Full body pulling cardio'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Row', ARRAY['lats', 'rhomboids', 'legs'], 'Rowing Machine', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Full body rowing exercise'),

    -- Functional/CrossFit Style
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Sled Push', ARRAY['legs', 'glutes', 'core'], 'Weight Sled', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Functional pushing exercise'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Sled Pull', ARRAY['lats', 'rhomboids', 'legs'], 'Weight Sled', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Functional pulling exercise'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Farmers Carry', ARRAY['traps', 'forearms', 'core'], 'Dumbbells/Kettlebells', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Grip and core strength'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Wall-balls', ARRAY['legs', 'shoulders', 'core'], 'Medicine Ball', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body explosive exercise'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Med-ball Chest Pass', ARRAY['chest', 'shoulders', 'core'], 'Medicine Ball', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive chest exercise'),

    -- Rehabilitation/Accessory
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Banded Y,T,W', ARRAY['rear_delts', 'rhomboids', 'mid_traps'], 'Resistance Bands', 'strength', 'STRENGTH', 'reps', NULL, 'Shoulder rehabilitation exercise'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Leaning Flyes', ARRAY['chest', 'front_delts'], 'Dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Chest isolation exercise'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Cross Body Rear Delt Cable', ARRAY['rear_delts', 'rhomboids'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Rear deltoid isolation'),
    ((SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app'), 'Shoulder Y', ARRAY['shoulders', 'traps'], 'Dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Shoulder stability exercise');

COMMIT;

-- Display summary of what was inserted
SELECT 
    'TENANT CREATED' as status,
    name as tenant_name,
    domain as tenant_domain,
    tenant_id
FROM tenants 
WHERE domain = 'default.rythm.app'

UNION ALL

SELECT 
    'EXERCISES ADDED' as status,
    COUNT(*)::text as tenant_name,
    exercise_category as tenant_domain,
    NULL as tenant_id
FROM exercises 
WHERE tenant_id = (SELECT tenant_id FROM tenants WHERE domain = 'default.rythm.app')
GROUP BY exercise_category
ORDER BY status DESC;