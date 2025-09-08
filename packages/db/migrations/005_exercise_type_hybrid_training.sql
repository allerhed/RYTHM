-- Migration: 005_exercise_type_hybrid_training.sql
-- Description: Add exercise_type column and populate with hybrid training exercises

-- Create exercise_type enum
CREATE TYPE exercise_type AS ENUM ('STRENGTH', 'CARDIO');

-- Add exercise_type column to exercise_templates table
ALTER TABLE exercise_templates 
ADD COLUMN exercise_type exercise_type;

-- Update existing exercise_templates with exercise_type based on exercise_category
UPDATE exercise_templates 
SET exercise_type = CASE 
    WHEN exercise_category IN ('strength', 'flexibility', 'sports') THEN 'STRENGTH'::exercise_type
    WHEN exercise_category = 'cardio' THEN 'CARDIO'::exercise_type
    ELSE 'STRENGTH'::exercise_type
END;

-- Make exercise_type NOT NULL after populating existing data
ALTER TABLE exercise_templates ALTER COLUMN exercise_type SET NOT NULL;

-- Add exercise_type to exercises table as well
ALTER TABLE exercises 
ADD COLUMN exercise_type exercise_type;

-- Update existing exercises
UPDATE exercises 
SET exercise_type = CASE 
    WHEN exercise_category IN ('strength', 'flexibility', 'sports') THEN 'STRENGTH'::exercise_type
    WHEN exercise_category = 'cardio' THEN 'CARDIO'::exercise_type
    ELSE 'STRENGTH'::exercise_type
END;

-- Clear existing exercise templates to replace with hybrid training focused exercises
DELETE FROM exercise_templates;

-- Insert comprehensive hybrid training exercise templates
INSERT INTO exercise_templates (name, muscle_groups, equipment, exercise_category, exercise_type, default_value_1_type, default_value_2_type, description, instructions) VALUES

-- STRENGTH EXERCISES FOR HYBRID TRAINING

