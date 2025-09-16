-- Migration: 004_exercise_defaults.sql
-- Description: Add exercise default metrics and predefined exercises

-- Update set_value_type enum to include 'reps'
ALTER TYPE set_value_type ADD VALUE IF NOT EXISTS 'reps';

-- Add default metrics to exercises table
ALTER TABLE exercises 
ADD COLUMN default_value_1_type set_value_type,
ADD COLUMN default_value_2_type set_value_type,
ADD COLUMN exercise_category TEXT DEFAULT 'strength' CHECK (exercise_category IN ('strength', 'cardio', 'flexibility', 'sports')),
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Create exercise_templates table for predefined exercises
CREATE TABLE exercise_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    muscle_groups TEXT[] NOT NULL DEFAULT '{}',
    equipment TEXT,
    exercise_category TEXT DEFAULT 'strength' CHECK (exercise_category IN ('strength', 'cardio', 'flexibility', 'sports')),
    default_value_1_type set_value_type,
    default_value_2_type set_value_type,
    description TEXT,
    instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add trigger for exercise_templates
CREATE TRIGGER update_exercise_templates_updated_at 
BEFORE UPDATE ON exercise_templates 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add index on exercise templates
CREATE INDEX idx_exercise_templates_category ON exercise_templates(exercise_category);
CREATE INDEX idx_exercise_templates_name ON exercise_templates(name);

-- Insert predefined exercise templates
INSERT INTO exercise_templates (name, muscle_groups, equipment, exercise_category, default_value_1_type, default_value_2_type, description, instructions) VALUES

-- Strength exercises
('Bench Press', ARRAY['chest', 'triceps', 'shoulders'], 'barbell', 'strength', 'weight_kg', 'reps', 'Compound upper body exercise targeting chest, triceps, and shoulders', 'Lie on bench, grip bar slightly wider than shoulders, lower to chest, press up'),
('Squat', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'barbell', 'strength', 'weight_kg', 'reps', 'Fundamental lower body compound movement', 'Stand with feet shoulder-width apart, lower into squat keeping chest up, drive through heels'),
('Deadlift', ARRAY['hamstrings', 'glutes', 'back', 'traps'], 'barbell', 'strength', 'weight_kg', 'reps', 'Full body compound exercise focusing on posterior chain', 'Hinge at hips, keep bar close to body, drive hips forward to stand'),
('Pull-ups', ARRAY['lats', 'biceps', 'rear delts'], 'pull-up bar', 'strength', 'weight_kg', 'reps', 'Upper body pulling exercise', 'Hang from bar, pull body up until chin over bar, lower with control'),
('Push-ups', ARRAY['chest', 'triceps', 'shoulders'], 'bodyweight', 'strength', 'weight_kg', 'reps', 'Bodyweight pushing exercise', 'Start in plank, lower chest to ground, push back up'),
('Overhead Press', ARRAY['shoulders', 'triceps', 'core'], 'barbell', 'strength', 'weight_kg', 'reps', 'Vertical pressing movement', 'Press bar from shoulders overhead, keep core tight'),
('Barbell Row', ARRAY['lats', 'rhomboids', 'rear delts'], 'barbell', 'strength', 'weight_kg', 'reps', 'Horizontal pulling exercise', 'Hinge at hips, pull bar to lower chest, squeeze shoulder blades'),
('Dumbbell Bicep Curl', ARRAY['biceps'], 'dumbbells', 'strength', 'weight_kg', 'reps', 'Isolation exercise for biceps', 'Keep elbows at sides, curl weights up, squeeze at top'),
('Tricep Dips', ARRAY['triceps', 'chest'], 'bodyweight', 'strength', 'weight_kg', 'reps', 'Bodyweight tricep exercise', 'Lower body by bending elbows, push back up'),
('Lunges', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'bodyweight', 'strength', 'weight_kg', 'reps', 'Unilateral leg exercise', 'Step forward, lower back knee, push back to start'),

