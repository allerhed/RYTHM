-- Migration: 006_add_session_name.sql
-- Description: Add name field to sessions table to store custom workout names

-- Add name field to sessions table
ALTER TABLE sessions 
ADD COLUMN name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN sessions.name IS 'Custom name for the workout session (e.g., "Push Day", "Morning Run")';

-- Update the trigger to include the new column
-- (The existing update_sessions_updated_at trigger will automatically handle the name field)