# RYTHM Documentation

Welcome to the RYTHM platform documentation. This guide will help you understand, develop, deploy, and use the RYTHM hybrid training application.

## ⚡ Quick Start

**New to RYTHM?** Start here: **[Quick Start Guide](QUICK_START.md)**

This guide covers:
- URLs for production and development
- Common commands for daily tasks
- Quick troubleshooting tips
- Default credentials

## 📚 Documentation Structure

### Getting Started
- **[Installation Guide](getting-started/installation.md)** - Set up your development environment
- **[Development Guide](getting-started/development.md)** - Build and run the application
- **[Docker Guide](getting-started/docker-guide.md)** - Understanding the containerized environment
- **[Auto-Restart Guide](getting-started/auto-restart.md)** - Service restart configuration

### Architecture
- **[System Overview](architecture/overview.md)** - High-level architecture and design decisions
- **[Database Design](architecture/database.md)** - Schema, RLS policies, and data modeling
- **[API Design](architecture/api-design.md)** - tRPC endpoints, authentication, and authorization
- **[Security Architecture](architecture/security.md)** - Authentication, authorization, and data protection

### User Guides
- **[Mobile App Guide](user-guides/mobile-app.md)** - Using the RYTHM mobile PWA
- **[Admin Interface Guide](user-guides/admin-interface.md)** - Managing templates, users, and tenants
- **[Training System](user-guides/training-system.md)** - Understanding workouts, sets, and analytics

### API Reference
- **[Authentication](api/authentication.md)** - JWT tokens, login, and session management
- **[Endpoints](api/endpoints.md)** - Complete API endpoint reference
- **[Schemas](api/schemas.md)** - Data models and validation schemas

### Deployment
- **[Azure Setup](deployment/azure-setup.md)** - Deploying to Azure Container Apps
- **[Azure Resources](deployment/azure-resources.md)** - Resource names and URLs
- **[Production URLs](deployment/PRODUCTION_URLS.md)** - Live application URLs
- **[DNS Setup](deployment/DNS_SETUP.md)** - Custom domain configuration
- **[Production Configuration](deployment/production.md)** - Environment variables and scaling
- **[Troubleshooting](deployment/troubleshooting.md)** - Common issues and debugging

### Features
- **[Pull to Refresh](features/pull-to-refresh.md)** - Mobile gesture implementation
- **[Training Load System](features/training-load.md)** - Calculating training scores
- **[Hybrid Training](features/hybrid-training.md)** - Combined strength and cardio workouts
- **[Date & Duration Pickers](features/DATE_DURATION_PICKERS.md)** - Time input components
- **[Import/Export System](features/IMPORT_EXPORT_SYSTEM.md)** - Data portability
- **[Workout View Page](features/VIEW_WORKOUT_PAGE.md)** - Session detail views

## 🚀 Quick Links

### For Developers
1. **[Quick Start Guide](QUICK_START.md)** - Commands and URLs you need daily
2. [Set up your environment](getting-started/installation.md)
3. [Start the development server](getting-started/development.md)
4. [Understand the architecture](architecture/overview.md)
5. [Review API endpoints](api/endpoints.md)

### For Administrators
1. [Access the admin interface](user-guides/admin-interface.md)
2. [Manage workout templates](user-guides/admin-interface.md#template-management)
3. [Configure user permissions](user-guides/admin-interface.md#permissions)

### For Deployment
1. [Configure Azure resources](deployment/azure-setup.md)
2. [Set up CI/CD pipeline](deployment/azure-setup.md#cicd)
3. [Monitor production](deployment/troubleshooting.md#monitoring)

## 📋 Additional Resources

- **[CHANGELOG](../CHANGELOG.md)** - Version history and release notes
- **[README](../README.md)** - Project overview and quick start
- **[Archive](../archive/)** - Legacy documentation and implementation reports

## 🤝 Contributing

When adding new documentation:
1. Place it in the appropriate category folder
2. Update this README with a link
3. Follow the existing documentation style
4. Include code examples where relevant

## 💡 Need Help?

- **Technical Issues**: See [Troubleshooting Guide](deployment/troubleshooting.md)
- **API Questions**: Check [API Reference](api/endpoints.md)
- **Architecture Questions**: Review [System Overview](architecture/overview.md)

---

*Last updated: October 2025*
