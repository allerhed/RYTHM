-- Add avatar_data column to store profile pictures in database
-- This prevents data loss during container redeployments

-- Add column to store base64 encoded avatar data
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_data TEXT;

-- Add column to store content type (image/jpeg, image/png, etc)
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_content_type TEXT;

-- Add comment explaining the change
COMMENT ON COLUMN users.avatar_data IS 'Base64 encoded profile picture data for persistence across deployments';
COMMENT ON COLUMN users.avatar_content_type IS 'MIME type of the avatar image (e.g., image/jpeg, image/png)';
COMMENT ON COLUMN users.avatar_url IS 'Deprecated: Legacy filesystem path. Use avatar_data instead for persistence.';
