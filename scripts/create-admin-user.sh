#!/usr/bin/env bash
set -euo pipefail

# Script to create admin user: orchestrator@rythm.training
# This script creates a tenant and admin user for the RYTHM platform

echo "🔧 Creating admin user: orchestrator@rythm.training"

# Database connection details
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="rythm"
DB_USER="rythm_api"
DB_PASSWORD="password"

# User details
EMAIL="orchestrator@rythm.training"
PASSWORD="Password123"
FIRST_NAME="System"
LAST_NAME="Orchestrator"
TENANT_NAME="RYTHM Admin"

echo "📊 Connecting to database..."

# Create the admin user with bcrypt hashed password
docker exec -i rythm-db-1 psql -U "$DB_USER" -d "$DB_NAME" << EOF
-- Create tenant for admin user if it doesn't exist
DO \$\$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM tenants WHERE name = '$TENANT_NAME') THEN
        INSERT INTO tenants (tenant_id, name, branding, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            '$TENANT_NAME',
            '{"theme": "admin", "logo": null}',
            NOW(),
            NOW()
        );
    END IF;
END \$\$;

-- Create admin user with bcrypt hashed password
-- Password: $PASSWORD (hashed with bcrypt rounds=10)
DO \$\$
DECLARE
    admin_tenant_id UUID;
BEGIN
    -- Get the tenant ID
    SELECT tenant_id INTO admin_tenant_id FROM tenants WHERE name = '$TENANT_NAME' LIMIT 1;
    
    -- Insert or update the user
    INSERT INTO users (
        user_id,
        tenant_id,
        email,
        password_hash,
        role,
        first_name,
        last_name,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        admin_tenant_id,
        '$EMAIL',
        '\$2b\$10\$CnJXyFuUT7/EgPEUxrgZ8O4bo2GG6fg6SArrnDu1eRVlcLLB4h6Di', -- Password123
        'org_admin',
        '$FIRST_NAME',
        '$LAST_NAME',
        NOW(),
        NOW()
    ) ON CONFLICT (tenant_id, email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        updated_at = NOW();
END \$\$;

-- Verify the user was created
SELECT 
    u.email,
    u.role,
    u.first_name,
    u.last_name,
    t.name as tenant_name,
    u.created_at
FROM users u
JOIN tenants t ON u.tenant_id = t.tenant_id
WHERE u.email = '$EMAIL';
EOF

echo "✅ Admin user created successfully!"
echo "📧 Email: $EMAIL"
echo "🔐 Password: $PASSWORD"
echo "👤 Role: org_admin"
echo "🏢 Tenant: $TENANT_NAME"
echo ""
echo "🌐 You can now login at:"
echo "📱 Mobile App: http://localhost:3000"
echo "🔧 Admin Dashboard: http://localhost:3002"