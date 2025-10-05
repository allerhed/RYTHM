-- Backup History Table
-- Logs all backup operations (scheduled and manual) for audit trail

CREATE TABLE IF NOT EXISTS backup_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    backup_filename VARCHAR(255) NOT NULL,
    backup_type VARCHAR(20) NOT NULL CHECK (backup_type IN ('scheduled', 'manual')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
    file_size_bytes BIGINT,
    duration_seconds INTEGER,
    error_message TEXT,
    initiated_by_user_id UUID REFERENCES users(user_id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_backup_history_status ON backup_history(status);
CREATE INDEX idx_backup_history_started_at ON backup_history(started_at DESC);
CREATE INDEX idx_backup_history_type ON backup_history(backup_type);
CREATE INDEX idx_backup_history_filename ON backup_history(backup_filename);

-- Add comments
COMMENT ON TABLE backup_history IS 'Audit log of all database backup operations';
COMMENT ON COLUMN backup_history.backup_filename IS 'Name of the backup file in blob storage';
COMMENT ON COLUMN backup_history.backup_type IS 'Whether backup was scheduled or manually triggered';
COMMENT ON COLUMN backup_history.status IS 'Current status of the backup operation';
COMMENT ON COLUMN backup_history.file_size_bytes IS 'Size of backup file in bytes';
COMMENT ON COLUMN backup_history.duration_seconds IS 'How long the backup took to complete';
COMMENT ON COLUMN backup_history.error_message IS 'Error details if backup failed';
COMMENT ON COLUMN backup_history.initiated_by_user_id IS 'User who triggered manual backup (NULL for scheduled)';
COMMENT ON COLUMN backup_history.started_at IS 'When the backup operation started';
COMMENT ON COLUMN backup_history.completed_at IS 'When the backup operation finished';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON backup_history TO rythm_api;
