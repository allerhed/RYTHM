# RYTHM - Hybrid Training Platform

A comprehensive multi-tenant fitness tracking platform with mobile PWA, admin interface, and enterprise-grade features for athletes, coaches, and fitness organizations.

## 🌐 Production Access

### **Live Applications**
- **Mobile App**: https://rythm.training - Main fitness tracking application for end users
- **Admin App**: https://admin.rythm.training - Administrative interface for system management  
- **API Backend**: https://api.rythm.training - Backend API serving both applications

## 🎯 Key Features

### ✅ **Version 1.1 - Current Release**
- **Multi-tenant Architecture**: Secure tenant isolation with Row Level Security (RLS)
- **Advanced Workout Tracking**: Support for strength, cardio, and hybrid sessions
- **Flexible Set Logging**: Two configurable value fields (weight, distance, duration, calories, reps)
- **Template System**: System-wide, tenant-scoped, and user-scoped workout templates
- **Training Analytics**: Volume tracking, personal records, and session history
- **Role-Based Access Control**: 5 permission levels (athlete, coach, tenant_admin, org_admin, system_admin)
- **Admin Dashboard**: Full CRUD operations for templates and user management
- **Mobile-First PWA**: Responsive design optimized for mobile with offline support
- **Semantic UI Theme**: Unified cinematic dark + burnt orange design system
- **Docker Development**: Complete containerized development environment

### 🆕 **New in v1.1**
- **Semantic Theme Migration**: Complete UI overhaul with elevation-based surfaces and semantic color tokens
- **ESLint Enforcement**: Automated prevention of deprecated gradient utilities
- **Enhanced Consistency**: Unified design system across mobile and admin interfaces

### 🎨 **Semantic Theme Overview**
The UI uses a unified cinematic dark + burnt orange semantic palette across mobile and admin:
- **Surfaces**: Elevation classes (`bg-dark-primary`, `bg-dark-elevated1`, `bg-dark-elevated2`) with `border-dark-border`
- **Text Hierarchy**: Semantic tiers (`text-text-primary`, `text-text-secondary`, `text-text-tertiary`)
- **Actions**: `btn-primary` (burnt orange) and `btn-secondary` for neutral interactions
- **Components**: Helper classes for icons (`icon-accent`), badges (`badge-primary`/`badge-secondary`)
- **No Gradients**: Raw gradient utilities (`bg-gradient-to-*`) are forbidden via ESLint

📖 Full guide: [docs/SEMANTIC_THEME.md](docs/SEMANTIC_THEME.md)

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- **No Node.js installation required** - everything runs in containers

### Start Development

**⚠️ DOCKER-ONLY DEVELOPMENT: This project runs exclusively in Docker containers**

```bash
# Start all services
npm run dev

# Access the applications
# Mobile: http://localhost:3000
# Admin:  http://localhost:3002 (admin@rythm.app / admin123)
# API:    http://localhost:3001
```

### Useful Commands

```bash
npm run dev:logs        # View all logs
npm run dev:status      # Check service status
npm run dev:restart     # Restart all services
npm run dev:down        # Stop all services
npm run dev:clean       # Clean everything (removes volumes)
```

## 🏗️ Project Structure

```
RYTHM/
├── apps/              # Applications
│   ├── api/          # Express + tRPC API
│   ├── mobile/       # Next.js PWA
│   └── admin/        # Admin dashboard
├── packages/         # Shared packages
│   ├── db/          # Database & migrations
│   └── shared/      # Shared types
├── docs/            # Documentation
├── scripts/         # Build scripts
├── infra/           # Azure Bicep IaC
└── docker-compose.yml  # Local development
```

## 📚 Documentation

**Complete documentation available at [docs/README.md](docs/README.md)**

### Quick Links
- **[Quick Start Guide](docs/QUICK_START.md)** - Essential setup and commands
- **[Semantic Theme Guide](docs/SEMANTIC_THEME.md)** - UI design system reference
- **[Azure Deployment](docs/AZURE_SETUP.md)** - Production deployment guide
- **[API Documentation](docs/api/)** - Complete API reference
- **[User Guides](docs/user-guides/)** - End-user documentation
- **[Architecture](docs/architecture/)** - System design

## 🔧 Development

### Container Management

```bash
# View specific logs
npm run dev:logs:api
npm run dev:logs:mobile
npm run dev:logs:admin

# Restart specific service
npm run dev:restart:api
npm run dev:restart:mobile

# Shell access
npm run dev:shell:api
npm run dev:shell:db
```

### Database

```bash
# Run migrations
npm run db:migrate

# Database shell
npm run dev:shell:db
```

## 🎓 Admin Access

- **URL**: http://localhost:3002
- **Admin**: admin@rythm.app / admin123
- **Orchestrator**: orchestrator@rythm.app / Password123

## 📝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines including:
- Semantic theme adherence requirements
- ESLint configuration and gradient restrictions
- Code style and testing practices
- Documentation standards

## 📄 License

Proprietary - All rights reserved

## 🔗 Resources

- [Changelog](CHANGELOG.md) - Version history
- [Documentation Index](docs/README.md) - Complete docs
- [Project Requirements](docs/PROJECT_REQUIREMENTS.md) - Product vision
