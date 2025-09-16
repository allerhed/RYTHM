-- Comprehensive Exercise Seed Data - All exercises consolidated
-- Global exercise library (no tenant relationship)
BEGIN;

-- Insert all exercises with proper categorization and muscle groups
INSERT INTO exercises (
    name, 
    muscle_groups, 
    equipment, 
    exercise_category, 
    exercise_type, 
    default_value_1_type, 
    default_value_2_type,
    notes
) VALUES
-- STRENGTH TRAINING EXERCISES --
        
        -- Lower Body Strength
        ('Box Jump', ARRAY['legs', 'glutes', 'calves'], 'Box', 'strength', 'STRENGTH', 'reps', NULL, 'Explosive lower body power exercise'),
        ('Back Squat', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'Barbell, Squat Rack', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Compound lower body strength exercise'),
        ('Front Squat', ARRAY['quadriceps', 'glutes', 'core', 'shoulders'], 'Barbell, Squat Rack', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Front-loaded squat variation with increased core demand'),
        ('Overhead Squat', ARRAY['quadriceps', 'glutes', 'shoulders', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body mobility and strength exercise'),
        ('Deadlift', ARRAY['hamstrings', 'glutes', 'lower_back', 'traps'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body compound movement'),
        ('Sumo Deadlift High Pull', ARRAY['hamstrings', 'glutes', 'traps', 'rhomboids'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Wide stance deadlift with high pull'),
        ('Bulgarian Split Squat', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'Dumbbells, Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral leg strength exercise'),
        ('Leg Extensions', ARRAY['quadriceps'], 'Leg Extension Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated quadriceps exercise'),
        ('Leg Curl', ARRAY['hamstrings'], 'Leg Curl Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated hamstring exercise'),

        -- Olympic Lifting
        ('Power Clean', ARRAY['hamstrings', 'glutes', 'traps', 'shoulders'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive Olympic lift variation'),
        ('Squat Clean', ARRAY['hamstrings', 'glutes', 'quadriceps', 'traps', 'shoulders'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full squat clean Olympic lift'),
        ('Power Snatch', ARRAY['hamstrings', 'glutes', 'traps', 'shoulders'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Power position snatch Olympic lift'),
        ('Squat Snatch', ARRAY['hamstrings', 'glutes', 'quadriceps', 'traps', 'shoulders'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full squat snatch Olympic lift'),
        ('Push Jerk', ARRAY['shoulders', 'triceps', 'legs', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive overhead pressing movement'),
        ('Split Jerk', ARRAY['shoulders', 'triceps', 'legs', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Split stance overhead jerk'),
        ('Thruster', ARRAY['quadriceps', 'glutes', 'shoulders', 'triceps'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Front squat to overhead press combination'),

        -- Upper Body Push
        ('Bench Press', ARRAY['chest', 'triceps', 'shoulders'], 'Barbell, Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Compound chest exercise'),
        ('Incline Dumbbell Press', ARRAY['chest', 'shoulders', 'triceps'], 'Dumbbells, Incline Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper chest focused press'),
        ('Push-ups', ARRAY['chest', 'triceps', 'shoulders'], 'Bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Bodyweight pushing exercise'),
        ('Standing Overhead Press', ARRAY['shoulders', 'triceps', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body overhead pressing'),
        ('Strict Press', ARRAY['shoulders', 'triceps', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Strict overhead barbell press'),
        ('Push Press', ARRAY['shoulders', 'triceps', 'legs', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Leg drive assisted overhead press'),
        ('Seated Z-press', ARRAY['shoulders', 'triceps', 'core'], 'Barbell, Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Strict overhead press variation'),
        ('Landmine Press', ARRAY['shoulders', 'chest', 'core'], 'Barbell, Landmine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral pressing movement'),
        ('Landmine Chest Press', ARRAY['chest', 'shoulders', 'core'], 'Barbell, Landmine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Chest focused landmine press'),

        -- Handstand Variations
        ('Strict Handstand Push-Up', ARRAY['shoulders', 'triceps', 'core'], 'Wall', 'strength', 'STRENGTH', 'reps', NULL, 'Strict handstand push-up against wall'),
        ('Kipping Handstand Push-Up', ARRAY['shoulders', 'triceps', 'core'], 'Wall', 'strength', 'STRENGTH', 'reps', NULL, 'Kipping handstand push-up with leg drive'),
        ('Handstand Walk', ARRAY['shoulders', 'core', 'wrists'], 'Open Space', 'strength', 'STRENGTH', 'distance_m', NULL, 'Walking on hands in handstand position'),

        -- Upper Body Pull
        ('Lat Pull Down Wide', ARRAY['lats', 'rhomboids', 'biceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Wide grip lat pulldown'),
        ('Lat Pull Down Narrow', ARRAY['lats', 'rhomboids', 'biceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Narrow grip lat pulldown'),
        ('Seated Row', ARRAY['rhomboids', 'mid_traps', 'biceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Horizontal pulling exercise'),
        ('Ring Rows', ARRAY['rhomboids', 'lats', 'biceps'], 'Gymnastic Rings', 'strength', 'STRENGTH', 'reps', NULL, 'Bodyweight horizontal pull'),
        ('Seated Trap Pull', ARRAY['traps', 'rhomboids', 'rear_delts'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper trap focused exercise'),

        -- Pull-Up Variations
        ('Strict Pull-Up', ARRAY['lats', 'rhomboids', 'biceps'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Dead hang strict pull-up'),
        ('Kipping Pull-Up', ARRAY['lats', 'rhomboids', 'core'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Dynamic kipping pull-up'),
        ('Butterfly Pull-Up', ARRAY['lats', 'rhomboids', 'core'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Continuous butterfly pull-up'),
        ('Chest-to-Bar Pull-Up', ARRAY['lats', 'rhomboids', 'biceps'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up with chest touching bar'),

        -- Muscle-Up Variations
        ('Bar Muscle-Up', ARRAY['lats', 'chest', 'triceps', 'core'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up to dip transition on bar'),
        ('Ring Muscle-Up', ARRAY['lats', 'chest', 'triceps', 'core'], 'Gymnastic Rings', 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up to dip transition on rings'),

        -- Dip Variations
        ('Ring Dip', ARRAY['chest', 'triceps', 'shoulders'], 'Gymnastic Rings', 'strength', 'STRENGTH', 'reps', NULL, 'Dips performed on gymnastic rings'),
        ('Bar Dip', ARRAY['chest', 'triceps', 'shoulders'], 'Parallel Bars', 'strength', 'STRENGTH', 'reps', NULL, 'Dips performed on parallel bars'),

        -- Arms
        ('Dumbbell Biceps Curl', ARRAY['biceps'], 'Dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated biceps exercise'),
        ('Cable Triceps Push', ARRAY['triceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated triceps exercise'),

        -- Core & Posterior Chain
        ('GHD Back', ARRAY['lower_back', 'glutes', 'hamstrings'], 'GHD Machine', 'strength', 'STRENGTH', 'reps', NULL, 'Posterior chain strengthening'),
        ('GHD Situps', ARRAY['abs', 'hip_flexors'], 'GHD Machine', 'strength', 'STRENGTH', 'reps', NULL, 'Core strengthening exercise'),
        ('Pallof Press', ARRAY['core', 'obliques'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Anti-rotation core exercise'),
        ('Toes-to-Bar', ARRAY['abs', 'hip_flexors', 'lats'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Hanging toes to bar movement'),
        ('Sit-Up', ARRAY['abs', 'hip_flexors'], 'Bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Traditional sit-up exercise'),

        -- Functional/CrossFit Style
        ('Sled Push', ARRAY['legs', 'glutes', 'core'], 'Weight Sled', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Functional pushing exercise'),
        ('Sled Pull', ARRAY['lats', 'rhomboids', 'legs'], 'Weight Sled', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Functional pulling exercise'),
        ('Farmers Carry', ARRAY['traps', 'forearms', 'core'], 'Dumbbells/Kettlebells', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Grip and core strength'),
        ('Wall-balls', ARRAY['legs', 'shoulders', 'core'], 'Medicine Ball', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body explosive exercise'),
        ('Wall Ball Shot', ARRAY['legs', 'shoulders', 'core'], 'Medicine Ball, Wall', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Squat to overhead throw against wall'),
        ('Med-ball Chest Pass', ARRAY['chest', 'shoulders', 'core'], 'Medicine Ball', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive chest exercise'),
        ('Rope Climb', ARRAY['lats', 'biceps', 'forearms', 'core'], 'Climbing Rope', 'strength', 'STRENGTH', 'distance_m', NULL, 'Rope climbing exercise'),
        ('Box Jump Over', ARRAY['legs', 'glutes', 'calves'], 'Box', 'strength', 'STRENGTH', 'reps', NULL, 'Box jump with step or jump over'),

        -- Burpee Variations
        ('Burpee', ARRAY['chest', 'legs', 'core'], 'Bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Full body burpee movement'),
        ('Bar-Facing Burpee', ARRAY['chest', 'legs', 'core'], 'Barbell', 'strength', 'STRENGTH', 'reps', NULL, 'Burpee facing and jumping over barbell'),
        ('Lateral Burpee', ARRAY['chest', 'legs', 'core'], 'Bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Burpee with lateral movement'),

        -- Rehabilitation/Accessory
        ('Banded Y,T,W', ARRAY['rear_delts', 'rhomboids', 'mid_traps'], 'Resistance Bands', 'strength', 'STRENGTH', 'reps', NULL, 'Shoulder rehabilitation exercise'),
        ('Leaning Flyes', ARRAY['chest', 'front_delts'], 'Dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Chest isolation exercise'),
        ('Cross Body Rear Delt Cable', ARRAY['rear_delts', 'rhomboids'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Rear deltoid isolation'),
        ('Shoulder Y', ARRAY['shoulders', 'traps'], 'Dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Shoulder stability exercise'),

        -- CARDIO EXERCISES --
        
        -- Running/Traditional Cardio
        ('Run', ARRAY['legs', 'glutes', 'calves'], 'None', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Running for cardiovascular fitness'),
        
        -- Machine Cardio
        ('Echo Bike', ARRAY['legs', 'arms', 'core'], 'Echo Bike', 'cardio', 'CARDIO', 'calories', 'duration_s', 'Full body cardio exercise'),
        ('Ski-erg', ARRAY['lats', 'core', 'legs'], 'Ski Erg Machine', 'cardio', 'CARDIO', 'calories', 'duration_s', 'Full body pulling cardio'),
        ('Row', ARRAY['lats', 'rhomboids', 'legs'], 'Rowing Machine', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Full body rowing exercise'),

        -- Jump Rope
        ('Single-Under', ARRAY['calves', 'shoulders', 'forearms'], 'Jump Rope', 'cardio', 'CARDIO', 'reps', 'duration_s', 'Single jump rope revolution per jump'),
        ('Double-Under', ARRAY['calves', 'shoulders', 'forearms'], 'Jump Rope', 'cardio', 'CARDIO', 'reps', 'duration_s', 'Double jump rope revolution per jump')

ON CONFLICT (name) DO NOTHING;

-- Commit the transaction
COMMIT;

-- Display summary of inserted exercises
SELECT 
    exercise_category,
    COUNT(*) as exercise_count
FROM exercises
GROUP BY exercise_category
ORDER BY exercise_category;

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