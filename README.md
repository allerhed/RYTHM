# RY## 🌐 Production Access

### **Live Applications**
- **Mobile App**: `https://rythm.training` - Main fitness tracking application for end users
- **Admin App**: `https://admin.rythm.training` - Administrative interface for system management
- **API Backend**: `https://api.rythm.training` - Backend API serving both applications.9

A comprehensive hybrid training mobile web app (PWA) with multi-tenant support, real-time analytics, and enterprise-grade admin functionality designed for athletes, coaches, and fitness organizations.

## � Production Access

### **Live Applications**
- **Mobile App**: `https://rythm.training` - Main fitness tracking application for end users
- **Admin App**: `https://admin.rythm.training` - Administrative interface for system management
- **API Backend**: Internal API serving both applications

## �🎯 Features

### ✅ **Version 0.9 - Current Release**
- **Multi-tenant Architecture**: Secure tenant isolation with Row Level Security (RLS)
- **Advanced Admin Interface**: Complete workout template management with CRUD operations
- **User Authentication**: JWT-based auth with granular role management (athlete, coach, tenant_admin, org_admin, system_admin)
- **Enhanced Template System**: System-wide, tenant-scoped, and user-scoped workout templates
- **Profile Management**: Complete user profiles with avatar upload and bio
- **Session Tracking**: Log workouts with categories (strength, cardio, hybrid)
- **Flexible Set Logging**: Two configurable value fields (weight, distance, duration, calories, reps)
- **Exercise Management**: Global exercise library with templates and custom exercises
- **Template Access Control**: Role-based permissions for creating, editing, and deleting templates
- **Training Analytics**: Basic volume tracking and session history
- **Mobile-First PWA**: Responsive design optimized for mobile devices
- **Docker Development**: Complete containerized development environment

### 🆕 **New in v0.9**
- **Admin Template Management**: Full CRUD operations for workout templates
- **Delete Functionality**: Safe template deletion with confirmation modals
- **System Template Access**: Universal access to system-scoped templates across all tenants
- **Enhanced Permissions**: Granular admin permissions (system_admin, org_admin, tenant_admin)
- **Improved Error Handling**: Comprehensive error messages and loading states
- **Exercise Template Integration**: Real-time exercise template creation and management
- **Cross-Service Authentication**: Seamless authentication between admin and API services

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- **No Node.js installation required** - everything runs in containers

### Local Development Environment

**⚠️ DOCKER-ONLY DEVELOPMENT: This project runs exclusively in Docker containers**

The development environment uses Docker Compose with:
- Containerized PostgreSQL database with persistent storage
- API server with hot reload via volume mounting
- Frontend with Next.js development server and hot reload
- Proper container networking between all services
- Volume mounting for instant code changes without rebuilds

#### Starting the Development Environment

1. **Ensure Docker is running**
   ```bash
   # Start Docker Desktop if not already running
   open -a Docker
   ```

2. **Start the complete development environment**
   ```bash
   npm run dev
   ```
   
   Or manually:
   ```bash
   ./scripts/start.sh
   ```

3. **Verify all services are running**
   ```bash
   npm run dev:status
   ```

#### Access Points

- **Frontend Application**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **Analytics**: http://localhost:3000/analytics
- **Admin Interface**: http://localhost:3002 (admin@rythm.app / admin123)
- **API Health Check**: http://localhost:3001/health
- **Database**: PostgreSQL on localhost:5432

#### Managing the Development Environment

```bash
# View logs from all services
npm run dev:logs

# View logs from specific service
npm run dev:logs:api      # API server logs
npm run dev:logs:mobile   # Frontend logs
npm run dev:logs:admin    # Admin interface logs
npm run dev:logs:db       # Database logs

# Stop all services
npm run dev:down

# Restart all services
npm run dev:restart

# Restart specific service
npm run dev:restart:api
npm run dev:restart:mobile
npm run dev:restart:admin

# Rebuild and restart (after Dockerfile changes)
npm run dev:build
npm run dev:up

# Check service status
npm run dev:status

# Get shell access
npm run dev:shell:api     # API container shell
npm run dev:shell:mobile  # Mobile container shell
npm run dev:shell:db      # Database shell (psql)

# Clean everything (removes volumes and containers)
npm run dev:clean
```

#### Why Docker-Only Development?

- **Zero Local Dependencies**: No need to install Node.js, PostgreSQL, or other tools
- **Consistent Environment**: Identical setup across all development machines
- **Instant Hot Reload**: Volume mounting provides instant code changes without rebuilds
- **Isolated Database**: PostgreSQL runs in container with persistent data volumes
- **Perfect Networking**: Container networking matches production deployment
- **Easy Reset**: Clean slate development environment with one command
- **Production Parity**: Development environment matches production containers

