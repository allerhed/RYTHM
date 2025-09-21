-- Exercise Templates Population Script
-- This script populates the database with 98 comprehensive exercise templates
-- Use this for existing databases that need exercise templates added
-- 
-- Usage:
-- psql -h <host> -U <user> -d <database> -f scripts/populate-exercise-templates.sql

-- Clear existing exercise templates (optional - remove if you want to keep existing ones)
-- DELETE FROM exercise_templates;

-- Insert comprehensive exercise template library (98 templates)
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

-- ============================================
-- STRENGTH TRAINING TEMPLATES (68 templates)
-- ============================================

-- COMPOUND STRENGTH MOVEMENTS
('Barbell Back Squat', ARRAY['quadriceps', 'glutes', 'hamstrings', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Foundation movement for lower body strength and power', 'Feet shoulder-width apart, bar on upper traps, descend until thighs parallel, drive through heels'),
('Conventional Deadlift', ARRAY['hamstrings', 'glutes', 'back', 'traps', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Total body strength builder, essential for hybrid athletes', 'Feet hip-width apart, grip bar outside legs, lift by extending hips and knees simultaneously'),
('Bench Press', ARRAY['chest', 'triceps', 'shoulders'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper body pressing strength for power transfer', 'Retract shoulder blades, lower bar to chest, press up explosively'),
('Overhead Press', ARRAY['shoulders', 'triceps', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Vertical pressing power for athletic performance', 'Start at shoulder height, press overhead without arching back excessively'),
('Pull-ups', ARRAY['lats', 'rhomboids', 'biceps', 'rear delts'], 'pull-up bar', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper body pulling strength and grip endurance', 'Dead hang start, pull until chin over bar, control descent'),

-- FUNCTIONAL STRENGTH
('Front Squat', ARRAY['quadriceps', 'glutes', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Builds anterior core strength and upright posture', 'Bar rests on front delts, keep chest up, descend and drive up'),
('Romanian Deadlift', ARRAY['hamstrings', 'glutes', 'back'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Hamstring and glute strength for running power', 'Slight knee bend, hinge at hips, feel stretch in hamstrings'),
('Single-Arm Dumbbell Row', ARRAY['lats', 'rhomboids', 'rear delts'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral pulling strength and core stability', 'One hand on bench, pull dumbbell to hip, squeeze shoulder blade'),
('Dumbbell Thrusters', ARRAY['full body'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body power and endurance exercise', 'Squat down, explosively stand and press dumbbells overhead'),
('Turkish Get-Up', ARRAY['core', 'shoulders', 'hips'], 'kettlebell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Total body stability and strength', 'Complex movement from lying to standing with weight overhead'),

-- OLYMPIC & POWER MOVEMENTS
('Power Clean', ARRAY['full body'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive power development for athletic performance', 'Explosive hip extension, pull bar to front rack position'),
('Squat Clean', ARRAY['hamstrings', 'glutes', 'quadriceps', 'traps', 'shoulders'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full squat clean Olympic lift', 'Pull bar from floor to shoulders catching in full squat'),
('Power Snatch', ARRAY['hamstrings', 'glutes', 'traps', 'shoulders'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Power position snatch Olympic lift', 'Pull bar explosively from floor overhead in power position'),
('Squat Snatch', ARRAY['hamstrings', 'glutes', 'quadriceps', 'traps', 'shoulders'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full squat snatch Olympic lift', 'Pull bar from floor overhead catching in full squat'),
('Push Jerk', ARRAY['shoulders', 'triceps', 'legs', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive overhead pressing movement', 'Dip and drive bar overhead, press out from power position'),
('Split Jerk', ARRAY['shoulders', 'triceps', 'legs', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Split stance overhead jerk', 'Dip and drive bar overhead, catch in split stance'),
('Thruster', ARRAY['quadriceps', 'glutes', 'shoulders', 'triceps'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Front squat to overhead press combination', 'Front squat down then drive up pressing bar overhead'),

-- PLYOMETRIC & EXPLOSIVE
('Box Jumps', ARRAY['legs', 'glutes'], 'plyometric box', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Plyometric power for jumping and sprinting', 'Explosive jump onto box, soft landing, step down'),
('Box Jump Over', ARRAY['legs', 'glutes', 'calves'], 'box', 'strength', 'STRENGTH', 'reps', NULL, 'Box jump with step or jump over', 'Jump onto box, step or jump over to other side'),
('Medicine Ball Slams', ARRAY['core', 'shoulders'], 'medicine ball', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive power and core strength', 'Slam ball down with maximum force, pick up and repeat'),
('Wall Ball Shot', ARRAY['legs', 'shoulders', 'core'], 'medicine ball', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Squat to overhead throw against wall', 'Squat down, explode up throwing ball to wall target'),
('Kettlebell Swings', ARRAY['glutes', 'hamstrings', 'core'], 'kettlebell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Hip power and endurance bridge to cardio', 'Hip hinge movement, explosive hip extension, kettlebell to eye level'),
('Broad Jumps', ARRAY['legs', 'glutes'], 'bodyweight', 'strength', 'STRENGTH', 'distance_m', 'reps', 'Horizontal power development', 'Explosive forward jump, soft landing, measure distance'),

-- UNILATERAL STRENGTH
('Bulgarian Split Squats', ARRAY['quadriceps', 'glutes'], 'bodyweight', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Single leg strength and stability', 'Rear foot elevated, descend on front leg, drive up'),
('Single-Leg Deadlifts', ARRAY['hamstrings', 'glutes', 'core'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral posterior chain and balance', 'Hinge at hip on one leg, opposite leg extends back'),
('Walking Lunges', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Dynamic leg strength and stability', 'Step forward into lunge, drive up and step through'),
('Single-Arm Overhead Press', ARRAY['shoulders', 'core'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral pressing and anti-lateral flexion', 'Press one arm overhead while maintaining upright posture'),
('Pistol Squats', ARRAY['quadriceps', 'glutes', 'core'], 'bodyweight', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Advanced single leg strength', 'Squat on one leg, opposite leg extended forward'),

-- UPPER BODY PUSH
('Incline Dumbbell Press', ARRAY['chest', 'shoulders', 'triceps'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper chest focused press', 'Incline bench, press dumbbells up and together'),
('Push-ups', ARRAY['chest', 'triceps', 'shoulders'], 'bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Bodyweight pushing exercise', 'Plank position, lower chest to floor, push up'),
('Push Press', ARRAY['shoulders', 'triceps', 'legs', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Leg drive assisted overhead press', 'Slight dip and drive to assist press overhead'),
('Strict Press', ARRAY['shoulders', 'triceps', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Strict overhead barbell press', 'No leg drive, press bar overhead from shoulders'),
('Landmine Press', ARRAY['shoulders', 'chest', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral pressing movement', 'One arm press of landmine barbell'),

-- HANDSTAND VARIATIONS
('Strict Handstand Push-Up', ARRAY['shoulders', 'triceps', 'core'], 'wall', 'strength', 'STRENGTH', 'reps', NULL, 'Strict handstand push-up against wall', 'Handstand against wall, lower head to floor, press up'),
('Kipping Handstand Push-Up', ARRAY['shoulders', 'triceps', 'core'], 'wall', 'strength', 'STRENGTH', 'reps', NULL, 'Kipping handstand push-up with leg drive', 'Handstand with kip to assist pressing movement'),
('Handstand Walk', ARRAY['shoulders', 'core', 'wrists'], 'open space', 'strength', 'STRENGTH', 'distance_m', NULL, 'Walking on hands in handstand position', 'Kick to handstand, walk forward on hands'),

-- UPPER BODY PULL
('Lat Pull Down Wide', ARRAY['lats', 'rhomboids', 'biceps'], 'cable machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Wide grip lat pulldown', 'Wide grip, pull bar to chest, control return'),
('Lat Pull Down Narrow', ARRAY['lats', 'rhomboids', 'biceps'], 'cable machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Narrow grip lat pulldown', 'Close grip, pull bar to chest focusing on lats'),
('Seated Row', ARRAY['rhomboids', 'mid_traps', 'biceps'], 'cable machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Horizontal pulling exercise', 'Seated, pull handle to torso, squeeze shoulder blades'),
('Ring Rows', ARRAY['rhomboids', 'lats', 'biceps'], 'gymnastic rings', 'strength', 'STRENGTH', 'reps', NULL, 'Bodyweight horizontal pull', 'Hang from rings, pull chest to rings'),

-- PULL-UP VARIATIONS
('Strict Pull-Up', ARRAY['lats', 'rhomboids', 'biceps'], 'pull-up bar', 'strength', 'STRENGTH', 'reps', NULL, 'Dead hang strict pull-up', 'Dead hang, pull chin over bar without swinging'),
('Kipping Pull-Up', ARRAY['lats', 'rhomboids', 'core'], 'pull-up bar', 'strength', 'STRENGTH', 'reps', NULL, 'Dynamic kipping pull-up', 'Use body momentum to assist pull-up movement'),
('Butterfly Pull-Up', ARRAY['lats', 'rhomboids', 'core'], 'pull-up bar', 'strength', 'STRENGTH', 'reps', NULL, 'Continuous butterfly pull-up', 'Continuous cycling motion for high reps'),
('Chest-to-Bar Pull-Up', ARRAY['lats', 'rhomboids', 'biceps'], 'pull-up bar', 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up with chest touching bar', 'Pull high enough for chest to touch bar'),

-- MUSCLE-UP VARIATIONS
('Bar Muscle-Up', ARRAY['lats', 'chest', 'triceps', 'core'], 'pull-up bar', 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up to dip transition on bar', 'Pull-up transitioning to dip above bar'),
('Ring Muscle-Up', ARRAY['lats', 'chest', 'triceps', 'core'], 'gymnastic rings', 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up to dip transition on rings', 'Pull-up transitioning to dip above rings'),

-- DIP VARIATIONS
('Ring Dip', ARRAY['chest', 'triceps', 'shoulders'], 'gymnastic rings', 'strength', 'STRENGTH', 'reps', NULL, 'Dips performed on gymnastic rings', 'Support on rings, lower body, press up'),
('Bar Dip', ARRAY['chest', 'triceps', 'shoulders'], 'parallel bars', 'strength', 'STRENGTH', 'reps', NULL, 'Dips performed on parallel bars', 'Support on bars, lower body, press up'),

-- CORE STRENGTH
('Plank', ARRAY['core'], 'bodyweight', 'strength', 'STRENGTH', 'duration_m', 'reps', 'Isometric core strength and stability', 'Maintain straight line from head to heels'),
('Dead Bug', ARRAY['core'], 'bodyweight', 'strength', 'STRENGTH', 'reps', 'duration_m', 'Core stability and limb dissociation', 'Lying on back, extend opposite arm and leg slowly'),
('Pallof Press', ARRAY['core'], 'resistance band', 'strength', 'STRENGTH', 'reps', 'duration_m', 'Anti-rotation core strength', 'Hold band at chest, press out and resist rotation'),
('Hanging Leg Raises', ARRAY['core', 'hip flexors'], 'pull-up bar', 'strength', 'STRENGTH', 'reps', 'duration_m', 'Dynamic core strength', 'Hang from bar, raise legs to 90 degrees'),
('Bird Dog', ARRAY['core', 'glutes'], 'bodyweight', 'strength', 'STRENGTH', 'reps', 'duration_m', 'Core stability and hip strength', 'On hands and knees, extend opposite arm and leg'),
('GHD Back', ARRAY['lower_back', 'glutes', 'hamstrings'], 'GHD machine', 'strength', 'STRENGTH', 'reps', NULL, 'Posterior chain strengthening', 'GHD machine, extend back engaging posterior chain'),
('GHD Situps', ARRAY['abs', 'hip_flexors'], 'GHD machine', 'strength', 'STRENGTH', 'reps', NULL, 'Core strengthening exercise', 'GHD machine, full range sit-up movement'),
('Toes-to-Bar', ARRAY['abs', 'hip_flexors', 'lats'], 'pull-up bar', 'strength', 'STRENGTH', 'reps', NULL, 'Hanging toes to bar movement', 'Hang from bar, bring toes up to touch bar'),
('Sit-Up', ARRAY['abs', 'hip_flexors'], 'bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Traditional sit-up exercise', 'Lie down, sit up bringing torso to knees'),

-- FUNCTIONAL/CROSSFIT STYLE
('Sled Push', ARRAY['legs', 'glutes', 'core'], 'weight sled', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Functional pushing exercise', 'Push weighted sled forward with arms extended'),
('Sled Pull', ARRAY['lats', 'rhomboids', 'legs'], 'weight sled', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Functional pulling exercise', 'Pull weighted sled backward walking backwards'),
('Farmers Carry', ARRAY['traps', 'forearms', 'core'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Grip and core strength', 'Carry heavy weights at sides walking forward'),
('Rope Climb', ARRAY['lats', 'biceps', 'forearms', 'core'], 'climbing rope', 'strength', 'STRENGTH', 'distance_m', NULL, 'Rope climbing exercise', 'Climb rope using arms and legs to ascend'),

-- BURPEE VARIATIONS
('Burpee', ARRAY['chest', 'legs', 'core'], 'bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Full body burpee movement', 'Squat, jump back to plank, push-up, jump forward, jump up'),
('Bar-Facing Burpee', ARRAY['chest', 'legs', 'core'], 'barbell', 'strength', 'STRENGTH', 'reps', NULL, 'Burpee facing and jumping over barbell', 'Burpee next to bar, jump laterally over bar'),
('Lateral Burpee', ARRAY['chest', 'legs', 'core'], 'bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Burpee with lateral movement', 'Burpee moving laterally with each rep'),

-- ISOLATION & ACCESSORY
('Dumbbell Biceps Curl', ARRAY['biceps'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated biceps exercise', 'Standing, curl dumbbells toward shoulders'),
('Cable Triceps Push', ARRAY['triceps'], 'cable machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated triceps exercise', 'High cable, push down extending triceps'),
('Leg Extensions', ARRAY['quadriceps'], 'leg extension machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated quadriceps exercise', 'Sit on machine, extend legs against resistance'),
('Leg Curl', ARRAY['hamstrings'], 'leg curl machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated hamstring exercise', 'Lie prone, curl heels toward glutes'),

-- ============================================
-- CARDIO TRAINING TEMPLATES (30 templates)
-- ============================================

-- RUNNING VARIATIONS
('Easy Run', ARRAY['cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Aerobic base building for endurance', 'Conversational pace, nose breathing, relaxed effort'),
('Tempo Run', ARRAY['cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Lactate threshold training', 'Comfortably hard pace, sustainable for 20-60 minutes'),
('Interval Running', ARRAY['cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'High-intensity aerobic power', 'Alternating high and low intensity periods'),
('Hill Sprints', ARRAY['legs', 'cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'reps', 'Power endurance and lactate tolerance', 'Maximum effort uphill sprints with recovery'),
('Fartlek Run', ARRAY['cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Unstructured speed play training', 'Varying pace throughout run, play with speed'),
('Run', ARRAY['legs', 'glutes', 'calves'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Running for cardiovascular fitness', 'Outdoor or treadmill running at various paces'),

-- CYCLING VARIATIONS
('Zone 2 Cycling', ARRAY['legs', 'cardiovascular'], 'bicycle', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Aerobic base building on bike', 'Steady moderate effort, can maintain conversation'),
('Bike Intervals', ARRAY['legs', 'cardiovascular'], 'bicycle', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'High-intensity cycling power', 'Alternating high power and recovery periods'),
('Hill Cycling', ARRAY['legs', 'cardiovascular'], 'bicycle', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Climbing strength and endurance', 'Sustained efforts on inclines'),
('Spin Bike HIIT', ARRAY['legs', 'cardiovascular'], 'spin bike', 'cardio', 'CARDIO', 'duration_m', 'calories', 'High-intensity interval training', 'Short bursts of maximum effort with rest'),

-- SWIMMING
('Freestyle Swimming', ARRAY['full body', 'cardiovascular'], 'pool', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Low-impact full body cardio', 'Efficient stroke technique, bilateral breathing'),
('Swimming Intervals', ARRAY['full body', 'cardiovascular'], 'pool', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'High-intensity swim training', 'Alternating fast and recovery swimming'),

-- ROWING
('Steady State Rowing', ARRAY['back', 'legs', 'cardiovascular'], 'rowing machine', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Full body aerobic exercise', 'Consistent pace, proper technique: legs, back, arms'),
('Rowing Intervals', ARRAY['back', 'legs', 'cardiovascular'], 'rowing machine', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'High-intensity rowing power', 'Alternating high and low intensity periods'),
('Row', ARRAY['lats', 'rhomboids', 'legs'], 'rowing machine', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Full body rowing exercise', 'Rowing machine with proper drive and recovery'),

-- MACHINE CARDIO
('Echo Bike', ARRAY['legs', 'arms', 'core'], 'echo bike', 'cardio', 'CARDIO', 'calories', 'duration_m', 'Full body cardio exercise', 'Bike using both arms and legs for max calorie burn'),
('Ski-erg', ARRAY['lats', 'core', 'legs'], 'ski erg machine', 'cardio', 'CARDIO', 'calories', 'duration_m', 'Full body pulling cardio', 'Simulate skiing motion for cardio and upper body'),
('Assault Bike', ARRAY['full body', 'cardiovascular'], 'assault bike', 'cardio', 'CARDIO', 'distance_m', 'calories', 'Full body cardio machine', 'Push and pull with arms while pedaling'),
('Ski Erg', ARRAY['full body', 'cardiovascular'], 'ski erg', 'cardio', 'CARDIO', 'distance_m', 'calories', 'Upper body dominant cardio', 'Pulling motion similar to skiing'),
('Stair Climber', ARRAY['legs', 'cardiovascular'], 'stair climber', 'cardio', 'CARDIO', 'duration_m', 'calories', 'Lower body cardio endurance', 'Maintain upright posture, avoid leaning on handles'),
('Elliptical', ARRAY['full body', 'cardiovascular'], 'elliptical', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Low-impact full body cardio', 'Smooth stride, use arms and legs'),

-- HIGH-INTENSITY CARDIO
('Mountain Climbers', ARRAY['core', 'cardiovascular'], 'bodyweight', 'cardio', 'CARDIO', 'reps', 'duration_m', 'Core strength and cardio endurance', 'Plank position, alternate bringing knees to chest rapidly'),
('High Knees', ARRAY['hip flexors', 'cardiovascular'], 'bodyweight', 'cardio', 'CARDIO', 'duration_m', 'reps', 'Dynamic cardio and leg turnover', 'Run in place, bring knees to chest level'),
('Battle Ropes', ARRAY['arms', 'core', 'cardiovascular'], 'battle ropes', 'cardio', 'CARDIO', 'duration_m', 'reps', 'Upper body cardio and power endurance', 'Alternate or simultaneous rope waves'),

-- JUMP ROPE
('Single-Under', ARRAY['calves', 'shoulders', 'forearms'], 'jump rope', 'cardio', 'CARDIO', 'reps', 'duration_m', 'Single jump rope revolution per jump', 'Jump rope with one rope revolution per jump'),
('Double-Under', ARRAY['calves', 'shoulders', 'forearms'], 'jump rope', 'cardio', 'CARDIO', 'reps', 'duration_m', 'Double jump rope revolution per jump', 'Jump rope with two rope revolutions per jump'),
('Jump Rope', ARRAY['calves', 'cardiovascular'], 'jump rope', 'cardio', 'CARDIO', 'duration_m', 'reps', 'Coordination and cardio endurance', 'Light bounces, stay on balls of feet, relaxed arms'),

-- RECOVERY/ACTIVE RECOVERY CARDIO
('Walking', ARRAY['cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Active recovery and base fitness', 'Brisk pace, focus on posture and breathing'),
('Easy Bike Ride', ARRAY['legs', 'cardiovascular'], 'bicycle', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Low-intensity recovery exercise', 'Gentle pace, enjoy the ride, active recovery'),
('Pool Walking', ARRAY['legs', 'cardiovascular'], 'pool', 'cardio', 'CARDIO', 'duration_m', 'distance_m', 'Low-impact recovery exercise', 'Walk in waist-deep water, resistance without impact')

ON CONFLICT (name) DO NOTHING;

-- Show summary of loaded templates
SELECT 
    'Exercise Templates Status' as status,
    exercise_type,
    exercise_category,
    COUNT(*) as count
FROM exercise_templates
GROUP BY exercise_type, exercise_category
ORDER BY exercise_type, exercise_category;

-- Show total count
SELECT 
    'TOTAL EXERCISE TEMPLATES' as status,
    COUNT(*) as total_count
FROM exercise_templates;

-- Final verification
DO $$
DECLARE
    template_count INTEGER;
    strength_count INTEGER;
    cardio_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count FROM exercise_templates;
    SELECT COUNT(*) INTO strength_count FROM exercise_templates WHERE exercise_type = 'STRENGTH';
    SELECT COUNT(*) INTO cardio_count FROM exercise_templates WHERE exercise_type = 'CARDIO';
    
    RAISE NOTICE '📊 Exercise Templates Summary:';
    RAISE NOTICE '  Total Templates: %', template_count;
    RAISE NOTICE '  Strength: %', strength_count;
    RAISE NOTICE '  Cardio: %', cardio_count;
    
    IF template_count >= 98 THEN
        RAISE NOTICE '✅ Exercise templates populated successfully!';
    ELSE
        RAISE NOTICE '⚠️  Expected at least 98 templates, found %', template_count;
    END IF;
END $$;