-- Backup Schedule Configuration Table
-- Stores configuration for automated daily backups

CREATE TABLE IF NOT EXISTS backup_schedule (
    schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    schedule_time TIME NOT NULL DEFAULT '02:00:00', -- 2 AM UTC by default
    retention_days INTEGER NOT NULL DEFAULT 30,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO backup_schedule (enabled, schedule_time, retention_days)
VALUES (FALSE, '02:00:00', 30)
ON CONFLICT DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_backup_schedule_updated_at
    BEFORE UPDATE ON backup_schedule
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE backup_schedule IS 'Configuration for automated database backups';
COMMENT ON COLUMN backup_schedule.enabled IS 'Whether automatic backups are enabled';
COMMENT ON COLUMN backup_schedule.schedule_time IS 'Time of day to run backups (UTC)';
COMMENT ON COLUMN backup_schedule.retention_days IS 'Number of days to retain backups';
COMMENT ON COLUMN backup_schedule.last_run_at IS 'Timestamp of last successful backup';
COMMENT ON COLUMN backup_schedule.next_run_at IS 'Scheduled timestamp for next backup';