## 🏗️ Architecture

### Services

- **Frontend (mobile)**: Next.js application on port 3000
- **API (api)**: Express.js with tRPC on port 3001
- **Admin Interface (admin)**: Next.js admin dashboard on port 3002
- **Database (db)**: PostgreSQL 15 on port 5432

### Key Features

- **Training Score Widget**: Real-time calculation of weekly training commitment
- **Analytics Dashboard**: Comprehensive workout analytics and trends
- **Workout Tracking**: Log and manage training sessions
- **User Authentication**: Secure login and profile management

## 🔧 Admin Interface

The RYTHM Admin Interface provides comprehensive system administration capabilities for managing the entire platform and workout templates.

### Features

- **Workout Template Management**: Create, read, update, and delete workout templates with full CRUD operations
- **Exercise Template Integration**: Real-time creation and management of exercise templates
- **Scope-Based Access Control**: Support for user, tenant, and system-scoped templates
- **Delete Functionality**: Safe template deletion with confirmation modals and permission checks
- **Advanced Filtering**: Search and filter templates by scope, category, and content
- **System Dashboard**: Real-time statistics and health monitoring
- **User Management**: View and manage user accounts across all tenants
- **Tenant Administration**: Manage fitness studios and organizations
- **Activity Monitoring**: Track system activities and user actions
- **Secure Authentication**: Admin-only access with JWT-based security

### Admin Access

- **URL**: http://localhost:3002
- **Default Accounts**:
  - System Admin: `admin@rythm.app` / `admin123`
  - Orchestrator: `orchestrator@rythm.app` / `Password123`

### Admin Permissions (v0.9)

- **System Admin**: Can manage all templates across all scopes and tenants
- **Organization Admin**: Can manage tenant and user templates within their organization
- **Tenant Admin**: Can manage user templates within their tenant
- **Regular Users**: Can only manage their own user-scoped templates

### Template Management Features

- **Create Templates**: Full workout template creation with exercise selection
- **Edit Templates**: Modify existing templates with scope changes
- **Delete Templates**: Safe deletion with role-based permissions
- **Exercise Integration**: Create custom exercises that are saved to the exercise template database
- **Scope Management**: Control template visibility (user/tenant/system)
- **Real-time Updates**: Instant reflection of changes across the system

### Admin Commands

```bash
# View admin interface logs
npm run dev:logs:admin

# Restart admin service
npm run dev:restart:admin

# Access admin shell
npm run dev:shell:admin
```

For detailed admin documentation, see [apps/admin/README.md](apps/admin/README.md).

## 📊 Training Score System

The application includes a sophisticated Training Score system that categorizes users based on their weekly training load:

- **Aspiring** (0-200 pts): Just starting the training journey
- **Active** (201-300 pts): Building consistent training habits
- **Consistent** (301-400 pts): Maintaining steady progress
- **Grinding** (401-500 pts): Intense and frequent training
- **Locked In** (501-600 pts): Maximum dedication
- **Maniacal** (601+ pts): Elite level training intensity

## 🛠️ Development Notes

### Important Configuration

- The frontend is configured to communicate with the API using Docker internal networking
- tRPC client is configured with `baseUrl: 'http://api:3001'` for container communication
- Environment variables are loaded from `.env.local`

### Database Migrations

Database migrations are handled automatically when the API container starts. The migration files are located in `packages/db/migrations/`.

### Hot Reload & Development Workflow

The Docker development environment provides instant feedback:
- **Frontend changes**: Next.js hot reload via volume mounting
- **API changes**: tsx watch mode restarts the server automatically  
- **Package changes**: Restart containers to pick up new dependencies
- **Database changes**: Run migrations in the API container
- **Configuration changes**: Restart specific services as needed

### Development Workflow Examples

```bash
# Start development
npm run dev

# Make code changes (auto-reloads)
# Edit files in apps/api/src or apps/mobile/src

# Add new dependencies
npm run dev:shell:api
npm install new-package
exit
npm run dev:restart:api

# Run database migrations
npm run db:migrate

# Check logs if something isn't working
npm run dev:logs:api
npm run dev:logs:mobile

# Clean start if needed
npm run dev:clean
npm run dev
```

## 📝 Additional Documentation

- `RELEASE_NOTES_0.9.md` - Complete version 0.9 release notes and features
- `API_DOCUMENTATION_0.9.md` - API endpoints and authentication guide
- `ADMIN_GUIDE_0.9.md` - Comprehensive admin interface documentation
- `ARCHITECTURE_0.9.md` - System architecture and component overview
- `DEBUG_GUIDE.md` - Debugging and troubleshooting
- `APPLICATION_FIXED.md` - Application fixes and improvements
- `TRAINING_LOAD_IMPLEMENTATION.md` - Training load system details