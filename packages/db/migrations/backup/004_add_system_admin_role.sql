-- Migration: 004_add_system_admin_role.sql
-- Description: Add system_admin role to user_role enum and create admin users

-- Add system_admin to the user_role enum
ALTER TYPE user_role ADD VALUE 'system_admin';

-- Create a special tenant for system administrators
-- Using a well-known UUID for admin tenant for consistency
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