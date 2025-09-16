-- Migration: 001_complete_initial_schema.sql
-- Description: Complete initial database schema with all features
-- This migration creates the entire database schema as it exists in the current dev environment
-- Replaces the previous fragmented migration approach

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create custom types
CREATE TYPE session_category AS ENUM ('strength', 'cardio', 'hybrid');
CREATE TYPE set_value_type AS ENUM ('weight_kg', 'distance_m', 'duration_s', 'calories', 'reps');
CREATE TYPE user_role AS ENUM ('athlete', 'coach', 'tenant_admin', 'org_admin', 'system_admin');
CREATE TYPE exercise_type AS ENUM ('STRENGTH', 'CARDIO');

-- Create helper functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

CREATE OR REPLACE FUNCTION is_org_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        current_setting('rythm.is_org_admin', true)::BOOLEAN,
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION calculate_one_rm(weight NUMERIC, reps INTEGER)
RETURNS NUMERIC AS $$
BEGIN
    IF reps = 1 THEN
        RETURN weight;
    END IF;
    
    -- Epley formula: 1RM = weight * (1 + reps/30)
    RETURN weight * (1 + reps::NUMERIC / 30);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Tenants table (root of multi-tenancy)
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    branding JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table with multi-tenant support and extended fields
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    email CITEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'athlete',
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    about TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- Global exercises table (no tenant isolation)
CREATE TABLE exercises (
    exercise_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    muscle_groups TEXT[] NOT NULL DEFAULT '{}',
    equipment TEXT,
    media JSONB DEFAULT '{}',
    notes TEXT,
    default_value_1_type set_value_type,
    default_value_2_type set_value_type,
    exercise_category TEXT DEFAULT 'strength' CHECK (exercise_category IN ('strength', 'cardio', 'flexibility', 'sports')),
    is_active BOOLEAN DEFAULT true,
    exercise_type exercise_type,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercise templates table
CREATE TABLE exercise_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    muscle_groups TEXT[] NOT NULL DEFAULT '{}',
    equipment TEXT,
    exercise_category TEXT DEFAULT 'strength' CHECK (exercise_category IN ('strength', 'cardio', 'flexibility', 'sports')),
    default_value_1_type set_value_type,
    default_value_2_type set_value_type,
    description TEXT,
    instructions TEXT,
    exercise_type exercise_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Programs table
CREATE TABLE programs (
    program_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    description TEXT,
    duration_weeks INTEGER NOT NULL CHECK (duration_weeks > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workouts table (program structure)
CREATE TABLE workouts (
    workout_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES programs(program_id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    day_index INTEGER NOT NULL CHECK (day_index >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sessions table with training load and duration
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(program_id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    category session_category NOT NULL,
    notes TEXT,
    training_load INTEGER CHECK (training_load >= 0),
    perceived_exertion NUMERIC(3,1) CHECK (perceived_exertion >= 1.0 AND perceived_exertion <= 10.0),
    name TEXT,
    duration_seconds INTEGER DEFAULT 3600 CHECK (duration_seconds > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comments for session fields
COMMENT ON COLUMN sessions.training_load IS 'Subjective training load value entered by user';
COMMENT ON COLUMN sessions.perceived_exertion IS 'Perceived exertion rating from 1.0 to 10.0 (RPE scale)';
COMMENT ON COLUMN sessions.name IS 'Custom name for the workout session (e.g., "Push Day", "Morning Run")';
COMMENT ON COLUMN sessions.duration_seconds IS 'Workout duration in seconds as entered by the user (default 1 hour = 3600 seconds)';

-- Sets table with configurable value fields
CREATE TABLE sets (
    set_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(exercise_id) ON DELETE CASCADE,
    set_index INTEGER NOT NULL CHECK (set_index > 0),
    reps INTEGER CHECK (reps > 0),
    -- Two configurable value fields
    value_1_type set_value_type,
    value_1_numeric NUMERIC(10,3) CHECK (value_1_numeric >= 0),
    value_2_type set_value_type,
    value_2_numeric NUMERIC(10,3) CHECK (value_2_numeric >= 0),
    rpe NUMERIC(3,1) CHECK (rpe >= 1 AND rpe <= 10),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Ensure at least one value is provided if value types are set
    CHECK (
        (value_1_type IS NULL OR value_1_numeric IS NOT NULL) AND
        (value_2_type IS NULL OR value_2_numeric IS NOT NULL)
    )
);

-- Program assignments table
CREATE TABLE program_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(program_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    starts_at DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, program_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE UNIQUE INDEX idx_exercises_name_unique ON exercises(name);
CREATE INDEX idx_exercises_default_types ON exercises(default_value_1_type, default_value_2_type);
CREATE INDEX idx_exercises_type ON exercises(exercise_type);
CREATE INDEX idx_exercise_templates_name ON exercise_templates(name);
CREATE INDEX idx_exercise_templates_category ON exercise_templates(exercise_category);
CREATE INDEX idx_exercise_templates_type ON exercise_templates(exercise_type);
CREATE INDEX idx_exercise_templates_category_type ON exercise_templates(exercise_category, exercise_type);
CREATE INDEX idx_sessions_tenant_user_started ON sessions(tenant_id, user_id, started_at DESC);
CREATE INDEX idx_sessions_category ON sessions(tenant_id, category, started_at DESC);
CREATE INDEX idx_sessions_user_completed ON sessions(user_id, completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_sets_session_exercise ON sets(session_id, exercise_id, set_index);
CREATE INDEX idx_sets_tenant_exercise ON sets(tenant_id, exercise_id, created_at DESC);
CREATE INDEX idx_sets_exercise_session ON sets(exercise_id, session_id);

-- Create materialized views for analytics
CREATE MATERIALIZED VIEW training_volume_weekly AS
SELECT 
    s.tenant_id,
    s.user_id,
    s.category,
    DATE_TRUNC('week', s.started_at) as week_start,
    COUNT(DISTINCT s.session_id) as session_count,
    COUNT(st.set_id) as total_sets,
    
    -- Strength volume (weight * reps)
    COALESCE(SUM(
        CASE 
            WHEN st.value_1_type = 'weight_kg' AND st.reps IS NOT NULL 
            THEN st.value_1_numeric * st.reps
            WHEN st.value_2_type = 'weight_kg' AND st.reps IS NOT NULL 
            THEN st.value_2_numeric * st.reps
            ELSE 0
        END
    ), 0) as strength_volume,
    
    -- Total distance
    COALESCE(SUM(
        CASE 
            WHEN st.value_1_type = 'distance_m' THEN st.value_1_numeric
            WHEN st.value_2_type = 'distance_m' THEN st.value_2_numeric
            ELSE 0
        END
    ), 0) as total_distance,
    
    -- Total duration
    COALESCE(SUM(
        CASE 
            WHEN st.value_1_type = 'duration_s' THEN st.value_1_numeric
            WHEN st.value_2_type = 'duration_s' THEN st.value_2_numeric
            ELSE 0
        END
    ), 0) as total_duration,
    
    -- Total calories
    COALESCE(SUM(
        CASE 
            WHEN st.value_1_type = 'calories' THEN st.value_1_numeric
            WHEN st.value_2_type = 'calories' THEN st.value_2_numeric
            ELSE 0
        END
    ), 0) as total_calories
    
FROM sessions s
LEFT JOIN sets st ON s.session_id = st.session_id
WHERE s.completed_at IS NOT NULL
GROUP BY s.tenant_id, s.user_id, s.category, DATE_TRUNC('week', s.started_at);

-- Create index on materialized view
CREATE UNIQUE INDEX idx_training_volume_weekly_unique 
ON training_volume_weekly (tenant_id, user_id, category, week_start);

-- Create materialized view for muscle group analytics
CREATE MATERIALIZED VIEW muscle_group_volume AS
SELECT 
    s.tenant_id,
    s.user_id,
    s.category,
    UNNEST(e.muscle_groups) as muscle_group,
    DATE_TRUNC('month', s.started_at) as month_start,
    COUNT(st.set_id) as sets_count,
    COALESCE(SUM(
        CASE 
            WHEN st.value_1_type = 'weight_kg' AND st.reps IS NOT NULL 
            THEN st.value_1_numeric * st.reps
            WHEN st.value_2_type = 'weight_kg' AND st.reps IS NOT NULL 
            THEN st.value_2_numeric * st.reps
            ELSE 0
        END
    ), 0) as volume
FROM sessions s
JOIN sets st ON s.session_id = st.session_id
JOIN exercises e ON st.exercise_id = e.exercise_id
WHERE s.completed_at IS NOT NULL
GROUP BY s.tenant_id, s.user_id, s.category, UNNEST(e.muscle_groups), DATE_TRUNC('month', s.started_at);

-- Create index on muscle group view
CREATE INDEX idx_muscle_group_volume ON muscle_group_volume 
(tenant_id, user_id, muscle_group, month_start);

-- Create analytics views
CREATE VIEW personal_records AS
WITH weight_prs AS (
    SELECT DISTINCT ON (s.tenant_id, s.user_id, st.exercise_id)
        s.tenant_id,
        s.user_id,
        st.exercise_id,
        e.name as exercise_name,
        'weight' as pr_type,
        GREATEST(
            CASE WHEN st.value_1_type = 'weight_kg' THEN st.value_1_numeric ELSE 0 END,
            CASE WHEN st.value_2_type = 'weight_kg' THEN st.value_2_numeric ELSE 0 END
        ) as value,
        s.started_at as achieved_at
    FROM sessions s
    JOIN sets st ON s.session_id = st.session_id
    JOIN exercises e ON st.exercise_id = e.exercise_id
    WHERE (st.value_1_type = 'weight_kg' OR st.value_2_type = 'weight_kg')
        AND s.completed_at IS NOT NULL
    ORDER BY s.tenant_id, s.user_id, st.exercise_id, 
             GREATEST(
                 CASE WHEN st.value_1_type = 'weight_kg' THEN st.value_1_numeric ELSE 0 END,
                 CASE WHEN st.value_2_type = 'weight_kg' THEN st.value_2_numeric ELSE 0 END
             ) DESC, s.started_at DESC
),
one_rm_prs AS (
    SELECT DISTINCT ON (s.tenant_id, s.user_id, st.exercise_id)
        s.tenant_id,
        s.user_id,
        st.exercise_id,
        e.name as exercise_name,
        '1rm_estimate' as pr_type,
        calculate_one_rm(
            GREATEST(
                CASE WHEN st.value_1_type = 'weight_kg' THEN st.value_1_numeric ELSE 0 END,
                CASE WHEN st.value_2_type = 'weight_kg' THEN st.value_2_numeric ELSE 0 END
            ),
            st.reps
        ) as value,
        s.started_at as achieved_at
    FROM sessions s
    JOIN sets st ON s.session_id = st.session_id
    JOIN exercises e ON st.exercise_id = e.exercise_id
    WHERE (st.value_1_type = 'weight_kg' OR st.value_2_type = 'weight_kg')
        AND st.reps IS NOT NULL
        AND s.completed_at IS NOT NULL
    ORDER BY s.tenant_id, s.user_id, st.exercise_id,
             calculate_one_rm(
                 GREATEST(
                     CASE WHEN st.value_1_type = 'weight_kg' THEN st.value_1_numeric ELSE 0 END,
                     CASE WHEN st.value_2_type = 'weight_kg' THEN st.value_2_numeric ELSE 0 END
                 ),
                 st.reps
             ) DESC, s.started_at DESC
)
SELECT * FROM weight_prs
UNION ALL
SELECT * FROM one_rm_prs;

-- Additional analytics views
CREATE VIEW exercise_pr_tracking AS
SELECT DISTINCT ON (s.tenant_id, s.user_id, st.exercise_id)
    s.tenant_id,
    s.user_id,
    st.exercise_id,
    e.name as exercise_name,
    e.exercise_category,
    e.exercise_type,
    s.started_at as pr_date,
    st.value_1_numeric as weight_kg,
    st.value_2_numeric as reps,
    (st.value_1_numeric * st.value_2_numeric * 0.033 + st.value_1_numeric) as estimated_1rm
FROM sessions s
JOIN sets st ON st.session_id = s.session_id
JOIN exercises e ON e.exercise_id = st.exercise_id
WHERE s.completed_at IS NOT NULL
    AND st.value_1_type = 'weight_kg'
    AND st.value_2_type = 'reps'
    AND st.value_1_numeric > 0
    AND st.value_2_numeric > 0
ORDER BY s.tenant_id, s.user_id, st.exercise_id,
         (st.value_1_numeric * st.value_2_numeric * 0.033 + st.value_1_numeric) DESC NULLS LAST,
         s.started_at DESC;

CREATE VIEW exercise_volume_tracking AS
SELECT DISTINCT ON (s.tenant_id, s.user_id, st.exercise_id)
    s.tenant_id,
    s.user_id,
    st.exercise_id,
    e.name as exercise_name,
    e.exercise_category,
    e.exercise_type,
    s.started_at as session_date,
    COUNT(st.set_id) as total_sets,
    SUM(st.value_1_numeric * st.value_2_numeric) as total_volume_kg_reps,
    AVG(st.value_1_numeric) as avg_weight_kg,
    AVG(st.value_2_numeric) as avg_reps
FROM sessions s
JOIN sets st ON st.session_id = s.session_id
JOIN exercises e ON e.exercise_id = st.exercise_id
WHERE s.completed_at IS NOT NULL
    AND st.value_1_type = 'weight_kg'
    AND st.value_2_type = 'reps'
    AND st.value_1_numeric > 0
    AND st.value_2_numeric > 0
GROUP BY s.tenant_id, s.user_id, st.exercise_id, e.name, e.exercise_category, e.exercise_type, s.started_at
ORDER BY s.tenant_id, s.user_id, st.exercise_id,
         SUM(st.value_1_numeric * st.value_2_numeric) DESC NULLS LAST,
         s.started_at DESC;

-- Function to refresh analytics materialized views
CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY training_volume_weekly;
    REFRESH MATERIALIZED VIEW CONCURRENTLY muscle_group_volume;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY tenant_isolation_policy ON tenants
    FOR ALL
    USING (
        is_org_admin() OR 
        tenant_id = current_tenant_id()
    );

CREATE POLICY user_isolation_policy ON users
    FOR ALL
    USING (
        is_org_admin() OR 
        tenant_id = current_tenant_id()
    );

-- Note: exercises table has no RLS policy as it's global

CREATE POLICY program_isolation_policy ON programs
    FOR ALL
    USING (
        is_org_admin() OR 
        tenant_id = current_tenant_id()
    );

CREATE POLICY workout_isolation_policy ON workouts
    FOR ALL
    USING (
        is_org_admin() OR 
        tenant_id = current_tenant_id()
    );

CREATE POLICY session_isolation_policy ON sessions
    FOR ALL
    USING (
        is_org_admin() OR 
        tenant_id = current_tenant_id()
    );

CREATE POLICY session_user_policy ON sessions
    FOR ALL
    USING (
        tenant_id = current_tenant_id() AND (
            user_id = current_setting('rythm.current_user_id', true)::UUID OR
            current_setting('rythm.user_role', true) IN ('coach', 'tenant_admin')
        )
    );

CREATE POLICY set_isolation_policy ON sets
    FOR ALL
    USING (
        is_org_admin() OR 
        tenant_id = current_tenant_id()
    );

CREATE POLICY assignment_isolation_policy ON program_assignments
    FOR ALL
    USING (
        is_org_admin() OR 
        tenant_id = current_tenant_id()
    );

-- Create update timestamp triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercise_templates_updated_at BEFORE UPDATE ON exercise_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sets_updated_at BEFORE UPDATE ON sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_program_assignments_updated_at BEFORE UPDATE ON program_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a special tenant for system administrators
INSERT INTO tenants (tenant_id, name, branding, created_at, updated_at) 
VALUES (
    '00000000-0000-0000-0000-000000000000'::UUID, 
    'RYTHM System Administration',
    '{"theme": "admin", "logo": "system"}',
    NOW(),
    NOW()
) ON CONFLICT (tenant_id) DO NOTHING;

-- Insert admin users
INSERT INTO users (user_id, tenant_id, email, password_hash, role, first_name, last_name, created_at, updated_at)
VALUES 
(
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000000'::UUID,
    'admin@rythm.app',
    '$2b$10$uPwgy7I1bDAShgosEUGZ/eoFlNwrmwAMob4u18TZfPi9SVRWg1gQe', -- admin123
    'system_admin',
    'System',
    'Administrator',
    NOW(),
    NOW()
),
(
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000000'::UUID,
    'orchestrator@rythm.app',
    '$2b$10$uPwgy7I1bDAShgosEUGZ/eoFlNwrmwAMob4u18TZfPi9SVRWg1gQe', -- Password123
    'system_admin',
    'System',
    'Orchestrator',
    NOW(),
    NOW()
)
ON CONFLICT (tenant_id, email) DO NOTHING;