-- Compound Strength Movements
('Barbell Back Squat', ARRAY['quadriceps', 'glutes', 'hamstrings', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Foundation movement for lower body strength and power', 'Feet shoulder-width apart, bar on upper traps, descend until thighs parallel, drive through heels'),
('Conventional Deadlift', ARRAY['hamstrings', 'glutes', 'back', 'traps', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Total body strength builder, essential for hybrid athletes', 'Feet hip-width apart, grip bar outside legs, lift by extending hips and knees simultaneously'),
('Bench Press', ARRAY['chest', 'triceps', 'shoulders'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper body pressing strength for power transfer', 'Retract shoulder blades, lower bar to chest, press up explosively'),
('Overhead Press', ARRAY['shoulders', 'triceps', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Vertical pressing power for athletic performance', 'Start at shoulder height, press overhead without arching back excessively'),
('Pull-ups/Chin-ups', ARRAY['lats', 'rhomboids', 'biceps', 'rear delts'], 'pull-up bar', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper body pulling strength and grip endurance', 'Dead hang start, pull until chin over bar, control descent'),

-- Functional Strength
('Front Squat', ARRAY['quadriceps', 'glutes', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Builds anterior core strength and upright posture', 'Bar rests on front delts, keep chest up, descend and drive up'),
('Romanian Deadlift', ARRAY['hamstrings', 'glutes', 'back'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Hamstring and glute strength for running power', 'Slight knee bend, hinge at hips, feel stretch in hamstrings'),
('Single-Arm Dumbbell Row', ARRAY['lats', 'rhomboids', 'rear delts'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral pulling strength and core stability', 'One hand on bench, pull dumbbell to hip, squeeze shoulder blade'),
('Dumbbell Thrusters', ARRAY['full body'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body power and endurance exercise', 'Squat down, explosively stand and press dumbbells overhead'),
('Turkish Get-Up', ARRAY['core', 'shoulders', 'hips'], 'kettlebell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Total body stability and strength', 'Complex movement from lying to standing with weight overhead'),

-- Power & Explosive Movements
('Power Clean', ARRAY['full body'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive power development for athletic performance', 'Explosive hip extension, pull bar to front rack position'),
('Box Jumps', ARRAY['legs', 'glutes'], 'plyometric box', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Plyometric power for jumping and sprinting', 'Explosive jump onto box, soft landing, step down'),
('Medicine Ball Slams', ARRAY['core', 'shoulders'], 'medicine ball', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive power and core strength', 'Slam ball down with maximum force, pick up and repeat'),
('Kettlebell Swings', ARRAY['glutes', 'hamstrings', 'core'], 'kettlebell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Hip power and endurance bridge to cardio', 'Hip hinge movement, explosive hip extension, kettlebell to eye level'),
('Broad Jumps', ARRAY['legs', 'glutes'], 'bodyweight', 'strength', 'STRENGTH', 'distance_m', 'reps', 'Horizontal power development', 'Explosive forward jump, soft landing, measure distance'),

-- Unilateral Strength
('Bulgarian Split Squats', ARRAY['quadriceps', 'glutes'], 'bodyweight', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Single leg strength and stability', 'Rear foot elevated, descend on front leg, drive up'),
('Single-Leg Deadlifts', ARRAY['hamstrings', 'glutes', 'core'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral posterior chain and balance', 'Hinge at hip on one leg, opposite leg extends back'),
('Walking Lunges', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Dynamic leg strength and stability', 'Step forward into lunge, drive up and step through'),
('Single-Arm Overhead Press', ARRAY['shoulders', 'core'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral pressing and anti-lateral flexion', 'Press one arm overhead while maintaining upright posture'),
('Pistol Squats', ARRAY['quadriceps', 'glutes', 'core'], 'bodyweight', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Advanced single leg strength', 'Squat on one leg, opposite leg extended forward'),

-- Core Strength
('Plank', ARRAY['core'], 'bodyweight', 'strength', 'STRENGTH', 'duration_s', 'reps', 'Isometric core strength and stability', 'Maintain straight line from head to heels'),
('Dead Bug', ARRAY['core'], 'bodyweight', 'strength', 'STRENGTH', 'reps', 'duration_s', 'Core stability and limb dissociation', 'Lying on back, extend opposite arm and leg slowly'),
('Pallof Press', ARRAY['core'], 'resistance band', 'strength', 'STRENGTH', 'reps', 'duration_s', 'Anti-rotation core strength', 'Hold band at chest, press out and resist rotation'),
('Hanging Leg Raises', ARRAY['core', 'hip flexors'], 'pull-up bar', 'strength', 'STRENGTH', 'reps', 'duration_s', 'Dynamic core strength', 'Hang from bar, raise legs to 90 degrees'),
('Bird Dog', ARRAY['core', 'glutes'], 'bodyweight', 'strength', 'STRENGTH', 'reps', 'duration_s', 'Core stability and hip strength', 'On hands and knees, extend opposite arm and leg'),

-- CARDIO EXERCISES FOR HYBRID TRAINING

-- Running Variations
('Easy Run', ARRAY['cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Aerobic base building for endurance', 'Conversational pace, nose breathing, relaxed effort'),
('Tempo Run', ARRAY['cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Lactate threshold training', 'Comfortably hard pace, sustainable for 20-60 minutes'),
('Interval Running', ARRAY['cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'High-intensity aerobic power', 'Alternating high and low intensity periods'),
('Hill Sprints', ARRAY['legs', 'cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'reps', 'Power endurance and lactate tolerance', 'Maximum effort uphill sprints with recovery'),
('Fartlek Run', ARRAY['cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Unstructured speed play training', 'Varying pace throughout run, play with speed'),

-- Cycling Variations
('Zone 2 Cycling', ARRAY['legs', 'cardiovascular'], 'bicycle', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Aerobic base building on bike', 'Steady moderate effort, can maintain conversation'),
('Bike Intervals', ARRAY['legs', 'cardiovascular'], 'bicycle', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'High-intensity cycling power', 'Alternating high power and recovery periods'),
('Hill Cycling', ARRAY['legs', 'cardiovascular'], 'bicycle', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Climbing strength and endurance', 'Sustained efforts on inclines'),
('Spin Bike HIIT', ARRAY['legs', 'cardiovascular'], 'spin bike', 'cardio', 'CARDIO', 'duration_s', 'calories', 'High-intensity interval training', 'Short bursts of maximum effort with rest'),

-- Swimming
('Freestyle Swimming', ARRAY['full body', 'cardiovascular'], 'pool', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Low-impact full body cardio', 'Efficient stroke technique, bilateral breathing'),
('Swimming Intervals', ARRAY['full body', 'cardiovascular'], 'pool', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'High-intensity swim training', 'Alternating fast and recovery swimming'),

-- Rowing
('Steady State Rowing', ARRAY['back', 'legs', 'cardiovascular'], 'rowing machine', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Full body aerobic exercise', 'Consistent pace, proper technique: legs, back, arms'),
('Rowing Intervals', ARRAY['back', 'legs', 'cardiovascular'], 'rowing machine', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'High-intensity rowing power', 'Alternating high and low intensity periods'),

-- High-Intensity Cardio
('Burpees', ARRAY['full body', 'cardiovascular'], 'bodyweight', 'cardio', 'CARDIO', 'reps', 'duration_s', 'Full body conditioning exercise', 'Squat, jump back to plank, push-up, jump forward, explosive jump up'),
('Mountain Climbers', ARRAY['core', 'cardiovascular'], 'bodyweight', 'cardio', 'CARDIO', 'reps', 'duration_s', 'Core strength and cardio endurance', 'Plank position, alternate bringing knees to chest rapidly'),
('Jump Rope', ARRAY['calves', 'cardiovascular'], 'jump rope', 'cardio', 'CARDIO', 'duration_s', 'reps', 'Coordination and cardio endurance', 'Light bounces, stay on balls of feet, relaxed arms'),
('High Knees', ARRAY['hip flexors', 'cardiovascular'], 'bodyweight', 'cardio', 'CARDIO', 'duration_s', 'reps', 'Dynamic cardio and leg turnover', 'Run in place, bring knees to chest level'),
('Battle Ropes', ARRAY['arms', 'core', 'cardiovascular'], 'battle ropes', 'cardio', 'CARDIO', 'duration_s', 'reps', 'Upper body cardio and power endurance', 'Alternate or simultaneous rope waves'),

-- Hybrid/CrossFit Style
('Assault Bike', ARRAY['full body', 'cardiovascular'], 'assault bike', 'cardio', 'CARDIO', 'distance_m', 'calories', 'Full body cardio machine', 'Push and pull with arms while pedaling'),
('Ski Erg', ARRAY['full body', 'cardiovascular'], 'ski erg', 'cardio', 'CARDIO', 'distance_m', 'calories', 'Upper body dominant cardio', 'Pulling motion similar to skiing'),
('Stair Climber', ARRAY['legs', 'cardiovascular'], 'stair climber', 'cardio', 'CARDIO', 'duration_s', 'calories', 'Lower body cardio endurance', 'Maintain upright posture, avoid leaning on handles'),
('Elliptical', ARRAY['full body', 'cardiovascular'], 'elliptical', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Low-impact full body cardio', 'Smooth stride, use arms and legs'),

-- Recovery/Active Recovery Cardio
('Walking', ARRAY['cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Active recovery and base fitness', 'Brisk pace, focus on posture and breathing'),
('Easy Bike Ride', ARRAY['legs', 'cardiovascular'], 'bicycle', 'cardio', 'CARDIO', 'distance_m', 'duration_s', 'Low-intensity recovery exercise', 'Gentle pace, enjoy the ride, active recovery'),
('Pool Walking', ARRAY['legs', 'cardiovascular'], 'pool', 'cardio', 'CARDIO', 'duration_s', 'distance_m', 'Low-impact recovery exercise', 'Walk in waist-deep water, resistance without impact');

-- Add indexes for the new exercise_type column
CREATE INDEX idx_exercise_templates_type ON exercise_templates(exercise_type);
CREATE INDEX idx_exercises_type ON exercises(exercise_type);

-- Add index combining category and type for efficient queries
CREATE INDEX idx_exercise_templates_category_type ON exercise_templates(exercise_category, exercise_type);