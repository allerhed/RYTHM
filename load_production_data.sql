-- RYTHM Production Data Loader
-- Loads equipment and exercise templates into production database
-- Run date: $(date)

BEGIN;

-- ============================================
-- EQUIPMENT DATA
-- ============================================

-- Clear existing equipment and reload
DELETE FROM equipment;

-- Insert comprehensive equipment library
INSERT INTO equipment (name, category, description, is_active) VALUES
-- Free Weights
('Barbell', 'free_weights', 'Standard Olympic barbell for compound movements', true),
('Dumbbells', 'free_weights', 'Adjustable or fixed weight dumbbells', true),
('Kettlebell', 'free_weights', 'Cast iron kettlebells for dynamic movements', true),
('Medicine Ball', 'free_weights', 'Weighted balls for explosive training', true),
('Weight Plates', 'free_weights', 'Olympic and standard weight plates', true),
('EZ Curl Bar', 'free_weights', 'Curved barbell for arm exercises', true),

-- Machines
('Leg Extension Machine', 'machines', 'Isolated quadriceps strengthening machine', true),
('Leg Curl Machine', 'machines', 'Isolated hamstring strengthening machine', true),
('Leg Press Machine', 'machines', 'Seated leg pressing machine', true),
('Cable Machine', 'machines', 'Adjustable cable system for various exercises', true),
('Lat Pulldown Machine', 'machines', 'Seated lat pulldown with adjustable weight', true),
('Seated Row Machine', 'machines', 'Horizontal rowing machine', true),
('Smith Machine', 'machines', 'Guided barbell system with safety features', true),
('Chest Press Machine', 'machines', 'Seated chest pressing machine', true),
('Shoulder Press Machine', 'machines', 'Seated overhead pressing machine', true),
('Calf Raise Machine', 'machines', 'Standing or seated calf raise machine', true),
('GHD Machine', 'machines', 'Glute-Ham Developer for posterior chain', true),
('Preacher Curl Bench', 'machines', 'Angled bench for bicep curls', true),

-- Cardio Equipment
('Treadmill', 'cardio', 'Motorized running machine', true),
('Rowing Machine', 'cardio', 'Air or water resistance rowing ergometer', true),
('Exercise Bike', 'cardio', 'Stationary cycling machine', true),
('Elliptical Machine', 'cardio', 'Low-impact full body cardio machine', true),
('Stair Climber', 'cardio', 'Stair climbing cardio machine', true),
('Echo Bike', 'cardio', 'Air resistance bike for full body cardio', true),
('Assault Bike', 'cardio', 'Fan bike for high intensity intervals', true),
('Ski Erg', 'cardio', 'Upper body pulling cardio machine', true),
('VersaClimber', 'cardio', 'Vertical climbing cardio machine', true),

-- Bodyweight/Functional
('Pull-up Bar', 'bodyweight', 'Fixed or adjustable pull-up bar', true),
('Parallel Bars', 'bodyweight', 'Dip bars for upper body exercises', true),
('Gymnastic Rings', 'bodyweight', 'Suspension rings for advanced bodyweight training', true),
('TRX Suspension Trainer', 'bodyweight', 'Suspension trainer for bodyweight exercises', true),
('Plyometric Box', 'bodyweight', 'Jumping box for explosive training', true),
('Wall', 'bodyweight', 'Wall for wall-supported exercises', true),
('Floor/Mat', 'bodyweight', 'Exercise mat for floor exercises', true),

-- Resistance/Accessories
('Resistance Bands', 'resistance', 'Elastic bands for resistance training', true),
('Resistance Loops', 'resistance', 'Small loop bands for activation', true),
('Suspension Cables', 'resistance', 'Cable suspension systems', true),
('Chains', 'resistance', 'Weight chains for variable resistance', true),

