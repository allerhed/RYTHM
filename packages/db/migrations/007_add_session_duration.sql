-- Migration: 007_add_session_duration.sql
-- Description: Add duration field to sessions table to store user-entered workout duration

-- Add duration field (stored as seconds)
ALTER TABLE sessions 
ADD COLUMN duration_seconds INTEGER DEFAULT 3600 CHECK (duration_seconds > 0);

-- Add comment for documentation
COMMENT ON COLUMN sessions.duration_seconds IS 'Workout duration in seconds as entered by the user (default 1 hour = 3600 seconds)';

-- Update existing sessions to have default 1 hour duration
UPDATE sessions 
SET duration_seconds = 3600 
WHERE duration_seconds IS NULL;