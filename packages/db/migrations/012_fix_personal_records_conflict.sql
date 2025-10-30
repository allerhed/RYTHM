-- Fix: Drop conflicting personal_records view and ensure table exists
-- The view in 000_consolidated_schema.sql conflicts with the table in 010_personal_records.sql
-- This migration resolves the conflict by:
-- 1. Dropping the old auto-calculated analytics view
-- 2. Ensuring the new user-managed PR table exists

-- Drop the conflicting view (if it exists)
DROP VIEW IF EXISTS personal_records CASCADE;

-- Now ensure the personal_records table exists with correct structure
-- (This is idempotent - if the table exists, it won't be recreated)
CREATE TABLE IF NOT EXISTS personal_records (
    pr_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES exercise_templates(template_id) ON DELETE CASCADE,
    
    -- PR identification
    metric_name VARCHAR(100) NOT NULL, -- e.g., '1RM', '3RM', '1km', '5km', 'max reps'
    category VARCHAR(20) NOT NULL CHECK (category IN ('strength', 'cardio')),
    
    -- Current best value (denormalized for quick access)
    current_value_numeric DECIMAL(10,2), -- e.g., 150.00 kg, 29.05 minutes
    current_value_unit VARCHAR(20), -- e.g., 'kg', 'lbs', 'minutes', 'seconds'
    current_achieved_date DATE NOT NULL,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure pr_history table exists
CREATE TABLE IF NOT EXISTS pr_history (
    history_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pr_id UUID NOT NULL REFERENCES personal_records(pr_id) ON DELETE CASCADE,
    
    -- Historical record value
    value_numeric DECIMAL(10,2) NOT NULL,
    value_unit VARCHAR(20) NOT NULL,
    achieved_date TIMESTAMPTZ NOT NULL,
    
    -- Optional context
    notes TEXT,
    session_id UUID REFERENCES sessions(session_id) ON DELETE SET NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recreate indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_personal_records_user ON personal_records(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_tenant ON personal_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_exercise ON personal_records(template_id);
CREATE INDEX IF NOT EXISTS idx_personal_records_category ON personal_records(category);
CREATE INDEX IF NOT EXISTS idx_personal_records_user_category ON personal_records(user_id, category);

CREATE INDEX IF NOT EXISTS idx_pr_history_pr_id ON pr_history(pr_id);
CREATE INDEX IF NOT EXISTS idx_pr_history_achieved_date ON pr_history(achieved_date DESC);

-- Ensure Row Level Security is enabled
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS personal_records_isolation ON personal_records;
DROP POLICY IF EXISTS personal_records_user_isolation ON personal_records;
DROP POLICY IF EXISTS pr_history_isolation ON pr_history;

-- RLS Policies for personal_records (combined tenant + user check)
CREATE POLICY personal_records_isolation ON personal_records
    USING (
        tenant_id = current_setting('app.current_tenant_id', true)::uuid 
        AND user_id = current_setting('app.current_user_id', true)::uuid
    );

-- RLS Policy for pr_history (through parent pr_id)
CREATE POLICY pr_history_isolation ON pr_history
    USING (
        EXISTS (
            SELECT 1 FROM personal_records pr
            WHERE pr.pr_id = pr_history.pr_id
            AND pr.tenant_id = current_setting('app.current_tenant_id', true)::uuid
            AND pr.user_id = current_setting('app.current_user_id', true)::uuid
        )
    );

-- Ensure trigger exists for updated_at
DROP TRIGGER IF EXISTS update_personal_records_updated_at ON personal_records;
CREATE TRIGGER update_personal_records_updated_at
    BEFORE UPDATE ON personal_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON personal_records TO rythm_admin;
GRANT SELECT, INSERT, UPDATE, DELETE ON pr_history TO rythm_admin;

-- Comments
COMMENT ON TABLE personal_records IS 'User-managed personal records (PRs) for exercises';
COMMENT ON TABLE pr_history IS 'Historical tracking of personal record progression';
COMMENT ON COLUMN personal_records.metric_name IS 'Type of PR being tracked (e.g., 1RM, 5km, max reps)';
COMMENT ON COLUMN personal_records.current_value_numeric IS 'Current best value for this PR';
COMMENT ON COLUMN personal_records.current_achieved_date IS 'Date when the current PR was achieved';
COMMENT ON COLUMN pr_history.achieved_date IS 'When this specific record was achieved';
COMMENT ON COLUMN pr_history.session_id IS 'Optional link to workout session where PR was achieved';