-- Specialized Equipment
('Olympic Lifting Platform', 'other', 'Dedicated platform for Olympic lifts', true),
('Squat Rack', 'other', 'Power rack or squat stand', true),
('Bench Press Bench', 'other', 'Flat, incline, or decline bench', true),
('Incline Bench', 'other', 'Adjustable incline bench', true),
('Weight Sled', 'other', 'Weighted sled for pushing/pulling', true),
('Battle Ropes', 'other', 'Heavy ropes for conditioning', true),
('Foam Roller', 'other', 'Self-massage and recovery tool', true),
('Climbing Rope', 'other', 'Rope for climbing exercises', true),
('Agility Ladder', 'other', 'Ladder for footwork and agility drills', true),
('Cones', 'other', 'Training cones for agility and marking', true),
('Jump Rope', 'other', 'Rope for cardiovascular and coordination training', true),
('Landmine', 'other', 'Barbell attachment for angled exercises', true),
('Tire', 'other', 'Large tire for flipping and sledgehammer training', true),
('Sledgehammer', 'other', 'Heavy hammer for tire and conditioning work', true),

-- No Equipment
('None', 'bodyweight', 'No equipment required - bodyweight only', true);

-- ============================================
-- EXERCISE TEMPLATES DATA
-- ============================================

-- Clear existing templates and reload with complete set
DELETE FROM exercise_templates;

-- Insert comprehensive exercise template library
INSERT INTO exercise_templates (
    name, 
    muscle_groups, 
    equipment_id, 
    exercise_category, 
    exercise_type, 
    default_value_1_type, 
    default_value_2_type,
    description,
    instructions
) VALUES

-- ============================================
-- STRENGTH TRAINING TEMPLATES
-- ============================================

