-- Migration: 004_add_training_load_and_perceived_exertion.sql
-- Description: Add training load and perceived exertion fields to sessions table

-- Add training load field (integer, can be null)
ALTER TABLE sessions 
ADD COLUMN training_load INTEGER CHECK (training_load >= 0);

-- Add perceived exertion field (decimal from 1-10 with one decimal place)
ALTER TABLE sessions 
ADD COLUMN perceived_exertion DECIMAL(3,1) CHECK (perceived_exertion >= 1.0 AND perceived_exertion <= 10.0);

-- Add comments for documentation
COMMENT ON COLUMN sessions.training_load IS 'Subjective training load value entered by user';
COMMENT ON COLUMN sessions.perceived_exertion IS 'Perceived exertion rating from 1.0 to 10.0 (RPE scale)';