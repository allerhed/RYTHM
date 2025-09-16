# RYTHM v0.9 API Documentation

## Overview

The RYTHM API provides a comprehensive RESTful interface built with tRPC and TypeScript for managing fitness applications. Version 0.9 introduces enhanced workout template management, improved authentication, and expanded admin capabilities.

## Base URL

- **Development**: `http://localhost:3001/api/trpc`
- **Production**: `https://your-domain.com/api/trpc`

## Authentication

### Token-Based Authentication

The API uses JWT (JSON Web Token) based authentication with different token types for different interfaces:

#### User Authentication
```typescript
Headers: {
  'Authorization': 'Bearer <user_token>',
  'Content-Type': 'application/json'
}
```

#### Admin Authentication
```typescript
Headers: {
  'Authorization': 'Bearer <admin_token>',
  'Content-Type': 'application/json'
}
```

### Token Storage
- **User Tokens**: Stored as `auth-token` in localStorage
- **Admin Tokens**: Stored as `admin_token` in localStorage

## User Roles and Permissions

### Role Hierarchy
1. **system_admin**: Full system access, can manage all templates and tenants
2. **org_admin**: Organization-level access, can manage tenant and user templates
3. **tenant_admin**: Tenant-level access, can manage user templates within tenant
4. **coach**: Coaching access within tenant
5. **athlete**: Basic user access

### Permission Matrix

| Operation | system_admin | org_admin | tenant_admin | coach | athlete |
|-----------|--------------|-----------|--------------|-------|---------|
| Create System Templates | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Tenant Templates | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create User Templates | ✅ | ✅ | ✅ | ✅ | ✅ |
| Delete System Templates | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete Tenant Templates | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete User Templates | ✅ | ✅ | ✅ | Own Only | Own Only |
| View System Templates | ✅ | ✅ | ✅ | ✅ | ✅ |

## Core Endpoints

### Authentication Endpoints

#### POST `/auth/login`
Authenticate user and receive JWT token.

**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  token: string;
  user: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenantId: string;
  }
}
```

#### POST `/auth/register`
Register new user account.

**Request:**
```typescript
{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  tenantId?: string;
}
```

### Workout Template Endpoints

#### GET `/workoutTemplates/getForSelection`
Retrieve workout templates for selection (includes system templates for all users).

**Query Parameters:**
```typescript
{
  search?: string;
  limit?: number; // default: 20, max: 50
}
```

**Response:**
```typescript
{
  template_id: string;
  name: string;
  scope: 'user' | 'tenant' | 'system';
  description: string;
  exercise_count: number;
}[]
```

#### GET `/workoutTemplates/getById`
Get detailed workout template by ID.

**Query Parameters:**
```typescript
{
  templateId: string; // UUID
}
```

**Response:**
```typescript
{
  template_id: string;
  name: string;
  description: string;
  scope: 'user' | 'tenant' | 'system';
  exercises: Array<{
    name: string;
    sets: number;
    weight?: number;
    reps?: number;
    duration?: number;
    distance?: number;
    notes?: string;
  }>;
  created_by_name: string;
  created_by_lastname: string;
  created_at: string;
  updated_at: string;
}
```

#### POST `/workoutTemplates/create`
Create new workout template.

**Request:**
```typescript
{
  name: string;
  description?: string;
  scope: 'user' | 'tenant' | 'system'; // Admin users can set any scope
  exercises: Array<{
    name: string;
    sets: number;
    weight?: number;
    reps?: number;
    duration?: number;
    distance?: number;
    notes?: string;
    muscle_groups?: string[];
    equipment?: string;
    category?: string;
  }>;
}
```

**Response:**
```typescript
{
  template_id: string;
  name: string;
  scope: string;
  created_at: string;
}
```

#### POST `/workoutTemplates/update`
Update existing workout template.

**Request:**
```typescript
{
  template_id: string;
  name?: string;
  description?: string;
  scope?: 'user' | 'tenant' | 'system'; // Admin users can change scope
  exercises?: Array<{
    name: string;
    sets: number;
    weight?: number;
    reps?: number;
    duration?: number;
    distance?: number;
    notes?: string;
    muscle_groups?: string[];
    equipment?: string;
    category?: string;
  }>;
}
```

#### POST `/workoutTemplates/delete` ⭐ New in v0.9
Delete workout template with permission checks.

**Request:**
```typescript
{
  templateId: string; // UUID
}
```

**Response:**
```typescript
{
  success: boolean;
  templateId: string;
  name: string;
  scope: string;
}
```

**Permission Logic:**
- **System Admin**: Can delete any template
- **Org Admin**: Can delete tenant and user templates in their organization
- **Tenant Admin**: Can delete user templates in their tenant
- **Regular Users**: Can only delete their own user-scoped templates

### Exercise Template Endpoints

#### GET `/exerciseTemplates/getAll`
Get all available exercise templates.

**Query Parameters:**
```typescript
{
  search?: string;
  category?: string;
  muscle_group?: string;
  limit?: number;
  offset?: number;
}
```

#### POST `/exerciseTemplates/create`
Create new exercise template.

**Request:**
```typescript
{
  name: string;
  description?: string;
  instructions?: string;
  muscle_groups: string[];
  equipment: string;
  exercise_category: string;
  exercise_type: 'STRENGTH' | 'CARDIO';
  default_value_1_type: string;
  default_value_2_type: string;
}
```

### Session Management Endpoints

#### GET `/sessions/getAll`
Get user's workout sessions.

#### POST `/sessions/create`
Create new workout session.

#### GET `/sessions/getById`
Get detailed session information.

### Admin Endpoints

#### GET `/admin/getAllWorkoutTemplates` ⭐ Enhanced in v0.9
Get all workout templates for admin management.

**Query Parameters:**
```typescript
{
  search?: string;
  scope?: 'user' | 'tenant' | 'system';
  limit?: number; // default: 50, max: 100
  offset?: number; // default: 0
}
```

**Response:**
```typescript
{
  template_id: string;
  tenant_id: string;
  user_id: string;
  name: string;
  description: string;
  scope: 'user' | 'tenant' | 'system';
  exercises: object;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  created_by_lastname: string;
  created_by_email: string;
  tenant_name: string;
  exercise_count: number;
}[]
```

#### GET `/admin/getAllWorkoutTemplatesCount`
Get total count of workout templates for pagination.

#### GET `/admin/getExerciseTemplates`
Get exercise templates for admin interface.

#### POST `/admin/createExerciseTemplate`
Create exercise template via admin interface.

## Error Handling

### Error Response Format
```typescript
{
  error: {
    message: string;
    code: string;
    data?: any;
  }
}
```

### Common Error Codes

#### Authentication Errors
- `UNAUTHORIZED` (401): Invalid or missing token
- `FORBIDDEN` (403): Insufficient permissions
- `TOKEN_EXPIRED` (401): JWT token has expired

#### Validation Errors
- `BAD_REQUEST` (400): Invalid request parameters
- `VALIDATION_ERROR` (400): Request validation failed

#### Resource Errors
- `NOT_FOUND` (404): Requested resource not found
- `CONFLICT` (409): Resource already exists

#### Permission Errors
- `ACCESS_DENIED` (403): User lacks required permissions
- `SCOPE_VIOLATION` (403): Operation not allowed for current scope

### Template-Specific Errors

#### Delete Operation Errors
```typescript
// Permission denied
{
  error: {
    message: "You do not have permission to delete this template",
    code: "ACCESS_DENIED"
  }
}

