# RYTHM v0.9 Admin Guide

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [Dashboard](#dashboard)
5. [Workout Template Management](#workout-template-management)
6. [Exercise Template Management](#exercise-template-management)
7. [User Management](#user-management)
8. [Permissions and Roles](#permissions-and-roles)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

## Overview

The RYTHM Admin Interface is a comprehensive web-based administration panel designed for managing workout templates, exercise libraries, users, and system-wide settings. Version 0.9 introduces advanced template management capabilities with role-based access control.

### Key Features in v0.9
- **Complete Template CRUD**: Create, read, update, and delete workout templates
- **Exercise Integration**: Real-time exercise template creation and management
- **Permission-Based Access**: Granular control based on admin roles
- **Safe Deletion**: Confirmation modals with detailed permission checks
- **Cross-Tenant Management**: System administrators can manage templates across all tenants

### Admin Interface Architecture
- **Frontend**: Next.js application with Tailwind CSS
- **Authentication**: JWT-based with role validation
- **API Integration**: tRPC client for type-safe API communication
- **Real-time Updates**: Instant reflection of changes across the system

## Getting Started

### Accessing the Admin Interface

1. **Development Environment**
   ```
   URL: http://localhost:3002
   ```

2. **Production Environment**
   ```
   URL: https://your-domain.com/admin
   ```

### System Requirements
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Screen Resolution**: Minimum 1024x768 (optimized for 1920x1080)
- **Network**: Stable internet connection for real-time updates

### Initial Setup
1. Ensure the RYTHM API is running and accessible
2. Verify database migrations are up to date
3. Confirm admin user accounts are properly configured
4. Test connectivity between admin interface and API

## Authentication

### Login Process

1. **Access Login Page**
   - Navigate to the admin interface URL
   - You'll be redirected to the login page if not authenticated

2. **Enter Credentials**
   ```
   Default System Admin:
   Email: admin@rythm.app
   Password: admin123
   
   Default Orchestrator:
   Email: orchestrator@rythm.app
   Password: Password123
   ```

3. **Authentication Flow**
   - Credentials are validated against the user database
   - JWT token is generated and stored as `admin_token` in localStorage
   - User is redirected to the main dashboard

### Session Management
- **Token Expiration**: 24 hours (configurable)
- **Auto Logout**: Automatic logout on token expiration
- **Session Persistence**: Tokens persist across browser sessions
- **Security**: Tokens are validated on each API request

### Logout
- Click the logout button in the top navigation
- Tokens are cleared from localStorage
- User is redirected to the login page

## Dashboard

### Main Dashboard Features
- **System Statistics**: Real-time counts of templates, users, and activities
- **Recent Activity**: Latest template creations, updates, and deletions
- **Health Monitoring**: API status and database connectivity
- **Quick Actions**: Shortcuts to common administrative tasks

### Navigation Structure
```
├── Dashboard (Home)
├── Templates
│   ├── Workout Templates
│   └── Exercise Templates
├── Users
│   ├── User Management
│   └── Role Administration
├── Tenants
│   ├── Organization Management
│   └── Tenant Settings
└── System
    ├── Settings
    └── Logs
```

## Workout Template Management

### Overview
The workout template management system is the core feature of v0.9, providing comprehensive tools for creating, editing, and managing workout templates across different scopes.

### Template Scopes
1. **System Templates**: Available to all users across all tenants
2. **Tenant Templates**: Available to all users within a specific tenant
3. **User Templates**: Available only to the user who created them

### Accessing Template Management
1. Navigate to **Templates** in the main navigation
2. Click on **Workout Templates**
3. The template list displays all templates you have permission to view

### Template List Interface

#### Template Cards
Each template is displayed as a card containing:
- **Template Name**: Primary identifier
- **Scope Badge**: Visual indicator of template scope (User/Tenant/System)
- **Exercise Count**: Number of exercises in the template
- **Creator Information**: Name of the user who created the template
- **Creation Date**: When the template was created
- **Action Buttons**: View, Edit, Delete (based on permissions)

#### Filtering and Search
- **Search Bar**: Search templates by name or description
- **Scope Filter**: Filter by User, Tenant, or System scope
- **Sort Options**: Sort by name, creation date, or scope

### Creating Workout Templates

#### Step 1: Initiate Creation
1. Click the **"Create Template"** button
2. The creation modal opens with empty form fields

#### Step 2: Basic Information
```
Template Name: [Required] Descriptive name for the template
Description: [Optional] Detailed description of the workout
Scope: [Required] Select User, Tenant, or System (based on permissions)
```

#### Step 3: Exercise Selection
1. **Add from Library**: Choose from existing exercise templates
2. **Create Custom**: Create new exercises that are saved to the exercise database
3. **Configure Sets**: Set default number of sets for each exercise
4. **Exercise Order**: Drag and drop to reorder exercises (temporarily disabled)

#### Step 4: Exercise Configuration
For each exercise, configure:
- **Set Count**: Number of sets to perform
- **Default Values**: Weight, reps, duration, etc.
- **Notes**: Exercise-specific instructions
- **Muscle Groups**: Target muscle groups
- **Equipment**: Required equipment

#### Step 5: Save Template
1. Review all information
2. Click **"Save Template"**
3. Template is created and appears in the list

### Editing Workout Templates

#### Accessing Edit Mode
1. Find the template in the list
2. Click the **"Edit"** button (only visible if you have permission)
3. The edit modal opens with pre-populated data

#### Editable Fields
- **Template Name**: Modify the template name
- **Description**: Update the description
- **Scope**: Change scope (admin users only)
- **Exercises**: Add, remove, or reorder exercises
- **Exercise Details**: Modify sets, weights, reps, etc.

#### Scope Changes (Admin Only)
Admin users can change template scope:
- **User → Tenant**: Makes template available to entire tenant
- **User → System**: Makes template available system-wide
- **Tenant → System**: Makes template available system-wide
- **Downgrade**: System/Tenant → User (restricts access)

#### Saving Changes
1. Make desired modifications
2. Click **"Update Template"**
3. Changes are immediately reflected across the system

### Deleting Workout Templates

#### Permission Requirements
- **System Admin**: Can delete any template
- **Org Admin**: Can delete tenant and user templates in their organization
- **Tenant Admin**: Can delete user templates in their tenant
- **Regular Users**: Can only delete their own user templates

#### Deletion Process
1. Click the **"Delete"** button on a template card
2. Confirmation modal appears with:
   - Template name and details
   - Warning about permanent deletion
   - Confirmation button

#### Confirmation Modal
```
⚠️ Delete Template

Are you sure you want to delete "Template Name"? 
This action cannot be undone.

[Cancel] [Delete]
```

#### Safety Features
- **Confirmation Required**: Users must explicitly confirm deletion
- **Loading States**: Visual feedback during deletion process
- **Error Handling**: Clear error messages if deletion fails
- **Permission Validation**: Server-side permission checks

#### Error Handling
Common error scenarios:
- **Permission Denied**: User lacks required permissions
- **Template Not Found**: Template may have been deleted by another user
- **System Error**: Database or network connectivity issues

## Exercise Template Management

### Overview
Exercise templates are the building blocks of workout templates. The admin interface provides tools for creating and managing exercise templates that can be used across all workout templates.

### Exercise Template Features
- **Global Library**: Exercises available system-wide
- **Categorization**: Organize by muscle groups, equipment, and exercise type
- **Default Values**: Pre-configured value types (weight, reps, duration, etc.)
- **Instructions**: Detailed exercise instructions and form cues

### Creating Exercise Templates

#### Basic Information
```
Exercise Name: [Required] Name of the exercise
Description: [Optional] Brief description
Instructions: [Optional] Detailed exercise instructions
```

#### Classification
```
Exercise Type: [Required] STRENGTH or CARDIO
Category: [Required] strength, cardio, flexibility, sports
Muscle Groups: [Required] Primary muscle groups targeted
Equipment: [Required] Equipment needed (bodyweight, barbell, etc.)
```

#### Default Values
```
Value 1 Type: [Required] Primary measurement (weight_kg, distance_m, etc.)
Value 2 Type: [Required] Secondary measurement (reps, duration_s, etc.)
```

### Integration with Workout Templates
- **Real-time Creation**: Create exercises while building workout templates
- **Automatic Saving**: New exercises are immediately available in the global library
- **Template Integration**: Exercises created during template creation are saved to the database

## User Management

### User Overview
The user management system provides tools for viewing and managing user accounts across all tenants.

### User Information Display
- **Basic Information**: Name, email, role, tenant affiliation
- **Account Status**: Active, inactive, pending verification
- **Activity Summary**: Last login, workout count, template usage
- **Permission Summary**: Current role and access levels

### User Roles
1. **athlete**: Basic user with workout tracking capabilities
2. **coach**: Enhanced user with coaching features
3. **tenant_admin**: Tenant-level administration
4. **org_admin**: Organization-level administration
5. **system_admin**: Full system administration

### Role Management
- **View Current Roles**: See all user role assignments
- **Role Changes**: Modify user roles (system admin only)
- **Permission Impact**: Understand how role changes affect access
- **Audit Trail**: Track role changes over time

## Permissions and Roles

### Permission Matrix

| Permission | system_admin | org_admin | tenant_admin | coach | athlete |
|------------|--------------|-----------|--------------|-------|---------|
| **Template Management** |
| Create System Templates | ✅ | ❌ | ❌ | ❌ | ❌ |
| Edit System Templates | ✅ | ❌ | ❌ | ❌ | ❌ |
| Delete System Templates | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Tenant Templates | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Tenant Templates | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Tenant Templates | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create User Templates | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit User Templates | ✅ | ✅ | ✅ | Own Only | Own Only |
| Delete User Templates | ✅ | ✅ | ✅ | Own Only | Own Only |
| **Exercise Management** |
| Create Exercise Templates | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edit Exercise Templates | ✅ | ✅ | Limited | Limited | Limited |
| **User Management** |
| View All Users | ✅ | Org Only | Tenant Only | ❌ | ❌ |
| Manage User Roles | ✅ | Limited | Limited | ❌ | ❌ |
| **System Access** |
| Admin Interface | ✅ | ✅ | ✅ | ❌ | ❌ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ |

### Role Descriptions

#### System Administrator (system_admin)
- **Full System Access**: Complete control over all aspects of the system
- **Cross-Tenant Management**: Can manage resources across all tenants
- **Template Control**: Can create, edit, and delete templates of any scope
- **User Management**: Can view and modify all user accounts
- **System Configuration**: Access to system-wide settings and configuration

#### Organization Administrator (org_admin)
- **Organization Scope**: Management within their organization (multiple tenants)
- **Tenant Template Management**: Can manage tenant and user templates
- **User Oversight**: Can view and manage users within their organization
- **Limited System Access**: Cannot modify system-wide settings

#### Tenant Administrator (tenant_admin)
- **Tenant Scope**: Management within their specific tenant
- **User Template Management**: Can manage user templates within their tenant
- **Local User Management**: Can manage users within their tenant
- **No System Access**: Cannot access system-wide features

### Permission Enforcement
- **Frontend Validation**: UI elements hidden based on user permissions
- **Backend Validation**: Server-side permission checks on all operations
- **API Security**: All API endpoints validate permissions before execution
- **Audit Logging**: All permission-based actions are logged for security

## Troubleshooting

### Common Issues

#### Authentication Problems

**Problem**: Cannot log in to admin interface
```
Symptoms:
- Login form shows "Invalid credentials" error
- Token-related errors in browser console
- Redirect loops to login page

Solutions:
1. Verify credentials are correct
2. Check if user has admin role (tenant_admin, org_admin, or system_admin)
3. Clear localStorage and retry
4. Verify API connectivity
5. Check browser console for detailed error messages
```

**Problem**: Session expires unexpectedly
```
Symptoms:
- Sudden logout during active use
- "Token expired" errors
- Forced redirect to login page

Solutions:
1. Check token expiration settings
2. Verify system clock is accurate
3. Re-login to refresh token
4. Contact system administrator if issue persists
```

#### Template Management Issues

**Problem**: Templates not loading or displaying incorrectly
```
Symptoms:
- Empty template list
- Loading spinners that never complete
- Partial template information

Solutions:
1. Refresh the page
2. Check browser console for JavaScript errors
3. Verify API connectivity
4. Check database connectivity
5. Review network tab for failed requests
```

**Problem**: Cannot delete templates
```
Symptoms:
- Delete button not visible
- Permission denied errors
- Delete operation fails silently

Solutions:
1. Verify user has appropriate permissions
2. Check template scope and ownership
3. Refresh page and retry
4. Review browser console for error details
5. Contact administrator for permission issues
```

**Problem**: Exercise templates not saving
```
Symptoms:
- Custom exercises don't appear in library
- Exercise creation fails
- Exercises not available in workout templates

Solutions:
1. Check form validation errors
2. Verify all required fields are completed
3. Check database connectivity
4. Review exercise template permissions
5. Try creating exercise separately first
```

#### Performance Issues

**Problem**: Slow loading times
```
Symptoms:
- Long delays when loading template lists
- Slow response when creating/editing templates
- General interface lag

Solutions:
1. Check network connectivity
2. Clear browser cache
3. Verify database performance
4. Check for large template datasets
5. Monitor server resource usage
```

### Error Messages and Solutions

#### API Error Messages
```
"Template not found or access denied"
→ User lacks permission to access template or template was deleted

"You do not have permission to delete this template"
→ User role insufficient for template scope deletion

"Failed to delete template (500)"
→ Server error, check API logs and database connectivity

"No admin token found"
→ Authentication issue, clear localStorage and re-login

"Not in browser environment"
→ JavaScript execution environment issue, refresh page
```

#### Browser Console Errors
```
Network errors (ERR_CONNECTION_REFUSED)
→ API service not running or not accessible

CORS errors
→ Cross-origin request blocked, check API CORS configuration

JavaScript errors (TypeError, ReferenceError)
→ Frontend code issues, check for recent deployments

Authentication errors (401, 403)
→ Token issues or insufficient permissions
```

### Debugging Steps

#### Frontend Issues
1. **Open Browser Developer Tools**
   - Press F12 or right-click → Inspect
   - Check Console tab for JavaScript errors
   - Review Network tab for failed requests

2. **Check Local Storage**
   - Application tab → Local Storage
   - Verify `admin_token` exists and is valid
   - Clear storage if token appears corrupted

3. **Verify API Connectivity**
   - Network tab → Look for API requests
   - Check request/response headers
   - Verify proper authentication headers

#### Backend Issues
1. **Check API Logs**
   ```bash
   npm run dev:logs:api
   # or
   docker-compose logs api
   ```

2. **Verify Database Connectivity**
   ```bash
   npm run dev:shell:db
   # Test database queries
   ```

3. **Check Service Status**
   ```bash
   npm run dev:status
   # Verify all services are running
   ```

## Best Practices

### Template Management
1. **Naming Conventions**
   - Use descriptive, consistent names
   - Include difficulty level or target audience
   - Avoid special characters that might cause issues

2. **Scope Selection**
   - Use User scope for personal templates
   - Use Tenant scope for organization-wide templates
   - Reserve System scope for universal, high-quality templates

3. **Exercise Organization**
   - Group similar exercises together
   - Use clear, consistent exercise names
   - Include helpful descriptions and instructions

### Security Practices
1. **Access Control**
   - Regularly review user permissions
   - Use principle of least privilege
   - Monitor admin activity logs

2. **Authentication**
   - Use strong passwords for admin accounts
   - Regularly rotate admin credentials
   - Enable two-factor authentication when available

3. **Data Management**
   - Regular backups of template data
   - Test recovery procedures
   - Monitor for unusual activity patterns

### Performance Optimization
1. **Template Design**
   - Avoid extremely large templates (>50 exercises)
   - Use reasonable default values
   - Keep descriptions concise but informative

2. **System Maintenance**
   - Regular cleanup of inactive templates
   - Monitor database performance
   - Keep software dependencies updated

### User Experience
1. **Template Quality**
   - Provide clear instructions
   - Use logical exercise ordering
   - Include progression options

2. **Documentation**
   - Document custom exercises thoroughly
   - Include equipment requirements
   - Provide modification options

3. **Consistency**
   - Use standard terminology
   - Maintain consistent formatting
   - Follow established naming conventions

---

*This admin guide covers the comprehensive functionality available in RYTHM v0.9. For technical implementation details, see the API documentation and architecture guide.*