-- COMPOUND STRENGTH MOVEMENTS
('Barbell Back Squat', ARRAY['quadriceps', 'glutes', 'hamstrings', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Barbell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Foundation movement for lower body strength and power', 'Feet shoulder-width apart, bar on upper traps, descend until thighs parallel, drive through heels'),
('Conventional Deadlift', ARRAY['hamstrings', 'glutes', 'back', 'traps', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Barbell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Total body strength builder, essential for hybrid athletes', 'Feet hip-width apart, grip bar outside legs, lift by extending hips and knees simultaneously'),
('Bench Press', ARRAY['chest', 'triceps', 'shoulders'], (SELECT equipment_id FROM equipment WHERE name = 'Barbell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper body pressing strength for power transfer', 'Retract shoulder blades, lower bar to chest, press up explosively'),
('Overhead Press', ARRAY['shoulders', 'triceps', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Barbell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Vertical pressing power for athletic performance', 'Start at shoulder height, press overhead without arching back excessively'),
('Pull-ups', ARRAY['lats', 'rhomboids', 'biceps', 'rear delts'], (SELECT equipment_id FROM equipment WHERE name = 'Pull-up Bar'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper body pulling strength and grip endurance', 'Dead hang start, pull until chin over bar, control descent'),

-- FUNCTIONAL STRENGTH
('Front Squat', ARRAY['quadriceps', 'glutes', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Barbell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Builds anterior core strength and upright posture', 'Bar rests on front delts, keep chest up, descend and drive up'),
('Romanian Deadlift', ARRAY['hamstrings', 'glutes', 'back'], (SELECT equipment_id FROM equipment WHERE name = 'Barbell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Hamstring and glute strength for running power', 'Slight knee bend, hinge at hips, feel stretch in hamstrings'),
('Single-Arm Dumbbell Row', ARRAY['lats', 'rhomboids', 'rear delts'], (SELECT equipment_id FROM equipment WHERE name = 'Dumbbells'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral pulling strength and core stability', 'One hand on bench, pull dumbbell to hip, squeeze shoulder blade'),
('Dumbbell Thrusters', ARRAY['full body'], (SELECT equipment_id FROM equipment WHERE name = 'Dumbbells'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body power and endurance exercise', 'Squat down, explosively stand and press dumbbells overhead'),
('Turkish Get-Up', ARRAY['core', 'shoulders', 'hips'], (SELECT equipment_id FROM equipment WHERE name = 'Kettlebell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Total body stability and strength', 'Complex movement from lying to standing with weight overhead'),

-- OLYMPIC & POWER MOVEMENTS
('Power Clean', ARRAY['full body'], (SELECT equipment_id FROM equipment WHERE name = 'Barbell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive power development for athletic performance', 'Explosive hip extension, pull bar to front rack position'),
('Squat Clean', ARRAY['hamstrings', 'glutes', 'quadriceps', 'traps', 'shoulders'], (SELECT equipment_id FROM equipment WHERE name = 'Barbell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full squat clean Olympic lift', 'Pull bar from floor to shoulders catching in full squat'),
('Power Snatch', ARRAY['hamstrings', 'glutes', 'traps', 'shoulders'], (SELECT equipment_id FROM equipment WHERE name = 'Barbell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Power position snatch Olympic lift', 'Pull bar explosively from floor overhead in power position'),
('Squat Snatch', ARRAY['hamstrings', 'glutes', 'quadriceps', 'traps', 'shoulders'], (SELECT equipment_id FROM equipment WHERE name = 'Barbell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full squat snatch Olympic lift', 'Pull bar from floor overhead catching in full squat'),
('Push Jerk', ARRAY['shoulders', 'triceps', 'legs', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Barbell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive overhead pressing movement', 'Dip and drive bar overhead, press out from power position'),
('Split Jerk', ARRAY['shoulders', 'triceps', 'legs', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Barbell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Split stance overhead jerk', 'Dip and drive bar overhead, catch in split stance'),
('Thruster', ARRAY['quadriceps', 'glutes', 'shoulders', 'triceps'], (SELECT equipment_id FROM equipment WHERE name = 'Barbell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Front squat to overhead press combination', 'Front squat down then drive up pressing bar overhead'),

-- PLYOMETRIC & EXPLOSIVE
('Box Jumps', ARRAY['legs', 'glutes'], (SELECT equipment_id FROM equipment WHERE name = 'Plyometric Box'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Plyometric power for jumping and sprinting', 'Explosive jump onto box, soft landing, step down'),
('Box Jump Over', ARRAY['legs', 'glutes', 'calves'], (SELECT equipment_id FROM equipment WHERE name = 'Plyometric Box'), 'strength', 'STRENGTH', 'reps', NULL, 'Box jump with step or jump over', 'Jump onto box, step or jump over to other side'),
('Medicine Ball Slams', ARRAY['core', 'shoulders'], (SELECT equipment_id FROM equipment WHERE name = 'Medicine Ball'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive power and core strength', 'Slam ball down with maximum force, pick up and repeat'),
('Wall Ball Shot', ARRAY['legs', 'shoulders', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Medicine Ball'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Squat to overhead throw against wall', 'Squat down, explode up throwing ball to wall target'),
('Kettlebell Swings', ARRAY['glutes', 'hamstrings', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Kettlebell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Hip power and endurance bridge to cardio', 'Hip hinge movement, explosive hip extension, kettlebell to eye level'),
('Broad Jumps', ARRAY['legs', 'glutes'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'strength', 'STRENGTH', 'distance_m', 'reps', 'Horizontal power development', 'Explosive forward jump, soft landing, measure distance'),

-- UNILATERAL STRENGTH
('Bulgarian Split Squats', ARRAY['quadriceps', 'glutes'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Single leg strength and stability', 'Rear foot elevated, descend on front leg, drive up'),
('Single-Leg Deadlifts', ARRAY['hamstrings', 'glutes', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Dumbbells'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral posterior chain and balance', 'Hinge at hip on one leg, opposite leg extends back'),
('Walking Lunges', ARRAY['quadriceps', 'glutes', 'hamstrings'], (SELECT equipment_id FROM equipment WHERE name = 'Dumbbells'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Dynamic leg strength and stability', 'Step forward into lunge, drive up and step through'),
('Single-Arm Overhead Press', ARRAY['shoulders', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Dumbbells'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral pressing and anti-lateral flexion', 'Press one arm overhead while maintaining upright posture'),
('Pistol Squats', ARRAY['quadriceps', 'glutes', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Advanced single leg strength', 'Squat on one leg, opposite leg extended forward'),

-- UPPER BODY PUSH
('Incline Dumbbell Press', ARRAY['chest', 'shoulders', 'triceps'], (SELECT equipment_id FROM equipment WHERE name = 'Dumbbells'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper chest focused press', 'Incline bench, press dumbbells up and together'),
('Push-ups', ARRAY['chest', 'triceps', 'shoulders'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'strength', 'STRENGTH', 'reps', NULL, 'Bodyweight pushing exercise', 'Plank position, lower chest to floor, push up'),
('Push Press', ARRAY['shoulders', 'triceps', 'legs', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Barbell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Leg drive assisted overhead press', 'Slight dip and drive to assist press overhead'),
('Strict Press', ARRAY['shoulders', 'triceps', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Barbell'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Strict overhead barbell press', 'No leg drive, press bar overhead from shoulders'),
('Landmine Press', ARRAY['shoulders', 'chest', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Landmine'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral pressing movement', 'One arm press of landmine barbell'),

-- HANDSTAND VARIATIONS
('Strict Handstand Push-Up', ARRAY['shoulders', 'triceps', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Wall'), 'strength', 'STRENGTH', 'reps', NULL, 'Strict handstand push-up against wall', 'Handstand against wall, lower head to floor, press up'),
('Kipping Handstand Push-Up', ARRAY['shoulders', 'triceps', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Wall'), 'strength', 'STRENGTH', 'reps', NULL, 'Kipping handstand push-up with leg drive', 'Handstand with kip to assist pressing movement'),
('Handstand Walk', ARRAY['shoulders', 'core', 'wrists'], (SELECT equipment_id FROM equipment WHERE name = 'Floor/Mat'), 'strength', 'STRENGTH', 'distance_m', NULL, 'Walking on hands in handstand position', 'Kick to handstand, walk forward on hands'),

-- UPPER BODY PULL
('Lat Pull Down Wide', ARRAY['lats', 'rhomboids', 'biceps'], (SELECT equipment_id FROM equipment WHERE name = 'Cable Machine'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Wide grip lat pulldown', 'Wide grip, pull bar to chest, control return'),
('Lat Pull Down Narrow', ARRAY['lats', 'rhomboids', 'biceps'], (SELECT equipment_id FROM equipment WHERE name = 'Cable Machine'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Narrow grip lat pulldown', 'Close grip, pull bar to chest focusing on lats'),
('Seated Row', ARRAY['rhomboids', 'mid_traps', 'biceps'], (SELECT equipment_id FROM equipment WHERE name = 'Cable Machine'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Horizontal pulling exercise', 'Seated, pull handle to torso, squeeze shoulder blades'),
('Ring Rows', ARRAY['rhomboids', 'lats', 'biceps'], (SELECT equipment_id FROM equipment WHERE name = 'Gymnastic Rings'), 'strength', 'STRENGTH', 'reps', NULL, 'Bodyweight horizontal pull', 'Hang from rings, pull chest to rings'),

-- PULL-UP VARIATIONS
('Strict Pull-Up', ARRAY['lats', 'rhomboids', 'biceps'], (SELECT equipment_id FROM equipment WHERE name = 'Pull-up Bar'), 'strength', 'STRENGTH', 'reps', NULL, 'Dead hang strict pull-up', 'Dead hang, pull chin over bar without swinging'),
('Kipping Pull-Up', ARRAY['lats', 'rhomboids', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Pull-up Bar'), 'strength', 'STRENGTH', 'reps', NULL, 'Dynamic kipping pull-up', 'Use body momentum to assist pull-up movement'),
('Butterfly Pull-Up', ARRAY['lats', 'rhomboids', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Pull-up Bar'), 'strength', 'STRENGTH', 'reps', NULL, 'Continuous butterfly pull-up', 'Continuous cycling motion for high reps'),
('Chest-to-Bar Pull-Up', ARRAY['lats', 'rhomboids', 'biceps'], (SELECT equipment_id FROM equipment WHERE name = 'Pull-up Bar'), 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up with chest touching bar', 'Pull high enough for chest to touch bar'),

-- MUSCLE-UP VARIATIONS
('Bar Muscle-Up', ARRAY['lats', 'chest', 'triceps', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Pull-up Bar'), 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up to dip transition on bar', 'Pull-up transitioning to dip above bar'),
('Ring Muscle-Up', ARRAY['lats', 'chest', 'triceps', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Gymnastic Rings'), 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up to dip transition on rings', 'Pull-up transitioning to dip above rings'),

-- DIP VARIATIONS
('Ring Dip', ARRAY['chest', 'triceps', 'shoulders'], (SELECT equipment_id FROM equipment WHERE name = 'Gymnastic Rings'), 'strength', 'STRENGTH', 'reps', NULL, 'Dips performed on gymnastic rings', 'Support on rings, lower body, press up'),
('Bar Dip', ARRAY['chest', 'triceps', 'shoulders'], (SELECT equipment_id FROM equipment WHERE name = 'Parallel Bars'), 'strength', 'STRENGTH', 'reps', NULL, 'Dips performed on parallel bars', 'Support on bars, lower body, press up'),

-- CORE STRENGTH
('Plank', ARRAY['core'], (SELECT equipment_id FROM equipment WHERE name = 'Floor/Mat'), 'strength', 'STRENGTH', 'duration_s', 'reps', 'Isometric core strength and stability', 'Maintain straight line from head to heels'),
('Dead Bug', ARRAY['core'], (SELECT equipment_id FROM equipment WHERE name = 'Floor/Mat'), 'strength', 'STRENGTH', 'reps', 'duration_s', 'Core stability and limb dissociation', 'Lying on back, extend opposite arm and leg slowly'),
('Pallof Press', ARRAY['core'], (SELECT equipment_id FROM equipment WHERE name = 'Resistance Bands'), 'strength', 'STRENGTH', 'reps', 'duration_s', 'Anti-rotation core strength', 'Hold band at chest, press out and resist rotation'),
('Hanging Leg Raises', ARRAY['core', 'hip flexors'], (SELECT equipment_id FROM equipment WHERE name = 'Pull-up Bar'), 'strength', 'STRENGTH', 'reps', 'duration_s', 'Dynamic core strength', 'Hang from bar, raise legs to 90 degrees'),
('Bird Dog', ARRAY['core', 'glutes'], (SELECT equipment_id FROM equipment WHERE name = 'Floor/Mat'), 'strength', 'STRENGTH', 'reps', 'duration_s', 'Core stability and hip strength', 'On hands and knees, extend opposite arm and leg'),
('GHD Back', ARRAY['lower_back', 'glutes', 'hamstrings'], (SELECT equipment_id FROM equipment WHERE name = 'GHD Machine'), 'strength', 'STRENGTH', 'reps', NULL, 'Posterior chain strengthening', 'GHD machine, extend back engaging posterior chain'),
('GHD Situps', ARRAY['abs', 'hip_flexors'], (SELECT equipment_id FROM equipment WHERE name = 'GHD Machine'), 'strength', 'STRENGTH', 'reps', NULL, 'Core strengthening exercise', 'GHD machine, full range sit-up movement'),
('Toes-to-Bar', ARRAY['abs', 'hip_flexors', 'lats'], (SELECT equipment_id FROM equipment WHERE name = 'Pull-up Bar'), 'strength', 'STRENGTH', 'reps', NULL, 'Hanging toes to bar movement', 'Hang from bar, bring toes up to touch bar'),
('Sit-Up', ARRAY['abs', 'hip_flexors'], (SELECT equipment_id FROM equipment WHERE name = 'Floor/Mat'), 'strength', 'STRENGTH', 'reps', NULL, 'Traditional sit-up exercise', 'Lie down, sit up bringing torso to knees'),

-- FUNCTIONAL/CROSSFIT STYLE
('Sled Push', ARRAY['legs', 'glutes', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Weight Sled'), 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Functional pushing exercise', 'Push weighted sled forward with arms extended'),
('Sled Pull', ARRAY['lats', 'rhomboids', 'legs'], (SELECT equipment_id FROM equipment WHERE name = 'Weight Sled'), 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Functional pulling exercise', 'Pull weighted sled backward walking backwards'),
('Farmers Carry', ARRAY['traps', 'forearms', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Dumbbells'), 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Grip and core strength', 'Carry heavy weights at sides walking forward'),
('Rope Climb', ARRAY['lats', 'biceps', 'forearms', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Climbing Rope'), 'strength', 'STRENGTH', 'distance_m', NULL, 'Rope climbing exercise', 'Climb rope using arms and legs to ascend'),

-- BURPEE VARIATIONS
('Burpee', ARRAY['chest', 'legs', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'strength', 'STRENGTH', 'reps', NULL, 'Full body burpee movement', 'Squat, jump back to plank, push-up, jump forward, jump up'),
('Bar-Facing Burpee', ARRAY['chest', 'legs', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Barbell'), 'strength', 'STRENGTH', 'reps', NULL, 'Burpee facing and jumping over barbell', 'Burpee next to bar, jump laterally over bar'),
('Lateral Burpee', ARRAY['chest', 'legs', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'strength', 'STRENGTH', 'reps', NULL, 'Burpee with lateral movement', 'Burpee moving laterally with each rep'),

-- ISOLATION & ACCESSORY
('Dumbbell Biceps Curl', ARRAY['biceps'], (SELECT equipment_id FROM equipment WHERE name = 'Dumbbells'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated biceps exercise', 'Standing, curl dumbbells toward shoulders'),
('Cable Triceps Push', ARRAY['triceps'], (SELECT equipment_id FROM equipment WHERE name = 'Cable Machine'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated triceps exercise', 'High cable, push down extending triceps'),
('Leg Extensions', ARRAY['quadriceps'], (SELECT equipment_id FROM equipment WHERE name = 'Leg Extension Machine'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated quadriceps exercise', 'Sit on machine, extend legs against resistance'),
('Leg Curl', ARRAY['hamstrings'], (SELECT equipment_id FROM equipment WHERE name = 'Leg Curl Machine'), 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated hamstring exercise', 'Lie prone, curl heels toward glutes'),

-- ============================================
-- CARDIO TRAINING TEMPLATES
-- ============================================

-- RUNNING VARIATIONS
('Easy Run', ARRAY['cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Aerobic base building for endurance', 'Conversational pace, nose breathing, relaxed effort'),
('Tempo Run', ARRAY['cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Lactate threshold training', 'Comfortably hard pace, sustainable for 20-60 minutes'),
('Interval Running', ARRAY['cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'High-intensity aerobic power', 'Alternating high and low intensity periods'),
('Hill Sprints', ARRAY['legs', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'cardio', 'CARDIO', 'distance_m', 'reps', 'Power endurance and lactate tolerance', 'Maximum effort uphill sprints with recovery'),
('Fartlek Run', ARRAY['cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Unstructured speed play training', 'Varying pace throughout run, play with speed'),
('Run', ARRAY['legs', 'glutes', 'calves'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Running for cardiovascular fitness', 'Outdoor or treadmill running at various paces'),

-- CYCLING VARIATIONS
('Zone 2 Cycling', ARRAY['legs', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'Exercise Bike'), 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Aerobic base building on bike', 'Steady moderate effort, can maintain conversation'),
('Bike Intervals', ARRAY['legs', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'Exercise Bike'), 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'High-intensity cycling power', 'Alternating high power and recovery periods'),
('Hill Cycling', ARRAY['legs', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'Exercise Bike'), 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Climbing strength and endurance', 'Sustained efforts on inclines'),
('Spin Bike HIIT', ARRAY['legs', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'Exercise Bike'), 'cardio', 'CARDIO', 'duration_s', 'calories', 'High-intensity interval training', 'Short bursts of maximum effort with rest'),

-- SWIMMING
('Freestyle Swimming', ARRAY['full body', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Low-impact full body cardio', 'Efficient stroke technique, bilateral breathing'),
('Swimming Intervals', ARRAY['full body', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'High-intensity swim training', 'Alternating fast and recovery swimming'),

-- ROWING
('Steady State Rowing', ARRAY['back', 'legs', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'Rowing Machine'), 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Full body aerobic exercise', 'Consistent pace, proper technique: legs, back, arms'),
('Rowing Intervals', ARRAY['back', 'legs', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'Rowing Machine'), 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'High-intensity rowing power', 'Alternating high and low intensity periods'),
('Row', ARRAY['lats', 'rhomboids', 'legs'], (SELECT equipment_id FROM equipment WHERE name = 'Rowing Machine'), 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Full body rowing exercise', 'Rowing machine with proper drive and recovery'),

-- MACHINE CARDIO
('Echo Bike', ARRAY['legs', 'arms', 'core'], (SELECT equipment_id FROM equipment WHERE name = 'Echo Bike'), 'cardio', 'CARDIO', 'calories', 'duration_s', 'Full body cardio exercise', 'Bike using both arms and legs for max calorie burn'),
('Ski-erg', ARRAY['lats', 'core', 'legs'], (SELECT equipment_id FROM equipment WHERE name = 'Ski Erg'), 'cardio', 'CARDIO', 'calories', 'duration_s', 'Full body pulling cardio', 'Simulate skiing motion for cardio and upper body'),
('Assault Bike', ARRAY['full body', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'Assault Bike'), 'cardio', 'CARDIO', 'distance_m', 'calories', 'Full body cardio machine', 'Push and pull with arms while pedaling'),
('Ski Erg', ARRAY['full body', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'Ski Erg'), 'cardio', 'CARDIO', 'distance_m', 'calories', 'Upper body dominant cardio', 'Pulling motion similar to skiing'),
('Stair Climber', ARRAY['legs', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'Stair Climber'), 'cardio', 'CARDIO', 'duration_s', 'calories', 'Lower body cardio endurance', 'Maintain upright posture, avoid leaning on handles'),
('Elliptical', ARRAY['full body', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'Elliptical Machine'), 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Low-impact full body cardio', 'Smooth stride, use arms and legs'),

-- HIGH-INTENSITY CARDIO
('Mountain Climbers', ARRAY['core', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'Floor/Mat'), 'cardio', 'CARDIO', 'reps', 'duration_s', 'Core strength and cardio endurance', 'Plank position, alternate bringing knees to chest rapidly'),
('High Knees', ARRAY['hip flexors', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'cardio', 'CARDIO', 'duration_s', 'reps', 'Dynamic cardio and leg turnover', 'Run in place, bring knees to chest level'),
('Battle Ropes', ARRAY['arms', 'core', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'Battle Ropes'), 'cardio', 'CARDIO', 'duration_s', 'reps', 'Upper body cardio and power endurance', 'Alternate or simultaneous rope waves'),

-- JUMP ROPE
('Single-Under', ARRAY['calves', 'shoulders', 'forearms'], (SELECT equipment_id FROM equipment WHERE name = 'Jump Rope'), 'cardio', 'CARDIO', 'reps', 'duration_s', 'Single jump rope revolution per jump', 'Jump rope with one rope revolution per jump'),
('Double-Under', ARRAY['calves', 'shoulders', 'forearms'], (SELECT equipment_id FROM equipment WHERE name = 'Jump Rope'), 'cardio', 'CARDIO', 'reps', 'duration_s', 'Double jump rope revolution per jump', 'Jump rope with two rope revolutions per jump'),
('Jump Rope', ARRAY['calves', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'Jump Rope'), 'cardio', 'CARDIO', 'duration_s', 'reps', 'Coordination and cardio endurance', 'Light bounces, stay on balls of feet, relaxed arms'),

-- RECOVERY/ACTIVE RECOVERY CARDIO
('Walking', ARRAY['cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Active recovery and base fitness', 'Brisk pace, focus on posture and breathing'),
('Easy Bike Ride', ARRAY['legs', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'Exercise Bike'), 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Low-intensity recovery exercise', 'Gentle pace, enjoy the ride, active recovery'),
('Pool Walking', ARRAY['legs', 'cardiovascular'], (SELECT equipment_id FROM equipment WHERE name = 'None'), 'cardio', 'CARDIO', 'duration_s', 'distance_m', 'Low-impact recovery exercise', 'Walk in waist-deep water, resistance without impact');

COMMIT;

-- Show summary of loaded data
SELECT 
    'Equipment Categories' as data_type,
    category,
    COUNT(*) as count
FROM equipment
WHERE is_active = true
GROUP BY category
ORDER BY category;

SELECT 
    'Exercise Templates' as data_type,
    exercise_type,
    exercise_category,
    COUNT(*) as count
FROM exercise_templates
GROUP BY exercise_type, exercise_category
ORDER BY exercise_type, exercise_category;

-- Show total counts
SELECT 
    'EQUIPMENT TOTAL' as status,
    COUNT(*) as total_count
FROM equipment
WHERE is_active = true;

SELECT 
    'EXERCISE TEMPLATES TOTAL' as status,
    COUNT(*) as total_count
FROM exercise_templates;

-- Verification queries
SELECT 'Equipment with missing descriptions' as check_type, COUNT(*) as count 
FROM equipment WHERE description IS NULL OR description = '';

SELECT 'Exercise templates with missing equipment' as check_type, COUNT(*) as count 
FROM exercise_templates WHERE equipment_id IS NULL;

SELECT 'SUCCESS: Production data loading completed' as status, NOW() as completed_at;