-- Cardio exercises
('Running', ARRAY['cardiovascular'], 'none', 'cardio', 'distance_m', 'duration_s', 'Aerobic endurance exercise', 'Maintain steady pace, focus on breathing'),
('Cycling', ARRAY['quadriceps', 'cardiovascular'], 'bicycle', 'cardio', 'distance_m', 'duration_s', 'Low-impact cardio exercise', 'Maintain cadence, adjust resistance as needed'),
('Rowing', ARRAY['back', 'legs', 'cardiovascular'], 'rowing machine', 'cardio', 'distance_m', 'duration_s', 'Full body cardio exercise', 'Drive with legs first, then lean back and pull'),
('Swimming', ARRAY['full body', 'cardiovascular'], 'pool', 'cardio', 'distance_m', 'duration_s', 'Low-impact full body exercise', 'Focus on technique and breathing'),
('Jump Rope', ARRAY['calves', 'cardiovascular'], 'jump rope', 'cardio', 'duration_s', 'calories', 'High-intensity cardio exercise', 'Light bounces, stay on balls of feet'),
('Burpees', ARRAY['full body', 'cardiovascular'], 'bodyweight', 'cardio', 'reps', 'duration_s', 'High-intensity bodyweight exercise', 'Squat, jump back to plank, push-up, jump forward, jump up'),
('Mountain Climbers', ARRAY['core', 'cardiovascular'], 'bodyweight', 'cardio', 'reps', 'duration_s', 'Core and cardio exercise', 'Start in plank, alternate bringing knees to chest'),
('High Knees', ARRAY['hip flexors', 'cardiovascular'], 'bodyweight', 'cardio', 'duration_s', 'reps', 'Dynamic warm-up and cardio', 'Run in place bringing knees to chest level'),

-- Flexibility exercises
('Hamstring Stretch', ARRAY['hamstrings'], 'none', 'flexibility', 'duration_s', NULL, 'Static stretch for hamstrings', 'Sit with one leg extended, reach toward toes, hold stretch'),
('Hip Flexor Stretch', ARRAY['hip flexors'], 'none', 'flexibility', 'duration_s', NULL, 'Stretch for hip flexors', 'Lunge position, push hips forward, feel stretch in front of hip'),
('Shoulder Stretch', ARRAY['shoulders'], 'none', 'flexibility', 'duration_s', NULL, 'Shoulder mobility stretch', 'Pull arm across body, hold with opposite hand'),
('Calf Stretch', ARRAY['calves'], 'none', 'flexibility', 'duration_s', NULL, 'Stretch for calf muscles', 'Step back, keep heel down, lean forward'),
('Quad Stretch', ARRAY['quadriceps'], 'none', 'flexibility', 'duration_s', NULL, 'Stretch for quadriceps', 'Pull heel toward glutes, keep knees together'),
('Cat-Cow Stretch', ARRAY['spine'], 'none', 'flexibility', 'reps', 'duration_s', 'Spinal mobility exercise', 'On hands and knees, arch and round spine slowly'),

-- Sports exercises
('Basketball Shooting', ARRAY['arms', 'coordination'], 'basketball', 'sports', 'reps', 'duration_s', 'Basketball skill practice', 'Focus on form, follow through, arc'),
('Soccer Dribbling', ARRAY['legs', 'coordination'], 'soccer ball', 'sports', 'duration_s', 'distance_m', 'Soccer skill practice', 'Use both feet, keep ball close, head up'),
('Tennis Forehand', ARRAY['arms', 'core'], 'tennis racket', 'sports', 'reps', 'duration_s', 'Tennis stroke practice', 'Turn sideways, swing low to high, follow through'),
('Golf Swing', ARRAY['core', 'shoulders'], 'golf club', 'sports', 'reps', 'duration_s', 'Golf technique practice', 'Proper stance, smooth tempo, follow through');

-- Add index on exercises for default types
CREATE INDEX idx_exercises_default_types ON exercises(default_value_1_type, default_value_2_type);

-- Update existing exercises to have default metrics (if any exist)
UPDATE exercises 
SET default_value_1_type = 'weight_kg', 
    default_value_2_type = 'reps',
    exercise_category = 'strength'
WHERE exercise_category IS NULL;