-- Password Reset Tokens Migration
-- Adds columns to users table for password reset functionality

-- Add reset token columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS reset_token_hash TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

-- Index for finding tokens (without NOW() in WHERE clause for compatibility)
CREATE INDEX IF NOT EXISTS idx_users_reset_token_hash 
ON users(reset_token_hash) 
WHERE reset_token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_reset_token_expires 
ON users(reset_token_expires) 
WHERE reset_token_expires IS NOT NULL;

-- Comments
COMMENT ON COLUMN users.reset_token_hash IS 'Hashed password reset token';
COMMENT ON COLUMN users.reset_token_expires IS 'Expiration timestamp for reset token';
