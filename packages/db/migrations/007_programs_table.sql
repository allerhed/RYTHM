-- Programs Table Migration
-- Creates the programs table and related structures

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
    program_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    description TEXT,
    duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add trigger for updated_at
CREATE TRIGGER update_programs_updated_at
    BEFORE UPDATE ON programs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY programs_tenant_isolation ON programs
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id', TRUE)::UUID);

CREATE POLICY programs_admin_all ON programs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.user_id = current_setting('app.current_user_id', TRUE)::UUID
            AND users.role = 'system_admin'
        )
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_programs_tenant_id ON programs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_programs_created_at ON programs(created_at DESC);

-- Comments
COMMENT ON TABLE programs IS 'Training programs that span multiple weeks';
COMMENT ON COLUMN programs.program_id IS 'Unique identifier for the program';
COMMENT ON COLUMN programs.tenant_id IS 'Tenant that owns this program';
COMMENT ON COLUMN programs.name IS 'Name of the training program';
COMMENT ON COLUMN programs.description IS 'Description of the program goals and structure';
COMMENT ON COLUMN programs.duration_weeks IS 'Duration of the program in weeks';
