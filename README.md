# RYTHM - Hybrid Training Platform# RY## 🌐 Production Access



A comprehensive multi-tenant fitness tracking platform with mobile PWA, admin interface, and enterprise-grade features for athletes, coaches, and fitness organizations.### **Live Applications**

- **Mobile App**: `https://rythm.training` - Main fitness tracking application for end users

## 🌐 Production Access- **Admin App**: `https://admin.rythm.training` - Administrative interface for system management

- **API Backend**: `https://api.rythm.training` - Backend API serving both applications.9

- **Mobile App**: https://rythm.training - Fitness tracking for end users

- **Admin App**: https://admin.rythm.training - System management interfaceA comprehensive hybrid training mobile web app (PWA) with multi-tenant support, real-time analytics, and enterprise-grade admin functionality designed for athletes, coaches, and fitness organizations.

- **API Backend**: https://api.rythm.training - Backend API

## � Production Access

## 🎯 Key Features

### **Live Applications**

- **Multi-tenant Architecture** with Row Level Security- **Mobile App**: `https://rythm.training` - Main fitness tracking application for end users

- **Advanced Workout Tracking** (strength, cardio, hybrid)- **Admin App**: `https://admin.rythm.training` - Administrative interface for system management

- **Flexible Set Logging** with configurable metrics- **API Backend**: Internal API serving both applications

- **Template System** (user/tenant/system scoped)

- **Training Analytics** and personal records## �🎯 Features

- **Admin Dashboard** with full CRUD operations

- **Mobile-First PWA** with offline support### ✅ **Version 0.9 - Current Release**

- **Role-Based Access Control** (5 permission levels)- **Multi-tenant Architecture**: Secure tenant isolation with Row Level Security (RLS)

- **Advanced Admin Interface**: Complete workout template management with CRUD operations

## 🚀 Quick Start- **User Authentication**: JWT-based auth with granular role management (athlete, coach, tenant_admin, org_admin, system_admin)

- **Enhanced Template System**: System-wide, tenant-scoped, and user-scoped workout templates

### Prerequisites- **Profile Management**: Complete user profiles with avatar upload and bio

- Docker and Docker Compose- **Session Tracking**: Log workouts with categories (strength, cardio, hybrid)

- **No Node.js required** - runs in containers- **Flexible Set Logging**: Two configurable value fields (weight, distance, duration, calories, reps)

- **Exercise Management**: Global exercise library with templates and custom exercises

### Start Development- **Template Access Control**: Role-based permissions for creating, editing, and deleting templates

- **Training Analytics**: Basic volume tracking and session history

```bash- **Mobile-First PWA**: Responsive design optimized for mobile devices

# Start all services- **Docker Development**: Complete containerized development environment

npm run dev

### 🆕 **New in v0.9**

# Access the applications- **Admin Template Management**: Full CRUD operations for workout templates

# Mobile: http://localhost:3000- **Delete Functionality**: Safe template deletion with confirmation modals

# Admin:  http://localhost:3002- **System Template Access**: Universal access to system-scoped templates across all tenants

# API:    http://localhost:3001- **Enhanced Permissions**: Granular admin permissions (system_admin, org_admin, tenant_admin)

```- **Improved Error Handling**: Comprehensive error messages and loading states

- **Exercise Template Integration**: Real-time exercise template creation and management

### Useful Commands- **Cross-Service Authentication**: Seamless authentication between admin and API services



```bash## 🚀 Quick Start

npm run dev:logs        # View all logs

npm run dev:status      # Check service status### Prerequisites

npm run dev:restart     # Restart all services- Docker and Docker Compose

npm run dev:down        # Stop all services- **No Node.js installation required** - everything runs in containers

npm run dev:clean       # Clean everything

```### Local Development Environment



## 📚 Documentation**⚠️ DOCKER-ONLY DEVELOPMENT: This project runs exclusively in Docker containers**



**Complete documentation available at [docs/INDEX.md](docs/INDEX.md)**The development environment uses Docker Compose with:

