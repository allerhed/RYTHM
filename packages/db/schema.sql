-- RYTHM Database Schema v1.1
-- Complete schema matching current development database structure
-- This file represents the consolidated state after all migrations

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create custom types
CREATE TYPE session_category AS ENUM ('strength', 'cardio', 'hybrid');
CREATE TYPE set_value_type AS ENUM ('weight_kg', 'distance_m', 'duration_m', 'calories', 'reps');
CREATE TYPE user_role AS ENUM ('athlete', 'coach', 'tenant_admin', 'org_admin');
CREATE TYPE exercise_type AS ENUM ('STRENGTH', 'CARDIO');

-- Tenants table (root of multi-tenancy)
CREATE TABLE tenants (
    tenant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    branding JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table with multi-tenant support
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

-- Exercise templates (global, non-tenant specific)
CREATE TABLE exercise_templates (
    template_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    muscle_groups TEXT[] NOT NULL DEFAULT '{}',
    equipment_id UUID REFERENCES equipment(equipment_id),
    exercise_category TEXT DEFAULT 'strength' CHECK (exercise_category = ANY (ARRAY['strength', 'cardio', 'flexibility', 'sports'])),
    exercise_type exercise_type NOT NULL,
    default_value_1_type set_value_type,
    default_value_2_type set_value_type,
    description TEXT,
    instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exercises table (global, non-tenant specific)
CREATE TABLE exercises (
    exercise_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    muscle_groups TEXT[] NOT NULL DEFAULT '{}',
    equipment_id UUID REFERENCES equipment(equipment_id),
    media JSONB DEFAULT '{}',
    notes TEXT,
    default_value_1_type set_value_type,
    default_value_2_type set_value_type,
    exercise_category TEXT DEFAULT 'strength' CHECK (exercise_category = ANY (ARRAY['strength', 'cardio', 'flexibility', 'sports'])),
    exercise_type exercise_type,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(name)
);

-- Equipment table (global, non-tenant specific)
CREATE TABLE equipment (
    equipment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE CHECK (length(name) > 0 AND length(name) <= 255),
    category TEXT DEFAULT 'other' CHECK (category = ANY (ARRAY['free_weights', 'machines', 'cardio', 'bodyweight', 'resistance', 'other'])),
    description TEXT,
    is_active BOOLEAN DEFAULT true,
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

-- Sessions table with enhanced fields
CREATE TABLE sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    program_id UUID REFERENCES programs(program_id) ON DELETE SET NULL,
    name TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    category session_category NOT NULL,
    notes TEXT,
    training_load INTEGER CHECK (training_load >= 0),
    perceived_exertion NUMERIC(3,1) CHECK (perceived_exertion >= 1.0 AND perceived_exertion <= 10.0),
    duration_seconds INTEGER DEFAULT 3600 CHECK (duration_seconds > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

-- Migrations tracking table
CREATE TABLE migrations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);
CREATE UNIQUE INDEX idx_exercises_name_unique ON exercises(name);
CREATE INDEX idx_exercises_type ON exercises(exercise_type);
CREATE INDEX idx_exercises_default_types ON exercises(default_value_1_type, default_value_2_type);
CREATE INDEX idx_exercises_equipment_id ON exercises(equipment_id);
CREATE INDEX idx_exercise_templates_name ON exercise_templates(name);
CREATE INDEX idx_exercise_templates_type ON exercise_templates(exercise_type);
CREATE INDEX idx_exercise_templates_category ON exercise_templates(exercise_category);
CREATE INDEX idx_exercise_templates_category_type ON exercise_templates(exercise_category, exercise_type);
CREATE INDEX idx_exercise_templates_equipment_id ON exercise_templates(equipment_id);
CREATE INDEX idx_equipment_name ON equipment(name);
CREATE INDEX idx_equipment_category ON equipment(category);
CREATE INDEX idx_equipment_active ON equipment(is_active);
CREATE INDEX idx_sessions_tenant_user_started ON sessions(tenant_id, user_id, started_at DESC);
CREATE INDEX idx_sessions_category ON sessions(tenant_id, category, started_at DESC);
CREATE INDEX idx_sessions_user_completed ON sessions(user_id, completed_at) WHERE completed_at IS NOT NULL;
CREATE INDEX idx_sets_session_exercise ON sets(session_id, exercise_id, set_index);
CREATE INDEX idx_sets_tenant_exercise ON sets(tenant_id, exercise_id, created_at DESC);
CREATE INDEX idx_sets_exercise_session ON sets(exercise_id, session_id);

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exercise_templates_updated_at BEFORE UPDATE ON exercise_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_programs_updated_at BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sets_updated_at BEFORE UPDATE ON sets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_program_assignments_updated_at BEFORE UPDATE ON program_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Helper Functions
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        (current_setting('rythm.current_tenant_id', true))::UUID,
        '00000000-0000-0000-0000-000000000000'::UUID
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN current_setting('rythm.user_role', true) = 'org_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all multi-tenant tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tenant isolation
CREATE POLICY tenant_isolation_policy ON tenants
    USING (is_org_admin() OR tenant_id = current_tenant_id());

CREATE POLICY user_isolation_policy ON users
    USING (is_org_admin() OR tenant_id = current_tenant_id());

CREATE POLICY program_isolation_policy ON programs
    USING (is_org_admin() OR tenant_id = current_tenant_id());

CREATE POLICY workout_isolation_policy ON workouts
    USING (is_org_admin() OR tenant_id = current_tenant_id());

CREATE POLICY session_isolation_policy ON sessions
    USING (is_org_admin() OR tenant_id = current_tenant_id());

CREATE POLICY session_user_policy ON sessions
    USING (
        tenant_id = current_tenant_id() AND (
            user_id = (current_setting('rythm.current_user_id', true))::UUID OR
            current_setting('rythm.user_role', true) = ANY(ARRAY['coach', 'tenant_admin'])
        )
    );

CREATE POLICY set_isolation_policy ON sets
    USING (is_org_admin() OR tenant_id = current_tenant_id());

CREATE POLICY program_assignment_isolation_policy ON program_assignments
    USING (is_org_admin() OR tenant_id = current_tenant_id());

-- Exercises and exercise_templates are global (no RLS)
-- They can be accessed by all tenants