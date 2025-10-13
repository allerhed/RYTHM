-- Hyrox Race Tracking Tables
-- Separate tables for tracking Hyrox race performance and exercises

-- Hyrox Exercise Types (fixed list of 9 exercises)
CREATE TYPE hyrox_exercise_type AS ENUM (
    '1KM_RUN',
    '1KM_SKI',
    '50M_SLED_PUSH',
    '50M_SLED_PULL',
    '80M_BURPEE_BROAD_JUMP',
    '1KM_ROW',
    '200M_FARMERS_CARRY',
    '100M_SANDBAG_LUNGES',
    '100_WALL_BALLS'
);

-- Hyrox Personal Records table
CREATE TABLE IF NOT EXISTS hyrox_records (
    hyrox_record_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    
    -- Exercise identification
    exercise_type hyrox_exercise_type NOT NULL,
    
    -- Current best time (in seconds for easy calculation)
    current_time_seconds INTEGER NOT NULL CHECK (current_time_seconds > 0),
    current_achieved_date TIMESTAMPTZ NOT NULL,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Ensure one record per user per exercise
    UNIQUE(user_id, exercise_type)
);

-- Hyrox History table - tracks all historical records
CREATE TABLE IF NOT EXISTS hyrox_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hyrox_record_id UUID NOT NULL REFERENCES hyrox_records(hyrox_record_id) ON DELETE CASCADE,
    
    -- Historical record value (in seconds)
    time_seconds INTEGER NOT NULL CHECK (time_seconds > 0),
    achieved_date TIMESTAMPTZ NOT NULL,
    
    -- Optional context
    notes TEXT,
    heart_rate INTEGER CHECK (heart_rate IS NULL OR (heart_rate > 0 AND heart_rate < 300)),
    session_id UUID REFERENCES sessions(session_id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_hyrox_records_user ON hyrox_records(user_id);
CREATE INDEX idx_hyrox_records_tenant ON hyrox_records(tenant_id);
CREATE INDEX idx_hyrox_records_exercise ON hyrox_records(exercise_type);
CREATE INDEX idx_hyrox_records_user_exercise ON hyrox_records(user_id, exercise_type);

CREATE INDEX idx_hyrox_history_record_id ON hyrox_history(hyrox_record_id);
CREATE INDEX idx_hyrox_history_achieved_date ON hyrox_history(achieved_date DESC);

-- Row Level Security
ALTER TABLE hyrox_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hyrox_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for hyrox_records
DROP POLICY IF EXISTS hyrox_records_tenant_isolation ON hyrox_records;
CREATE POLICY hyrox_records_tenant_isolation ON hyrox_records
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

DROP POLICY IF EXISTS hyrox_records_user_isolation ON hyrox_records;
CREATE POLICY hyrox_records_user_isolation ON hyrox_records
    USING (user_id = current_setting('app.current_user_id')::uuid);

-- RLS Policies for hyrox_history (through parent record)
DROP POLICY IF EXISTS hyrox_history_isolation ON hyrox_history;
CREATE POLICY hyrox_history_isolation ON hyrox_history
    USING (
        EXISTS (
            SELECT 1 FROM hyrox_records hr
            WHERE hr.hyrox_record_id = hyrox_history.hyrox_record_id
            AND hr.tenant_id = current_setting('app.current_tenant_id')::uuid
            AND hr.user_id = current_setting('app.current_user_id')::uuid
        )
    );

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_hyrox_records_updated_at ON hyrox_records;
CREATE TRIGGER update_hyrox_records_updated_at
    BEFORE UPDATE ON hyrox_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE hyrox_records IS 'User personal records for Hyrox race exercises';
COMMENT ON TABLE hyrox_history IS 'Historical tracking of Hyrox exercise performance';
COMMENT ON TYPE hyrox_exercise_type IS 'Fixed list of 9 Hyrox race exercises';

COMMENT ON COLUMN hyrox_records.exercise_type IS 'Type of Hyrox exercise';
COMMENT ON COLUMN hyrox_records.current_time_seconds IS 'Current best time in seconds';
COMMENT ON COLUMN hyrox_records.current_achieved_date IS 'Date when the current PR was achieved';

COMMENT ON COLUMN hyrox_history.time_seconds IS 'Time for this specific attempt in seconds';
COMMENT ON COLUMN hyrox_history.achieved_date IS 'When this specific record was achieved';
COMMENT ON COLUMN hyrox_history.heart_rate IS 'Optional heart rate during this attempt';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON hyrox_records TO rythm_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON hyrox_history TO rythm_admin;

-- Insert comment about exercise multipliers (for reference)
COMMENT ON TABLE hyrox_records IS 'User personal records for Hyrox race exercises. 
Note: 1KM_RUN time should be multiplied by 8 when calculating total race time.
The 9 exercises in order are: 1km Run, 1km Ski, 50m Sled Push, 50m Sled Pull, 
80m Burpee Broad Jump, 1km Row, 200m Farmers Carry, 100m Sandbag Lunges, 100 Wall Balls';