- Containerized PostgreSQL database with persistent storage

### Quick Links- API server with hot reload via volume mounting

- Frontend with Next.js development server and hot reload

- **[Quick Start Guide](docs/QUICK_START.md)** - Essential setup- Proper container networking between all services

- **[Azure Deployment](docs/AZURE_SETUP.md)** - Production deployment- Volume mounting for instant code changes without rebuilds

- **[API Documentation](docs/api/)** - Complete API reference

- **[User Guides](docs/user-guides/)** - End-user documentation#### Starting the Development Environment

- **[Architecture](docs/architecture/)** - System design

### 🎨 Semantic Theme Overview
The UI across mobile and admin uses a unified cinematic dark + burnt orange semantic palette.

Key points:
- No raw gradient utilities (`bg-gradient-to-*`) on structural surfaces.
- Surfaces use elevation classes: `bg-dark-elevated0`, `bg-dark-elevated1` with `border-dark-border`.
- Text color tiers: `text-text-primary`, `text-text-secondary`, `text-text-tertiary` (avoid ad-hoc grays).
- Actions: `btn-primary` (burnt orange) and `btn-secondary` for neutral counterparts.
- Icon containers: `icon-accent` replaces bespoke rounded gradient circles.
- Badges: `badge-primary` / `badge-secondary` for status and metadata.

Refer to the full guide in `docs/SEMANTIC_THEME.md` for variables, helper class catalog, migration patterns, and anti‑patterns.


1. **Ensure Docker is running**

## 🏗️ Project Structure   ```bash

   # Start Docker Desktop if not already running

```   open -a Docker

RYTHM/   ```

├── apps/              # Applications

│   ├── api/          # Express + tRPC API2. **Start the complete development environment**

│   ├── mobile/       # Next.js PWA   ```bash

│   └── admin/        # Admin dashboard   npm run dev

├── packages/         # Shared packages   ```

│   ├── db/          # Database & migrations   

│   └── shared/      # Shared types   Or manually:

├── docs/            # Documentation   ```bash

│   ├── INDEX.md     # Documentation hub   ./scripts/start.sh

│   ├── features/    # Feature docs   ```

│   ├── fixes/       # Bug fix logs

│   └── implementations/  # Implementation details3. **Verify all services are running**

├── scripts/         # Build scripts   ```bash

├── infra/           # Azure Bicep IaC   npm run dev:status

└── docker-compose.yml  # Local development   ```

```

#### Access Points

## 🔧 Development

- **Frontend Application**: http://localhost:3000

### Container Management- **Dashboard**: http://localhost:3000/dashboard

- **Analytics**: http://localhost:3000/analytics

```bash- **Admin Interface**: http://localhost:3002 (admin@rythm.app / admin123)

# View specific logs- **API Health Check**: http://localhost:3001/health

npm run dev:logs:api- **Database**: PostgreSQL on localhost:5432

npm run dev:logs:mobile

npm run dev:logs:admin#### Managing the Development Environment



# Restart specific service```bash

npm run dev:restart:api# View logs from all services

npm run dev:restart:mobilenpm run dev:logs



# Shell access# View logs from specific service

npm run dev:shell:apinpm run dev:logs:api      # API server logs

npm run dev:shell:dbnpm run dev:logs:mobile   # Frontend logs

```npm run dev:logs:admin    # Admin interface logs

npm run dev:logs:db       # Database logs

### Database

# Stop all services

```bashnpm run dev:down

# Run migrations

npm run db:migrate# Restart all services

npm run dev:restart

# Database shell

npm run dev:shell:db# Restart specific service

