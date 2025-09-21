-- Migration: 005_equipment_table.sql
-- Description: Create equipment table and migrate equipment data from text fields
-- This migration creates a proper equipment table with relationships

-- Create equipment table
CREATE TABLE equipment (
    equipment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE CHECK (length(name) > 0 AND length(name) <= 255),
    category TEXT DEFAULT 'other' CHECK (category = ANY (ARRAY['free_weights', 'machines', 'cardio', 'bodyweight', 'resistance', 'other'])),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add update trigger for equipment table
CREATE TRIGGER update_equipment_updated_at 
    BEFORE UPDATE ON equipment 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for performance
CREATE INDEX idx_equipment_name ON equipment(name);
CREATE INDEX idx_equipment_category ON equipment(category);
CREATE INDEX idx_equipment_active ON equipment(is_active);

-- Insert common equipment items
INSERT INTO equipment (name, category, description) VALUES
-- Free Weights
('Barbell', 'free_weights', 'Standard Olympic barbell'),
('Dumbbells', 'free_weights', 'Adjustable or fixed weight dumbbells'),
('Kettlebell', 'free_weights', 'Cast iron or steel kettlebell'),
('Weight Plates', 'free_weights', 'Olympic weight plates'),
('EZ Curl Bar', 'free_weights', 'Curved barbell for curls'),

-- Machines
('Cable Machine', 'machines', 'Cable crossover machine'),
('Leg Press Machine', 'machines', 'Seated or angled leg press'),
('Lat Pulldown Machine', 'machines', 'Seated lat pulldown'),
('Chest Press Machine', 'machines', 'Seated chest press'),
('Smith Machine', 'machines', 'Guided barbell machine'),
('Leg Curl Machine', 'machines', 'Seated or lying leg curl'),
('Leg Extension Machine', 'machines', 'Seated leg extension'),

-- Cardio Equipment
('Treadmill', 'cardio', 'Motorized running machine'),
('Stationary Bike', 'cardio', 'Exercise bike'),
('Rowing Machine', 'cardio', 'Indoor rowing ergometer'),
('Elliptical', 'cardio', 'Elliptical cross-trainer'),
('Stair Climber', 'cardio', 'Stair climbing machine'),

-- Resistance Equipment
('Resistance Bands', 'resistance', 'Elastic resistance bands'),
('Suspension Trainer', 'resistance', 'TRX or similar suspension system'),
('Pull-up Bar', 'resistance', 'Fixed or doorway pull-up bar'),

-- Bodyweight
('None', 'bodyweight', 'No equipment required'),
('Mat', 'bodyweight', 'Exercise mat for floor exercises'),

-- Other
('Medicine Ball', 'other', 'Weighted exercise ball'),
('Foam Roller', 'other', 'Muscle recovery roller'),
('Balance Ball', 'other', 'Large exercise/stability ball'),
('Bosu Ball', 'other', 'Half-sphere balance trainer'),
('Battle Ropes', 'other', 'Heavy training ropes'),
('Plyo Box', 'other', 'Jumping/step platform'),
('Agility Ladder', 'other', 'Speed and agility training ladder');

-- Add equipment_id columns to exercises and exercise_templates tables
ALTER TABLE exercises ADD COLUMN equipment_id UUID REFERENCES equipment(equipment_id);
ALTER TABLE exercise_templates ADD COLUMN equipment_id UUID REFERENCES equipment(equipment_id);

-- Create indexes for the new foreign keys
CREATE INDEX idx_exercises_equipment_id ON exercises(equipment_id);
CREATE INDEX idx_exercise_templates_equipment_id ON exercise_templates(equipment_id);

-- Migrate existing equipment data from text to equipment_id
-- First, update exercises table
UPDATE exercises 
SET equipment_id = (
    SELECT equipment_id 
    FROM equipment 
    WHERE LOWER(equipment.name) = LOWER(exercises.equipment)
    LIMIT 1
)
WHERE equipment IS NOT NULL 
AND equipment != '';

-- Update exercise_templates table
UPDATE exercise_templates 
SET equipment_id = (
    SELECT equipment_id 
    FROM equipment 
    WHERE LOWER(equipment.name) = LOWER(exercise_templates.equipment)
    LIMIT 1
)
WHERE equipment IS NOT NULL 
AND equipment != '';

-- Set default equipment for exercises without matches
UPDATE exercises 
SET equipment_id = (SELECT equipment_id FROM equipment WHERE name = 'None' LIMIT 1)
WHERE equipment_id IS NULL;

UPDATE exercise_templates 
SET equipment_id = (SELECT equipment_id FROM equipment WHERE name = 'None' LIMIT 1)
WHERE equipment_id IS NULL;

-- After migration is complete and verified, we can drop the old text columns
-- (Commented out for safety - run these after verifying migration)
-- ALTER TABLE exercises DROP COLUMN equipment;
-- ALTER TABLE exercise_templates DROP COLUMN equipment;