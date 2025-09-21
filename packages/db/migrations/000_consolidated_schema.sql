-- Consolidated Database Schema for RYTHM Fitness Platform
-- This file contains the complete database schema and can be used for fresh deployments
-- without requiring individual migration files.
-- 
-- Version: Consolidated as of 2025-09-21
-- Includes: Initial schema, workout templates, duration conversion (seconds to minutes), equipment table

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create custom types
CREATE TYPE session_category AS ENUM ('strength', 'cardio', 'hybrid');
CREATE TYPE set_value_type AS ENUM ('weight_kg', 'distance_m', 'duration_m', 'calories', 'reps');
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

-- Equipment table for exercise equipment management
CREATE TABLE equipment (
    equipment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE CHECK (length(name) > 0 AND length(name) <= 255),
    category TEXT DEFAULT 'other' CHECK (category = ANY (ARRAY['free_weights', 'machines', 'cardio', 'bodyweight', 'resistance', 'other'])),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Global exercises table (no tenant isolation)
CREATE TABLE exercises (
    exercise_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    muscle_groups TEXT[] NOT NULL DEFAULT '{}',
    equipment TEXT, -- Legacy field, use equipment_id for new records
    equipment_id UUID REFERENCES equipment(equipment_id),
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
    equipment TEXT, -- Legacy field, use equipment_id for new records
    equipment_id UUID REFERENCES equipment(equipment_id),
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

-- Workout templates table
CREATE TABLE workout_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(user_id) ON DELETE CASCADE, -- NULL for tenant/system templates
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scope VARCHAR(20) NOT NULL CHECK (scope IN ('user', 'tenant', 'system')),
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of exercise objects with exercise_id, sets, reps, etc.
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(user_id),
    updated_by UUID REFERENCES users(user_id)
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
CREATE INDEX idx_exercises_equipment_id ON exercises(equipment_id);
CREATE INDEX idx_exercise_templates_name ON exercise_templates(name);
CREATE INDEX idx_exercise_templates_category ON exercise_templates(exercise_category);
CREATE INDEX idx_exercise_templates_type ON exercise_templates(exercise_type);
CREATE INDEX idx_exercise_templates_category_type ON exercise_templates(exercise_category, exercise_type);
CREATE INDEX idx_exercise_templates_equipment_id ON exercise_templates(equipment_id);
CREATE INDEX idx_equipment_name ON equipment(name);
CREATE INDEX idx_equipment_category ON equipment(category);
CREATE INDEX idx_equipment_active ON equipment(is_active);
CREATE INDEX idx_workout_templates_tenant_id ON workout_templates(tenant_id);
CREATE INDEX idx_workout_templates_user_id ON workout_templates(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_workout_templates_scope ON workout_templates(scope);
CREATE INDEX idx_workout_templates_tenant_scope ON workout_templates(tenant_id, scope);
CREATE INDEX idx_workout_templates_name ON workout_templates(name);
CREATE INDEX idx_workout_templates_active ON workout_templates(is_active) WHERE is_active = true;
CREATE INDEX idx_sessions_tenant_user_started ON sessions(tenant_id, user_id, started_at DESC);
CREATE INDEX idx_sessions_category ON sessions(tenant_id, category, started_at DESC);
CREATE INDEX idx_sessions_user_completed ON sessions(user_id, completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_sets_session_exercise ON sets(session_id, exercise_id, set_index);
CREATE INDEX idx_sets_tenant_exercise ON sets(tenant_id, exercise_id, created_at DESC);
CREATE INDEX idx_sets_exercise_session ON sets(exercise_id, session_id);

-- Create unique constraints for workout templates to prevent duplicate names
CREATE UNIQUE INDEX idx_workout_templates_unique_user_name 
ON workout_templates(user_id, tenant_id, name) 
WHERE user_id IS NOT NULL AND is_active = true;

CREATE UNIQUE INDEX idx_workout_templates_unique_tenant_name 
ON workout_templates(tenant_id, name) 
WHERE user_id IS NULL AND scope = 'tenant' AND is_active = true;

CREATE UNIQUE INDEX idx_workout_templates_unique_system_name 
ON workout_templates(name) 
WHERE scope = 'system' AND is_active = true;

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
    
    -- Total duration (in minutes)
    COALESCE(SUM(
        CASE 
            WHEN st.value_1_type = 'duration_m' THEN st.value_1_numeric
            WHEN st.value_2_type = 'duration_m' THEN st.value_2_numeric
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
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
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
-- Note: equipment table has no RLS policy as it's global

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

CREATE POLICY workout_template_isolation_policy ON workout_templates
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
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercise_templates_updated_at BEFORE UPDATE ON exercise_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workout_templates_updated_at BEFORE UPDATE ON workout_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sets_updated_at BEFORE UPDATE ON sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_program_assignments_updated_at BEFORE UPDATE ON program_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial data

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

-- Insert common equipment items
INSERT INTO equipment (name, category, description) VALUES
-- Free Weights
('Barbell', 'free_weights', 'Standard Olympic barbell'),
('Dumbbells', 'free_weights', 'Adjustable or fixed weight dumbbells'),
('Kettlebell', 'free_weights', 'Cast iron or steel kettlebell'),
('Weight Plates', 'free_weights', 'Olympic weight plates'),
('EZ Curl Bar', 'free_weights', 'Curved barbell for curls'),

-- Machines
('Cable Machine', 'machines', 'Cable crossover machine'),
('Leg Press Machine', 'machines', 'Seated or angled leg press'),
('Lat Pulldown Machine', 'machines', 'Seated lat pulldown'),
('Chest Press Machine', 'machines', 'Seated chest press'),
('Smith Machine', 'machines', 'Guided barbell machine'),
('Leg Curl Machine', 'machines', 'Seated or lying leg curl'),
('Leg Extension Machine', 'machines', 'Seated leg extension'),

-- Cardio Equipment
('Treadmill', 'cardio', 'Motorized running machine'),
('Stationary Bike', 'cardio', 'Exercise bike'),
('Rowing Machine', 'cardio', 'Indoor rowing ergometer'),
('Elliptical', 'cardio', 'Elliptical cross-trainer'),
('Stair Climber', 'cardio', 'Stair climbing machine'),

-- Resistance Equipment
('Resistance Bands', 'resistance', 'Elastic resistance bands'),
('Suspension Trainer', 'resistance', 'TRX or similar suspension system'),
('Pull-up Bar', 'resistance', 'Fixed or doorway pull-up bar'),

-- Bodyweight
('None', 'bodyweight', 'No equipment required'),
('Mat', 'bodyweight', 'Exercise mat for floor exercises'),

-- Other
('Medicine Ball', 'other', 'Weighted exercise ball'),
('Foam Roller', 'other', 'Muscle recovery roller'),
('Balance Ball', 'other', 'Large exercise/stability ball'),
('Bosu Ball', 'other', 'Half-sphere balance trainer'),
('Battle Ropes', 'other', 'Heavy training ropes'),
('Plyo Box', 'other', 'Jumping/step platform'),
('Agility Ladder', 'other', 'Speed and agility training ladder');

-- Insert sample workout templates
INSERT INTO workout_templates (
    template_id,
    tenant_id,
    user_id,
    name,
    description,
    scope,
    exercises,
    created_by,
    updated_by
) VALUES 
(
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000000'::UUID,
    NULL,
    'Push Day',
    'Upper body pushing movements',
    'system',
    '[
        {
            "exercise_id": null,
            "name": "Bench Press",
            "category": "strength",
            "muscle_groups": ["chest", "triceps", "shoulders"],
            "sets": 4,
            "reps": "8-10",
            "notes": "Focus on controlled movement",
            "order": 0
        },
        {
            "exercise_id": null,
            "name": "Overhead Press",
            "category": "strength", 
            "muscle_groups": ["shoulders", "triceps"],
            "sets": 3,
            "reps": "6-8",
            "notes": "Keep core tight",
            "order": 1
        },
        {
            "exercise_id": null,
            "name": "Dips",
            "category": "strength",
            "muscle_groups": ["triceps", "chest"],
            "sets": 3,
            "reps": "10-12",
            "notes": "Use assistance if needed",
            "order": 2
        }
    ]'::jsonb,
    NULL,
    NULL
),
(
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000000'::UUID,
    NULL,
    'Pull Day',
    'Upper body pulling movements',
    'system',
    '[
        {
            "exercise_id": null,
            "name": "Pull-ups",
            "category": "strength",
            "muscle_groups": ["lats", "biceps"],
            "sets": 4,
            "reps": "6-8",
            "notes": "Full range of motion",
            "order": 0
        },
        {
            "exercise_id": null,
            "name": "Barbell Rows",
            "category": "strength",
            "muscle_groups": ["lats", "rhomboids", "biceps"],
            "sets": 4,
            "reps": "8-10", 
            "notes": "Keep back straight",
            "order": 1
        },
        {
            "exercise_id": null,
            "name": "Face Pulls",
            "category": "strength",
            "muscle_groups": ["rear_delts", "rhomboids"],
            "sets": 3,
            "reps": "12-15",
            "notes": "High rep rear delt work",
            "order": 2
        }
    ]'::jsonb,
    NULL,
    NULL
),
(
    uuid_generate_v4(),
    '00000000-0000-0000-0000-000000000000'::UUID,
    NULL,
    'Leg Day',
    'Lower body strength training',
    'system',
    '[
        {
            "exercise_id": null,
            "name": "Squats",
            "category": "strength",
            "muscle_groups": ["quads", "glutes"],
            "sets": 4,
            "reps": "8-10",
            "notes": "Full depth",
            "order": 0
        },
        {
            "exercise_id": null,
            "name": "Romanian Deadlifts",
            "category": "strength",
            "muscle_groups": ["hamstrings", "glutes"],
            "sets": 3,
            "reps": "10-12",
            "notes": "Feel the stretch",
            "order": 1
        },
        {
            "exercise_id": null,
            "name": "Walking Lunges",
            "category": "strength",
            "muscle_groups": ["quads", "glutes"],
            "sets": 3,
            "reps": "12 each leg",
            "notes": "Step out far",
            "order": 2
        }
    ]'::jsonb,
    NULL,
    NULL
);

-- Insert comprehensive exercise template library (98 templates)
INSERT INTO exercise_templates (
    name, 
    muscle_groups, 
    equipment, 
    exercise_category, 
    exercise_type, 
    default_value_1_type, 
    default_value_2_type,
    description,
    instructions
) VALUES

-- ============================================
-- STRENGTH TRAINING TEMPLATES (68 templates)
-- ============================================

-- COMPOUND STRENGTH MOVEMENTS
('Barbell Back Squat', ARRAY['quadriceps', 'glutes', 'hamstrings', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Foundation movement for lower body strength and power', 'Feet shoulder-width apart, bar on upper traps, descend until thighs parallel, drive through heels'),
('Conventional Deadlift', ARRAY['hamstrings', 'glutes', 'back', 'traps', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Total body strength builder, essential for hybrid athletes', 'Feet hip-width apart, grip bar outside legs, lift by extending hips and knees simultaneously'),
('Bench Press', ARRAY['chest', 'triceps', 'shoulders'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper body pressing strength for power transfer', 'Retract shoulder blades, lower bar to chest, press up explosively'),
('Overhead Press', ARRAY['shoulders', 'triceps', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Vertical pressing power for athletic performance', 'Start at shoulder height, press overhead without arching back excessively'),
('Pull-ups', ARRAY['lats', 'rhomboids', 'biceps', 'rear delts'], 'pull-up bar', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper body pulling strength and grip endurance', 'Dead hang start, pull until chin over bar, control descent'),

-- FUNCTIONAL STRENGTH
('Front Squat', ARRAY['quadriceps', 'glutes', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Builds anterior core strength and upright posture', 'Bar rests on front delts, keep chest up, descend and drive up'),
('Romanian Deadlift', ARRAY['hamstrings', 'glutes', 'back'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Hamstring and glute strength for running power', 'Slight knee bend, hinge at hips, feel stretch in hamstrings'),
('Single-Arm Dumbbell Row', ARRAY['lats', 'rhomboids', 'rear delts'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral pulling strength and core stability', 'One hand on bench, pull dumbbell to hip, squeeze shoulder blade'),
('Dumbbell Thrusters', ARRAY['full body'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full body power and endurance exercise', 'Squat down, explosively stand and press dumbbells overhead'),
('Turkish Get-Up', ARRAY['core', 'shoulders', 'hips'], 'kettlebell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Total body stability and strength', 'Complex movement from lying to standing with weight overhead'),

-- OLYMPIC & POWER MOVEMENTS
('Power Clean', ARRAY['full body'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive power development for athletic performance', 'Explosive hip extension, pull bar to front rack position'),
('Squat Clean', ARRAY['hamstrings', 'glutes', 'quadriceps', 'traps', 'shoulders'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full squat clean Olympic lift', 'Pull bar from floor to shoulders catching in full squat'),
('Power Snatch', ARRAY['hamstrings', 'glutes', 'traps', 'shoulders'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Power position snatch Olympic lift', 'Pull bar explosively from floor overhead in power position'),
('Squat Snatch', ARRAY['hamstrings', 'glutes', 'quadriceps', 'traps', 'shoulders'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Full squat snatch Olympic lift', 'Pull bar from floor overhead catching in full squat'),
('Push Jerk', ARRAY['shoulders', 'triceps', 'legs', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive overhead pressing movement', 'Dip and drive bar overhead, press out from power position'),
('Split Jerk', ARRAY['shoulders', 'triceps', 'legs', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Split stance overhead jerk', 'Dip and drive bar overhead, catch in split stance'),
('Thruster', ARRAY['quadriceps', 'glutes', 'shoulders', 'triceps'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Front squat to overhead press combination', 'Front squat down then drive up pressing bar overhead'),

-- PLYOMETRIC & EXPLOSIVE
('Box Jumps', ARRAY['legs', 'glutes'], 'plyometric box', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Plyometric power for jumping and sprinting', 'Explosive jump onto box, soft landing, step down'),
('Box Jump Over', ARRAY['legs', 'glutes', 'calves'], 'box', 'strength', 'STRENGTH', 'reps', NULL, 'Box jump with step or jump over', 'Jump onto box, step or jump over to other side'),
('Medicine Ball Slams', ARRAY['core', 'shoulders'], 'medicine ball', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Explosive power and core strength', 'Slam ball down with maximum force, pick up and repeat'),
('Wall Ball Shot', ARRAY['legs', 'shoulders', 'core'], 'medicine ball', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Squat to overhead throw against wall', 'Squat down, explode up throwing ball to wall target'),
('Kettlebell Swings', ARRAY['glutes', 'hamstrings', 'core'], 'kettlebell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Hip power and endurance bridge to cardio', 'Hip hinge movement, explosive hip extension, kettlebell to eye level'),
('Broad Jumps', ARRAY['legs', 'glutes'], 'bodyweight', 'strength', 'STRENGTH', 'distance_m', 'reps', 'Horizontal power development', 'Explosive forward jump, soft landing, measure distance'),

-- UNILATERAL STRENGTH
('Bulgarian Split Squats', ARRAY['quadriceps', 'glutes'], 'bodyweight', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Single leg strength and stability', 'Rear foot elevated, descend on front leg, drive up'),
('Single-Leg Deadlifts', ARRAY['hamstrings', 'glutes', 'core'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral posterior chain and balance', 'Hinge at hip on one leg, opposite leg extends back'),
('Walking Lunges', ARRAY['quadriceps', 'glutes', 'hamstrings'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Dynamic leg strength and stability', 'Step forward into lunge, drive up and step through'),
('Single-Arm Overhead Press', ARRAY['shoulders', 'core'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral pressing and anti-lateral flexion', 'Press one arm overhead while maintaining upright posture'),
('Pistol Squats', ARRAY['quadriceps', 'glutes', 'core'], 'bodyweight', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Advanced single leg strength', 'Squat on one leg, opposite leg extended forward'),

-- UPPER BODY PUSH
('Incline Dumbbell Press', ARRAY['chest', 'shoulders', 'triceps'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Upper chest focused press', 'Incline bench, press dumbbells up and together'),
('Push-ups', ARRAY['chest', 'triceps', 'shoulders'], 'bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Bodyweight pushing exercise', 'Plank position, lower chest to floor, push up'),
('Push Press', ARRAY['shoulders', 'triceps', 'legs', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Leg drive assisted overhead press', 'Slight dip and drive to assist press overhead'),
('Strict Press', ARRAY['shoulders', 'triceps', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Strict overhead barbell press', 'No leg drive, press bar overhead from shoulders'),
('Landmine Press', ARRAY['shoulders', 'chest', 'core'], 'barbell', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Unilateral pressing movement', 'One arm press of landmine barbell'),

-- HANDSTAND VARIATIONS
('Strict Handstand Push-Up', ARRAY['shoulders', 'triceps', 'core'], 'wall', 'strength', 'STRENGTH', 'reps', NULL, 'Strict handstand push-up against wall', 'Handstand against wall, lower head to floor, press up'),
('Kipping Handstand Push-Up', ARRAY['shoulders', 'triceps', 'core'], 'wall', 'strength', 'STRENGTH', 'reps', NULL, 'Kipping handstand push-up with leg drive', 'Handstand with kip to assist pressing movement'),
('Handstand Walk', ARRAY['shoulders', 'core', 'wrists'], 'open space', 'strength', 'STRENGTH', 'distance_m', NULL, 'Walking on hands in handstand position', 'Kick to handstand, walk forward on hands'),

-- UPPER BODY PULL
('Lat Pull Down Wide', ARRAY['lats', 'rhomboids', 'biceps'], 'cable machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Wide grip lat pulldown', 'Wide grip, pull bar to chest, control return'),
('Lat Pull Down Narrow', ARRAY['lats', 'rhomboids', 'biceps'], 'cable machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Narrow grip lat pulldown', 'Close grip, pull bar to chest focusing on lats'),
('Seated Row', ARRAY['rhomboids', 'mid_traps', 'biceps'], 'cable machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Horizontal pulling exercise', 'Seated, pull handle to torso, squeeze shoulder blades'),
('Ring Rows', ARRAY['rhomboids', 'lats', 'biceps'], 'gymnastic rings', 'strength', 'STRENGTH', 'reps', NULL, 'Bodyweight horizontal pull', 'Hang from rings, pull chest to rings'),

-- PULL-UP VARIATIONS
('Strict Pull-Up', ARRAY['lats', 'rhomboids', 'biceps'], 'pull-up bar', 'strength', 'STRENGTH', 'reps', NULL, 'Dead hang strict pull-up', 'Dead hang, pull chin over bar without swinging'),
('Kipping Pull-Up', ARRAY['lats', 'rhomboids', 'core'], 'pull-up bar', 'strength', 'STRENGTH', 'reps', NULL, 'Dynamic kipping pull-up', 'Use body momentum to assist pull-up movement'),
('Butterfly Pull-Up', ARRAY['lats', 'rhomboids', 'core'], 'pull-up bar', 'strength', 'STRENGTH', 'reps', NULL, 'Continuous butterfly pull-up', 'Continuous cycling motion for high reps'),
('Chest-to-Bar Pull-Up', ARRAY['lats', 'rhomboids', 'biceps'], 'pull-up bar', 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up with chest touching bar', 'Pull high enough for chest to touch bar'),

-- MUSCLE-UP VARIATIONS
('Bar Muscle-Up', ARRAY['lats', 'chest', 'triceps', 'core'], 'pull-up bar', 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up to dip transition on bar', 'Pull-up transitioning to dip above bar'),
('Ring Muscle-Up', ARRAY['lats', 'chest', 'triceps', 'core'], 'gymnastic rings', 'strength', 'STRENGTH', 'reps', NULL, 'Pull-up to dip transition on rings', 'Pull-up transitioning to dip above rings'),

-- DIP VARIATIONS
('Ring Dip', ARRAY['chest', 'triceps', 'shoulders'], 'gymnastic rings', 'strength', 'STRENGTH', 'reps', NULL, 'Dips performed on gymnastic rings', 'Support on rings, lower body, press up'),
('Bar Dip', ARRAY['chest', 'triceps', 'shoulders'], 'parallel bars', 'strength', 'STRENGTH', 'reps', NULL, 'Dips performed on parallel bars', 'Support on bars, lower body, press up'),

-- CORE STRENGTH
('Plank', ARRAY['core'], 'bodyweight', 'strength', 'STRENGTH', 'duration_m', 'reps', 'Isometric core strength and stability', 'Maintain straight line from head to heels'),
('Dead Bug', ARRAY['core'], 'bodyweight', 'strength', 'STRENGTH', 'reps', 'duration_m', 'Core stability and limb dissociation', 'Lying on back, extend opposite arm and leg slowly'),
('Pallof Press', ARRAY['core'], 'resistance band', 'strength', 'STRENGTH', 'reps', 'duration_m', 'Anti-rotation core strength', 'Hold band at chest, press out and resist rotation'),
('Hanging Leg Raises', ARRAY['core', 'hip flexors'], 'pull-up bar', 'strength', 'STRENGTH', 'reps', 'duration_m', 'Dynamic core strength', 'Hang from bar, raise legs to 90 degrees'),
('Bird Dog', ARRAY['core', 'glutes'], 'bodyweight', 'strength', 'STRENGTH', 'reps', 'duration_m', 'Core stability and hip strength', 'On hands and knees, extend opposite arm and leg'),
('GHD Back', ARRAY['lower_back', 'glutes', 'hamstrings'], 'GHD machine', 'strength', 'STRENGTH', 'reps', NULL, 'Posterior chain strengthening', 'GHD machine, extend back engaging posterior chain'),
('GHD Situps', ARRAY['abs', 'hip_flexors'], 'GHD machine', 'strength', 'STRENGTH', 'reps', NULL, 'Core strengthening exercise', 'GHD machine, full range sit-up movement'),
('Toes-to-Bar', ARRAY['abs', 'hip_flexors', 'lats'], 'pull-up bar', 'strength', 'STRENGTH', 'reps', NULL, 'Hanging toes to bar movement', 'Hang from bar, bring toes up to touch bar'),
('Sit-Up', ARRAY['abs', 'hip_flexors'], 'bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Traditional sit-up exercise', 'Lie down, sit up bringing torso to knees'),

-- FUNCTIONAL/CROSSFIT STYLE
('Sled Push', ARRAY['legs', 'glutes', 'core'], 'weight sled', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Functional pushing exercise', 'Push weighted sled forward with arms extended'),
('Sled Pull', ARRAY['lats', 'rhomboids', 'legs'], 'weight sled', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Functional pulling exercise', 'Pull weighted sled backward walking backwards'),
('Farmers Carry', ARRAY['traps', 'forearms', 'core'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'distance_m', 'Grip and core strength', 'Carry heavy weights at sides walking forward'),
('Rope Climb', ARRAY['lats', 'biceps', 'forearms', 'core'], 'climbing rope', 'strength', 'STRENGTH', 'distance_m', NULL, 'Rope climbing exercise', 'Climb rope using arms and legs to ascend'),

-- BURPEE VARIATIONS
('Burpee', ARRAY['chest', 'legs', 'core'], 'bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Full body burpee movement', 'Squat, jump back to plank, push-up, jump forward, jump up'),
('Bar-Facing Burpee', ARRAY['chest', 'legs', 'core'], 'barbell', 'strength', 'STRENGTH', 'reps', NULL, 'Burpee facing and jumping over barbell', 'Burpee next to bar, jump laterally over bar'),
('Lateral Burpee', ARRAY['chest', 'legs', 'core'], 'bodyweight', 'strength', 'STRENGTH', 'reps', NULL, 'Burpee with lateral movement', 'Burpee moving laterally with each rep'),

-- ISOLATION & ACCESSORY
('Dumbbell Biceps Curl', ARRAY['biceps'], 'dumbbells', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated biceps exercise', 'Standing, curl dumbbells toward shoulders'),
('Cable Triceps Push', ARRAY['triceps'], 'cable machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated triceps exercise', 'High cable, push down extending triceps'),
('Leg Extensions', ARRAY['quadriceps'], 'leg extension machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated quadriceps exercise', 'Sit on machine, extend legs against resistance'),
('Leg Curl', ARRAY['hamstrings'], 'leg curl machine', 'strength', 'STRENGTH', 'weight_kg', 'reps', 'Isolated hamstring exercise', 'Lie prone, curl heels toward glutes'),

-- ============================================
-- CARDIO TRAINING TEMPLATES (30 templates)
-- ============================================

-- RUNNING VARIATIONS
('Easy Run', ARRAY['cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Aerobic base building for endurance', 'Conversational pace, nose breathing, relaxed effort'),
('Tempo Run', ARRAY['cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Lactate threshold training', 'Comfortably hard pace, sustainable for 20-60 minutes'),
('Interval Running', ARRAY['cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'High-intensity aerobic power', 'Alternating high and low intensity periods'),
('Hill Sprints', ARRAY['legs', 'cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'reps', 'Power endurance and lactate tolerance', 'Maximum effort uphill sprints with recovery'),
('Fartlek Run', ARRAY['cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Unstructured speed play training', 'Varying pace throughout run, play with speed'),
('Run', ARRAY['legs', 'glutes', 'calves'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Running for cardiovascular fitness', 'Outdoor or treadmill running at various paces'),

-- CYCLING VARIATIONS
('Zone 2 Cycling', ARRAY['legs', 'cardiovascular'], 'bicycle', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Aerobic base building on bike', 'Steady moderate effort, can maintain conversation'),
('Bike Intervals', ARRAY['legs', 'cardiovascular'], 'bicycle', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'High-intensity cycling power', 'Alternating high power and recovery periods'),
('Hill Cycling', ARRAY['legs', 'cardiovascular'], 'bicycle', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Climbing strength and endurance', 'Sustained efforts on inclines'),
('Spin Bike HIIT', ARRAY['legs', 'cardiovascular'], 'spin bike', 'cardio', 'CARDIO', 'duration_m', 'calories', 'High-intensity interval training', 'Short bursts of maximum effort with rest'),

-- SWIMMING
('Freestyle Swimming', ARRAY['full body', 'cardiovascular'], 'pool', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Low-impact full body cardio', 'Efficient stroke technique, bilateral breathing'),
('Swimming Intervals', ARRAY['full body', 'cardiovascular'], 'pool', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'High-intensity swim training', 'Alternating fast and recovery swimming'),

-- ROWING
('Steady State Rowing', ARRAY['back', 'legs', 'cardiovascular'], 'rowing machine', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Full body aerobic exercise', 'Consistent pace, proper technique: legs, back, arms'),
('Rowing Intervals', ARRAY['back', 'legs', 'cardiovascular'], 'rowing machine', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'High-intensity rowing power', 'Alternating high and low intensity periods'),
('Row', ARRAY['lats', 'rhomboids', 'legs'], 'rowing machine', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Full body rowing exercise', 'Rowing machine with proper drive and recovery'),

-- MACHINE CARDIO
('Echo Bike', ARRAY['legs', 'arms', 'core'], 'echo bike', 'cardio', 'CARDIO', 'calories', 'duration_m', 'Full body cardio exercise', 'Bike using both arms and legs for max calorie burn'),
('Ski-erg', ARRAY['lats', 'core', 'legs'], 'ski erg machine', 'cardio', 'CARDIO', 'calories', 'duration_m', 'Full body pulling cardio', 'Simulate skiing motion for cardio and upper body'),
('Assault Bike', ARRAY['full body', 'cardiovascular'], 'assault bike', 'cardio', 'CARDIO', 'distance_m', 'calories', 'Full body cardio machine', 'Push and pull with arms while pedaling'),
('Ski Erg', ARRAY['full body', 'cardiovascular'], 'ski erg', 'cardio', 'CARDIO', 'distance_m', 'calories', 'Upper body dominant cardio', 'Pulling motion similar to skiing'),
('Stair Climber', ARRAY['legs', 'cardiovascular'], 'stair climber', 'cardio', 'CARDIO', 'duration_m', 'calories', 'Lower body cardio endurance', 'Maintain upright posture, avoid leaning on handles'),
('Elliptical', ARRAY['full body', 'cardiovascular'], 'elliptical', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Low-impact full body cardio', 'Smooth stride, use arms and legs'),

-- HIGH-INTENSITY CARDIO
('Mountain Climbers', ARRAY['core', 'cardiovascular'], 'bodyweight', 'cardio', 'CARDIO', 'reps', 'duration_m', 'Core strength and cardio endurance', 'Plank position, alternate bringing knees to chest rapidly'),
('High Knees', ARRAY['hip flexors', 'cardiovascular'], 'bodyweight', 'cardio', 'CARDIO', 'duration_m', 'reps', 'Dynamic cardio and leg turnover', 'Run in place, bring knees to chest level'),
('Battle Ropes', ARRAY['arms', 'core', 'cardiovascular'], 'battle ropes', 'cardio', 'CARDIO', 'duration_m', 'reps', 'Upper body cardio and power endurance', 'Alternate or simultaneous rope waves'),

-- JUMP ROPE
('Single-Under', ARRAY['calves', 'shoulders', 'forearms'], 'jump rope', 'cardio', 'CARDIO', 'reps', 'duration_m', 'Single jump rope revolution per jump', 'Jump rope with one rope revolution per jump'),
('Double-Under', ARRAY['calves', 'shoulders', 'forearms'], 'jump rope', 'cardio', 'CARDIO', 'reps', 'duration_m', 'Double jump rope revolution per jump', 'Jump rope with two rope revolutions per jump'),
('Jump Rope', ARRAY['calves', 'cardiovascular'], 'jump rope', 'cardio', 'CARDIO', 'duration_m', 'reps', 'Coordination and cardio endurance', 'Light bounces, stay on balls of feet, relaxed arms'),

-- RECOVERY/ACTIVE RECOVERY CARDIO
('Walking', ARRAY['cardiovascular'], 'none', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Active recovery and base fitness', 'Brisk pace, focus on posture and breathing'),
('Easy Bike Ride', ARRAY['legs', 'cardiovascular'], 'bicycle', 'cardio', 'CARDIO', 'distance_m', 'duration_m', 'Low-intensity recovery exercise', 'Gentle pace, enjoy the ride, active recovery'),
('Pool Walking', ARRAY['legs', 'cardiovascular'], 'pool', 'cardio', 'CARDIO', 'duration_m', 'distance_m', 'Low-impact recovery exercise', 'Walk in waist-deep water, resistance without impact');

-- Add comments
COMMENT ON TYPE set_value_type IS 'Value types for exercise measurements. Duration is stored in minutes (duration_m).';
COMMENT ON TABLE equipment IS 'Global equipment catalog used by exercises and exercise templates';
COMMENT ON TABLE workout_templates IS 'Reusable workout templates that can be scoped to user, tenant, or system level';
COMMENT ON COLUMN workout_templates.scope IS 'Determines visibility: user (private), tenant (shared within organization), system (global)';
COMMENT ON COLUMN workout_templates.exercises IS 'JSONB array of exercise definitions with sets, reps, and configuration';

-- Final verification message
DO $$
DECLARE
    template_count INTEGER;
    strength_count INTEGER;
    cardio_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO template_count FROM exercise_templates;
    SELECT COUNT(*) INTO strength_count FROM exercise_templates WHERE exercise_type = 'STRENGTH';
    SELECT COUNT(*) INTO cardio_count FROM exercise_templates WHERE exercise_type = 'CARDIO';
    
    RAISE NOTICE 'Consolidated database schema created successfully!';
    RAISE NOTICE 'Schema includes: Core tables, workout templates, equipment management, analytics views, and RLS policies';
    RAISE NOTICE 'Duration values are stored in minutes (duration_m) throughout the system';
    RAISE NOTICE 'Exercise Templates loaded: % total (% strength, % cardio)', template_count, strength_count, cardio_count;
    RAISE NOTICE 'Expected: 98 total (68 strength, 30 cardio)';
    
    IF template_count = 98 AND strength_count = 68 AND cardio_count = 30 THEN
        RAISE NOTICE '✅ All 98 exercise templates loaded successfully!';
    ELSE
        RAISE WARNING '⚠️  Exercise template count mismatch. Expected 98 total, got %', template_count;
    END IF;
END $$;