// Template not found
{
  error: {
    message: "Template not found or access denied",
    code: "NOT_FOUND"
  }
}

// Invalid template ID
{
  error: {
    message: "Template ID must be a valid UUID",
    code: "VALIDATION_ERROR"
  }
}
```

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Standard Endpoints**: 1000 requests per hour per IP
- **Authentication Endpoints**: 50 requests per hour per IP
- **Admin Endpoints**: 2000 requests per hour per authenticated admin

## Data Types

### Template Scope
```typescript
type TemplateScope = 'user' | 'tenant' | 'system';
```

### User Role
```typescript
type UserRole = 'athlete' | 'coach' | 'tenant_admin' | 'org_admin' | 'system_admin';
```

### Exercise Type
```typescript
type ExerciseType = 'STRENGTH' | 'CARDIO';
```

### Value Types
```typescript
type ValueType = 'weight_kg' | 'distance_m' | 'duration_s' | 'calories' | 'reps';
```

## WebSocket Events (Future)

Version 0.9 focuses on REST API endpoints. WebSocket support for real-time updates is planned for future releases.

## SDK and Client Libraries

### TypeScript/JavaScript Client

```typescript
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@rythm/api';

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3001/api/trpc',
      headers: () => {
        const token = localStorage.getItem('auth-token');
        return token ? { Authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});

// Usage examples
const templates = await client.workoutTemplates.getForSelection.query({
  search: 'strength',
  limit: 10
});

const deleteResult = await client.workoutTemplates.delete.mutate({
  templateId: 'uuid-here'
});
```

## Migration Guide

### Upgrading from Previous Versions

#### Breaking Changes in v0.9
1. **Admin Token Key**: Changed from `adminToken` to `admin_token` in localStorage
2. **System Template Access**: Modified query logic for better cross-tenant access
3. **Delete Endpoint**: New permission-based delete functionality

#### Migration Steps
1. Update admin authentication to use `admin_token` key
2. Test system template access across different tenants
3. Update any custom delete implementations to use new endpoint
4. Verify permission matrix aligns with your use case

## Testing

### Test Environment
- **Base URL**: `http://localhost:3001/api/trpc`
- **Test Database**: Isolated test database with sample data

### Sample Test Data
The test environment includes:
- 4 system-scoped workout templates
- Multiple tenant-scoped templates
- Various user-scoped templates
- Admin users with different permission levels

### Testing Tools
```bash
# API health check
curl http://localhost:3001/health

# Test authentication
curl -X POST http://localhost:3001/api/trpc/auth.login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Test template retrieval
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/api/trpc/workoutTemplates.getForSelection
```

## Support and Resources

### Documentation
- **API Reference**: This document
- **Admin Guide**: `ADMIN_GUIDE_0.9.md`
- **Architecture**: `ARCHITECTURE_0.9.md`
- **Release Notes**: `RELEASE_NOTES_0.9.md`

### Getting Help
- **GitHub Issues**: Report bugs and request features
- **Development Team**: Contact for API-specific questions
- **Community**: Join discussions about implementation

---

*This API documentation is for RYTHM v0.9. For the latest updates and changes, refer to the release notes and changelog.*