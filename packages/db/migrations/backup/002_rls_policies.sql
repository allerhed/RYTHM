-- Migration: 002_rls_policies.sql
-- Description: Enable Row Level Security policies for multi-tenant isolation

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_assignments ENABLE ROW LEVEL SECURITY;

-- Create function to get current user's tenant_id from JWT claims
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
    -- In production, this would extract tenant_id from JWT claims
    -- For now, we use a session variable that the API sets
    RETURN COALESCE(
        current_setting('rythm.current_tenant_id', true)::UUID,
        '00000000-0000-0000-0000-000000000000'::UUID
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is org_admin
CREATE OR REPLACE FUNCTION is_org_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        current_setting('rythm.is_org_admin', true)::BOOLEAN,
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tenants policies
CREATE POLICY tenant_isolation_policy ON tenants
    FOR ALL
    USING (
        is_org_admin() OR 
        tenant_id = current_tenant_id()
    );

-- Users policies
CREATE POLICY user_isolation_policy ON users
    FOR ALL
    USING (
        is_org_admin() OR 
        tenant_id = current_tenant_id()
    );

-- Exercises policies
CREATE POLICY exercise_isolation_policy ON exercises
    FOR ALL
    USING (
        is_org_admin() OR 
        tenant_id = current_tenant_id()
    );

-- Programs policies
CREATE POLICY program_isolation_policy ON programs
    FOR ALL
    USING (
        is_org_admin() OR 
        tenant_id = current_tenant_id()
    );

-- Workouts policies
CREATE POLICY workout_isolation_policy ON workouts
    FOR ALL
    USING (
        is_org_admin() OR 
        tenant_id = current_tenant_id()
    );

-- Sessions policies
CREATE POLICY session_isolation_policy ON sessions
    FOR ALL
    USING (
        is_org_admin() OR 
        tenant_id = current_tenant_id()
    );

-- Additional session policy for user-specific access
CREATE POLICY session_user_policy ON sessions
    FOR ALL
    USING (
        tenant_id = current_tenant_id() AND (
            -- User can access their own sessions
            user_id = current_setting('rythm.current_user_id', true)::UUID OR
            -- Coaches and admins can access all sessions in their tenant
            current_setting('rythm.user_role', true) IN ('coach', 'tenant_admin')
        )
    );

-- Sets policies
CREATE POLICY set_isolation_policy ON sets
    FOR ALL
    USING (
        is_org_admin() OR 
        tenant_id = current_tenant_id()
    );

-- Program assignments policies
CREATE POLICY assignment_isolation_policy ON program_assignments
    FOR ALL
    USING (
        is_org_admin() OR 
        tenant_id = current_tenant_id()
    );

-- Grant necessary permissions to application role
-- This role will be used by the API server
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'rythm_api') THEN
        CREATE ROLE rythm_api;
    END IF;
END
$$;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO rythm_api;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO rythm_api;
GRANT EXECUTE ON FUNCTION current_tenant_id() TO rythm_api;
GRANT EXECUTE ON FUNCTION is_org_admin() TO rythm_api;