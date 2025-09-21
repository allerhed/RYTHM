-- 004_workout_templates.sql

-- Create workout templates table
CREATE TABLE workout_templates (
    template_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create indexes for efficient querying
CREATE INDEX idx_workout_templates_tenant_id ON workout_templates(tenant_id);
CREATE INDEX idx_workout_templates_user_id ON workout_templates(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_workout_templates_scope ON workout_templates(scope);
CREATE INDEX idx_workout_templates_tenant_scope ON workout_templates(tenant_id, scope);
CREATE INDEX idx_workout_templates_name ON workout_templates(name);
CREATE INDEX idx_workout_templates_active ON workout_templates(is_active) WHERE is_active = true;

-- Create unique constraint to prevent duplicate names per user/tenant
CREATE UNIQUE INDEX idx_workout_templates_unique_user_name 
ON workout_templates(user_id, tenant_id, name) 
WHERE user_id IS NOT NULL AND is_active = true;

CREATE UNIQUE INDEX idx_workout_templates_unique_tenant_name 
ON workout_templates(tenant_id, name) 
WHERE user_id IS NULL AND scope = 'tenant' AND is_active = true;

CREATE UNIQUE INDEX idx_workout_templates_unique_system_name 
ON workout_templates(name) 
WHERE scope = 'system' AND is_active = true;

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_workout_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_workout_templates_updated_at
    BEFORE UPDATE ON workout_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_workout_templates_updated_at();

-- Insert some sample system templates
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
    gen_random_uuid(),
    (SELECT tenant_id FROM tenants LIMIT 1), -- System tenant
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
    gen_random_uuid(),
    (SELECT tenant_id FROM tenants LIMIT 1), -- System tenant
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
    gen_random_uuid(),
    (SELECT tenant_id FROM tenants LIMIT 1), -- System tenant
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