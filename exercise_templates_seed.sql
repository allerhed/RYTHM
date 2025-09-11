-- Comprehensive Exercise Templates Seed Data
-- Populate exercise_templates table for user selection
BEGIN;

-- Insert all exercise templates (these are the ones users see in the modal)
INSERT INTO exercise_templates (
    name, 
    muscle_groups, 
    equipment, 
    exercise_category, 
    exercise_type, 
    default_value_1_type, 
    default_value_2_type,
    description,
    instructions
) VALUES
        -- STRENGTH TRAINING TEMPLATES --
        
        -- Lower Body Strength
        ('Box Jump', ARRAY['legs', 'glutes', 'calves'], 'Box', 'strength', 'STRENGTH', 'reps', NULL, 'Explosive lower body power exercise', 'Stand in front of box, jump onto it with both feet, step back down'),
        ('Back Squat', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'Barbell, Squat Rack', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Compound lower body strength exercise', 'Bar on back, feet shoulder width, squat down keeping chest up'),
        ('Front Squat', ARRAY['quadriceps', 'glutes', 'core', 'shoulders'], 'Barbell, Squat Rack', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Front-loaded squat variation with increased core demand', 'Bar across front shoulders, elbows high, squat down maintaining upright torso'),
        ('Overhead Squat', ARRAY['quadriceps', 'glutes', 'shoulders', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body mobility and strength exercise', 'Hold barbell overhead with wide grip, squat while keeping bar overhead'),
        ('Deadlift', ARRAY['hamstrings', 'glutes', 'lower_back', 'traps'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body compound movement', 'Hinge at hips, keep bar close to body, drive through heels'),
        ('Sumo Deadlift High Pull', ARRAY['hamstrings', 'glutes', 'traps', 'rhomboids'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Wide stance deadlift with high pull', 'Wide stance, pull bar from floor to chest level'),
        ('Bulgarian Split Squat', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'Dumbbells, Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral leg strength exercise', 'Rear foot elevated, lunge down on front leg'),
        ('Leg Extensions', ARRAY['quadriceps'], 'Leg Extension Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated quadriceps exercise', 'Sit on machine, extend legs against resistance'),
        ('Leg Curl', ARRAY['hamstrings'], 'Leg Curl Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated hamstring exercise', 'Lie prone, curl heels toward glutes'),

        -- Olympic Lifting
        ('Power Clean', ARRAY['hamstrings', 'glutes', 'traps', 'shoulders'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive Olympic lift variation', 'Pull bar explosively from floor to shoulders in power position'),
        ('Squat Clean', ARRAY['hamstrings', 'glutes', 'quadriceps', 'traps', 'shoulders'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full squat clean Olympic lift', 'Pull bar from floor to shoulders catching in full squat'),
        ('Power Snatch', ARRAY['hamstrings', 'glutes', 'traps', 'shoulders'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Power position snatch Olympic lift', 'Pull bar explosively from floor overhead in power position'),
        ('Squat Snatch', ARRAY['hamstrings', 'glutes', 'quadriceps', 'traps', 'shoulders'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full squat snatch Olympic lift', 'Pull bar from floor overhead catching in full squat'),
        ('Push Jerk', ARRAY['shoulders', 'triceps', 'legs', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive overhead pressing movement', 'Dip and drive bar overhead, press out from power position'),
        ('Split Jerk', ARRAY['shoulders', 'triceps', 'legs', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Split stance overhead jerk', 'Dip and drive bar overhead, catch in split stance'),
        ('Thruster', ARRAY['quadriceps', 'glutes', 'shoulders', 'triceps'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Front squat to overhead press combination', 'Front squat down then drive up pressing bar overhead'),

        -- Upper Body Push
        ('Bench Press', ARRAY['chest', 'triceps', 'shoulders'], 'Barbell, Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Compound chest exercise', 'Lie on bench, lower bar to chest, press up'),
        ('Incline Dumbbell Press', ARRAY['chest', 'shoulders', 'triceps'], 'Dumbbells, Incline Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper chest focused press', 'Incline bench, press dumbbells up and together'),
        ('Push-ups', ARRAY['chest', 'triceps', 'shoulders'], 'Bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Bodyweight pushing exercise', 'Plank position, lower chest to floor, push up'),
        ('Standing Overhead Press', ARRAY['shoulders', 'triceps', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body overhead pressing', 'Standing, press barbell from shoulders overhead'),
        ('Strict Press', ARRAY['shoulders', 'triceps', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Strict overhead barbell press', 'No leg drive, press bar overhead from shoulders'),
        ('Push Press', ARRAY['shoulders', 'triceps', 'legs', 'core'], 'Barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Leg drive assisted overhead press', 'Slight dip and drive to assist press overhead'),
        ('Seated Z-press', ARRAY['shoulders', 'triceps', 'core'], 'Barbell, Bench', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Strict overhead press variation', 'Seated on floor, legs extended, press bar overhead'),
        ('Landmine Press', ARRAY['shoulders', 'chest', 'core'], 'Barbell, Landmine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral pressing movement', 'One arm press of landmine barbell'),
        ('Landmine Chest Press', ARRAY['chest', 'shoulders', 'core'], 'Barbell, Landmine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Chest focused landmine press', 'Both hands press landmine barbell from chest'),

        -- Handstand Variations
        ('Strict Handstand Push-Up', ARRAY['shoulders', 'triceps', 'core'], 'Wall', 'strength', 'STRENGTH', 'reps', NULL, 'Strict handstand push-up against wall', 'Handstand against wall, lower head to floor, press up'),
        ('Kipping Handstand Push-Up', ARRAY['shoulders', 'triceps', 'core'], 'Wall', 'strength', 'STRENGTH', 'reps', NULL, 'Kipping handstand push-up with leg drive', 'Handstand with kip to assist pressing movement'),
        ('Handstand Walk', ARRAY['shoulders', 'core', 'wrists'], 'Open Space', 'strength', 'STRENGTH', 'distance_m', NULL, 'Walking on hands in handstand position', 'Kick to handstand, walk forward on hands'),

        -- Upper Body Pull
        ('Lat Pull Down Wide', ARRAY['lats', 'rhomboids', 'biceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Wide grip lat pulldown', 'Wide grip, pull bar to chest, control return'),
        ('Lat Pull Down Narrow', ARRAY['lats', 'rhomboids', 'biceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Narrow grip lat pulldown', 'Close grip, pull bar to chest focusing on lats'),
        ('Seated Row', ARRAY['rhomboids', 'mid_traps', 'biceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Horizontal pulling exercise', 'Seated, pull handle to torso, squeeze shoulder blades'),
        ('Ring Rows', ARRAY['rhomboids', 'lats', 'biceps'], 'Gymnastic Rings', 'strength', 'STRENGTH', 'reps', NULL, 'Bodyweight horizontal pull', 'Hang from rings, pull chest to rings'),
        ('Seated Trap Pull', ARRAY['traps', 'rhomboids', 'rear_delts'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper trap focused exercise', 'High cable pull focusing on upper traps'),

        -- Pull-Up Variations
        ('Strict Pull-Up', ARRAY['lats', 'rhomboids', 'biceps'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Dead hang strict pull-up', 'Dead hang, pull chin over bar without swinging'),
        ('Kipping Pull-Up', ARRAY['lats', 'rhomboids', 'core'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Dynamic kipping pull-up', 'Use body momentum to assist pull-up movement'),
        ('Butterfly Pull-Up', ARRAY['lats', 'rhomboids', 'core'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Continuous butterfly pull-up', 'Continuous cycling motion for high reps'),
        ('Chest-to-Bar Pull-Up', ARRAY['lats', 'rhomboids', 'biceps'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up with chest touching bar', 'Pull high enough for chest to touch bar'),

        -- Muscle-Up Variations
        ('Bar Muscle-Up', ARRAY['lats', 'chest', 'triceps', 'core'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up to dip transition on bar', 'Pull-up transitioning to dip above bar'),
        ('Ring Muscle-Up', ARRAY['lats', 'chest', 'triceps', 'core'], 'Gymnastic Rings', 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up to dip transition on rings', 'Pull-up transitioning to dip above rings'),

        -- Dip Variations
        ('Ring Dip', ARRAY['chest', 'triceps', 'shoulders'], 'Gymnastic Rings', 'strength', 'STRENGTH', 'reps', NULL, 'Dips performed on gymnastic rings', 'Support on rings, lower body, press up'),
        ('Bar Dip', ARRAY['chest', 'triceps', 'shoulders'], 'Parallel Bars', 'strength', 'STRENGTH', 'reps', NULL, 'Dips performed on parallel bars', 'Support on bars, lower body, press up'),

        -- Arms
        ('Dumbbell Biceps Curl', ARRAY['biceps'], 'Dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated biceps exercise', 'Standing, curl dumbbells toward shoulders'),
        ('Cable Triceps Push', ARRAY['triceps'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated triceps exercise', 'High cable, push down extending triceps'),

        -- Core & Posterior Chain
        ('GHD Back', ARRAY['lower_back', 'glutes', 'hamstrings'], 'GHD Machine', 'strength', 'STRENGTH', 'reps', NULL, 'Posterior chain strengthening', 'GHD machine, extend back engaging posterior chain'),
        ('GHD Situps', ARRAY['abs', 'hip_flexors'], 'GHD Machine', 'strength', 'STRENGTH', 'reps', NULL, 'Core strengthening exercise', 'GHD machine, full range sit-up movement'),
        ('Pallof Press', ARRAY['core', 'obliques'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Anti-rotation core exercise', 'Hold cable at chest, press out resisting rotation'),
        ('Toes-to-Bar', ARRAY['abs', 'hip_flexors', 'lats'], 'Pull-Up Bar', 'strength', 'STRENGTH', 'reps', NULL, 'Hanging toes to bar movement', 'Hang from bar, bring toes up to touch bar'),
        ('Sit-Up', ARRAY['abs', 'hip_flexors'], 'Bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Traditional sit-up exercise', 'Lie down, sit up bringing torso to knees'),

        -- Functional/CrossFit Style
        ('Sled Push', ARRAY['legs', 'glutes', 'core'], 'Weight Sled', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Functional pushing exercise', 'Push weighted sled forward with arms extended'),
        ('Sled Pull', ARRAY['lats', 'rhomboids', 'legs'], 'Weight Sled', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Functional pulling exercise', 'Pull weighted sled backward walking backwards'),
        ('Farmers Carry', ARRAY['traps', 'forearms', 'core'], 'Dumbbells/Kettlebells', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Grip and core strength', 'Carry heavy weights at sides walking forward'),
        ('Wall-balls', ARRAY['legs', 'shoulders', 'core'], 'Medicine Ball', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body explosive exercise', 'Squat holding med ball, throw to wall target'),
        ('Wall Ball Shot', ARRAY['legs', 'shoulders', 'core'], 'Medicine Ball, Wall', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Squat to overhead throw against wall', 'Squat down, explode up throwing ball to wall target'),
        ('Med-ball Chest Pass', ARRAY['chest', 'shoulders', 'core'], 'Medicine Ball', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive chest exercise', 'Pass medicine ball explosively from chest'),
        ('Rope Climb', ARRAY['lats', 'biceps', 'forearms', 'core'], 'Climbing Rope', 'strength', 'STRENGTH', 'distance_m', NULL, 'Rope climbing exercise', 'Climb rope using arms and legs to ascend'),
        ('Box Jump Over', ARRAY['legs', 'glutes', 'calves'], 'Box', 'strength', 'STRENGTH', 'reps', NULL, 'Box jump with step or jump over', 'Jump onto box, step or jump over to other side'),

        -- Burpee Variations
        ('Burpee', ARRAY['chest', 'legs', 'core'], 'Bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Full body burpee movement', 'Squat, jump back to plank, push-up, jump forward, jump up'),
        ('Bar-Facing Burpee', ARRAY['chest', 'legs', 'core'], 'Barbell', 'strength', 'STRENGTH', 'reps', NULL, 'Burpee facing and jumping over barbell', 'Burpee next to bar, jump laterally over bar'),
        ('Lateral Burpee', ARRAY['chest', 'legs', 'core'], 'Bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Burpee with lateral movement', 'Burpee moving laterally with each rep'),

        -- Rehabilitation/Accessory
        ('Banded Y,T,W', ARRAY['rear_delts', 'rhomboids', 'mid_traps'], 'Resistance Bands', 'strength', 'STRENGTH', 'reps', NULL, 'Shoulder rehabilitation exercise', 'Form Y, T, W shapes with arms using resistance bands'),
        ('Leaning Flyes', ARRAY['chest', 'front_delts'], 'Dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Chest isolation exercise', 'Lean forward, fly dumbbells out and together'),
        ('Cross Body Rear Delt Cable', ARRAY['rear_delts', 'rhomboids'], 'Cable Machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Rear deltoid isolation', 'Cable pulled across body targeting rear delts'),
        ('Shoulder Y', ARRAY['shoulders', 'traps'], 'Dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Shoulder stability exercise', 'Raise dumbbells in Y formation overhead'),

        -- CARDIO TEMPLATES --
        
        -- Running/Traditional Cardio
        ('Run', ARRAY['legs', 'glutes', 'calves'], 'None', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Running for cardiovascular fitness', 'Outdoor or treadmill running at various paces'),
        
        -- Machine Cardio
        ('Echo Bike', ARRAY['legs', 'arms', 'core'], 'Echo Bike', 'cardio', 'CARDIO', 'calories', 'duration_s', 'Full body cardio exercise', 'Bike using both arms and legs for max calorie burn'),
        ('Ski-erg', ARRAY['lats', 'core', 'legs'], 'Ski Erg Machine', 'cardio', 'CARDIO', 'calories', 'duration_s', 'Full body pulling cardio', 'Simulate skiing motion for cardio and upper body'),
        ('Row', ARRAY['lats', 'rhomboids', 'legs'], 'Rowing Machine', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Full body rowing exercise', 'Rowing machine with proper drive and recovery'),

        -- Jump Rope
        ('Single-Under', ARRAY['calves', 'shoulders', 'forearms'], 'Jump Rope', 'cardio', 'CARDIO', 'reps', 'duration_s', 'Single jump rope revolution per jump', 'Jump rope with one rope revolution per jump'),
        ('Double-Under', ARRAY['calves', 'shoulders', 'forearms'], 'Jump Rope', 'cardio', 'CARDIO', 'reps', 'duration_s', 'Double jump rope revolution per jump', 'Jump rope with two rope revolutions per jump');

-- Commit the transaction
COMMIT;

-- Display summary of inserted templates
SELECT 
    exercise_category,
    exercise_type,
    COUNT(*) as template_count
FROM exercise_templates
GROUP BY exercise_category, exercise_type
ORDER BY exercise_category, exercise_type;

-- Show total count
SELECT 
    'TOTAL TEMPLATES' as status,
    COUNT(*) as total_count
FROM exercise_templates;