```npm run dev:restart:api

npm run dev:restart:mobile

## 🎓 Admin Accessnpm run dev:restart:admin



- **URL**: http://localhost:3002# Rebuild and restart (after Dockerfile changes)

- **Admin**: admin@rythm.app / admin123npm run dev:build

- **Orchestrator**: orchestrator@rythm.app / Password123npm run dev:up



## 📝 Contributing# Check service status

npm run dev:status

1. All features documented in `docs/implementations/`

2. All fixes documented in `docs/fixes/`# Get shell access

3. Follow existing code patternsnpm run dev:shell:api     # API container shell

4. Test in Docker containersnpm run dev:shell:mobile  # Mobile container shell

5. Update documentationnpm run dev:shell:db      # Database shell (psql)



## 📄 License# Clean everything (removes volumes and containers)

npm run dev:clean

Proprietary - All rights reserved```



## 🔗 Resources#### Why Docker-Only Development?



- [Changelog](CHANGELOG.md) - Version history- **Zero Local Dependencies**: No need to install Node.js, PostgreSQL, or other tools

- [Documentation Index](docs/INDEX.md) - Complete docs- **Consistent Environment**: Identical setup across all development machines

- [Project Requirements](docs/PROJECT_REQUIREMENTS.md) - Product vision- **Instant Hot Reload**: Volume mounting provides instant code changes without rebuilds

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

## 📝 Documentation

For comprehensive documentation, see the **[Documentation Hub](docs/README.md)**.

### Quick Links

- **[⚡ Quick Start Guide](docs/QUICK_START.md)** - Essential commands and URLs
- **[📋 Product Requirements](docs/PROJECT_REQUIREMENTS.md)** - Product vision and requirements
- **[🗄️ Database Backup System](docs/features/DATABASE_BACKUP_SYSTEM.md)** - Backup and restore documentation

- **Getting Started**
  - [Installation Guide](docs/getting-started/installation.md) - Set up your development environment
  - [Development Guide](docs/getting-started/development.md) - Build and run the application
  - [Docker Guide](docs/getting-started/docker-guide.md) - Understanding Docker setup

- **Architecture**
  - [System Overview](docs/architecture/overview.md) - High-level architecture
  - [Database Design](docs/architecture/database.md) - Schema and RLS policies
  - [API Design](docs/architecture/api-design.md) - tRPC endpoints
  - [Security](docs/architecture/security.md) - Authentication and authorization

- **User Guides**
  - [Mobile App](docs/user-guides/mobile-app.md) - Using the RYTHM PWA
  - [Admin Interface](docs/user-guides/admin-interface.md) - Managing templates and users

- **API Reference**
  - [Authentication](docs/api/authentication.md) - JWT tokens and sessions
  - [Endpoints](docs/api/endpoints.md) - Complete API reference
  - [Schemas](docs/api/schemas.md) - Data models

- **Deployment**
  - [Azure Setup](docs/deployment/azure-setup.md) - Deploying to Azure
  - [Production Configuration](docs/deployment/production.md) - Environment setup
  - [Troubleshooting](docs/deployment/troubleshooting.md) - Common issues

- **Features**
  - [Pull to Refresh](docs/features/pull-to-refresh.md) - Mobile gestures
  - [Training Load](docs/features/training-load.md) - Score calculation
  - [Hybrid Training](docs/features/hybrid-training.md) - Combined workouts
  - [Database Backups](docs/features/DATABASE_BACKUP_SYSTEM.md) - Automated backup system

### Project Structure

```
RYTHM/
├── apps/              # Application code
│   ├── api/          # Express + tRPC API
│   ├── mobile/       # Next.js PWA
│   └── admin/        # Admin dashboard
├── packages/         # Shared packages
│   ├── db/          # Database migrations & client
│   └── shared/      # Shared types & utilities
├── docs/            # Documentation
│   ├── features/    # Feature documentation
│   ├── api/         # API reference
│   └── deployment/  # Deployment guides
├── scripts/         # Build and development scripts
│   ├── dev/         # Development utilities
│   └── data/        # Data files and seeds
├── infra/           # Infrastructure as Code (Azure Bicep)
└── archive/         # Historical documentation
```

### Other Resources

- **[CHANGELOG.md](CHANGELOG.md)** - Version history and release notes
- **[Archive](archive/)** - Legacy documentation and implementation reports
- **[Design Inspiration](docs/design-inspiration/)** - UI/UX design references