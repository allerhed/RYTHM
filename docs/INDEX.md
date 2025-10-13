# RYTHM Documentation Index

Complete documentation index for the RYTHM Hybrid Training Platform.

## 📚 Quick Links

- [Quick Start Guide](./QUICK_START.md) - Get started with RYTHM
- [Azure Setup](./AZURE_SETUP.md) - Azure deployment configuration
- [Deployment Guide](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Project Requirements](./PROJECT_REQUIREMENTS.md) - Technical requirements and specifications

---

## 🏗️ Architecture & Design

- [Architecture Overview](./architecture/) - System architecture and design patterns
- [API Documentation](./api/) - API endpoints and schemas
- [Design Inspiration](./design-inspiration/) - UI/UX design references

---

## 🚀 Getting Started

- [Getting Started Guide](./getting-started/) - Step-by-step setup instructions
- [User Guides](./user-guides/) - End-user and admin documentation

---

## ✨ Feature Implementations

### Core Features
- [Date & Duration Pickers](./features/DATE_DURATION_PICKERS.md)
- [Workout Templates](./features/WORKOUT_TEMPLATES.md)
- [Hyrox Tracker](./features/HYROX_TRACKER_IMPLEMENTATION.md)
- [Backup System](./features/QUICK_START_BACKUPS.md)

### Email System
- [Email Service Complete](./features/email/EMAIL_SERVICE_COMPLETE.md)
- [Email Logging Guidelines](./features/email/EMAIL_LOGGING_GUIDELINES.md)
- [Email Service Setup](./features/email/EMAIL_SERVICE_SETUP.md)
- [Email Service Usage](./features/email/EMAIL_SERVICE_USAGE.md)
- [Production Deployment](./features/email/EMAIL_LOGS_PRODUCTION_DEPLOYMENT.md)
- [Documentation Complete](./features/email/EMAIL_LOGGING_DOCUMENTATION_COMPLETE.md)

### Major Implementations
- [Backup History](./implementations/BACKUP_HISTORY_IMPLEMENTATION.md)
- [Cron Scheduler](./implementations/CRON_SCHEDULER_IMPLEMENTATION.md)
- [Email System Summary](./implementations/EMAIL_IMPLEMENTATION_SUMMARY.md)
- [Hyrox Implementation](./implementations/HYROX_IMPLEMENTATION_COMPLETE.md)
- [Hyrox Next Steps](./implementations/HYROX_NEXT_STEPS_COMPLETE.md)
- [Native Date/Time Pickers](./implementations/NATIVE_DATETIME_PICKERS.md)
- [Personal Records](./implementations/PERSONAL_RECORDS_IMPLEMENTATION.md)
- [PR Feature Complete](./implementations/PR_FEATURE_COMPLETE.md)

---

## 🔧 Bug Fixes & Improvements

### Recent Fixes
- [Backup Toggle Fix](./fixes/BACKUP_TOGGLE_FIX.md)
- [Calendar Monday Alignment](./fixes/CALENDAR_MONDAY_ALIGNMENT_FIX.md)
- [Exercise Update Equipment](./fixes/EXERCISE_UPDATE_EQUIPMENT_FIX.md)
- [Exercise Update Fix](./fixes/EXERCISE_UPDATE_FIX.md)
- [History Page Fix](./fixes/HISTORY_PAGE_FIX.md)
- [Mobile Landing Simplification](./fixes/MOBILE_LANDING_SIMPLIFICATION.md)
- [Programs Table Fix](./fixes/PROGRAMS_TABLE_FIX.md)
- [Template Visibility Fix](./fixes/TEMPLATE_VISIBILITY_FIX.md)

### PR-Related Fixes
- [PR Feature Fixes](./fixes/PR_FEATURE_FIXES.md)
- [PR Migration Fix](./fixes/PR_MIGRATION_FIX.md)
- [PR UI Updates](./fixes/PR_UI_UPDATES.md)

---

## 🚢 Deployment

- [Azure Setup Guide](./AZURE_SETUP.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Deployment Documentation](./deployment/)

---

## 📖 Reference

### API
- [Endpoints](./api/endpoints.md)
- [Schemas](./api/schemas.md)

### User Guides
- [Admin Interface](./user-guides/admin-interface.md)
- [Mobile App Guide](./user-guides/)

---

## 📝 Documentation Organization

```
docs/
├── INDEX.md                    # This file
├── README.md                   # Documentation overview
├── QUICK_START.md             # Quick start guide
├── AZURE_SETUP.md             # Azure deployment setup
├── DEPLOYMENT_GUIDE.md        # Deployment instructions
├── PROJECT_REQUIREMENTS.md    # Technical requirements
│
├── api/                       # API documentation
├── architecture/              # System architecture
├── deployment/                # Deployment configs
├── design-inspiration/        # UI/UX references
├── getting-started/           # Setup guides
├── user-guides/               # User documentation
│
├── features/                  # Feature documentation
│   ├── email/                # Email system docs
│   └── *.md                  # Feature-specific docs
│
├── implementations/           # Major implementation docs
│   └── *.md                  # Implementation details
│
└── fixes/                     # Bug fixes and improvements
    └── *.md                  # Fix documentation
```

---

## 🔍 Finding Documentation

### By Topic
- **Setup & Deployment**: See `Getting Started` and `Deployment` sections
- **Features**: See `Feature Implementations` section
- **API**: See `Reference > API` section
- **Bug Fixes**: See `Bug Fixes & Improvements` section
- **Architecture**: See `Architecture & Design` section

### By Type
- **User Facing**: Check `user-guides/`
- **Developer Facing**: Check `api/`, `architecture/`, `features/`
- **Operations**: Check `deployment/`, `DEPLOYMENT_GUIDE.md`
- **Historical**: Check `implementations/`, `fixes/`

---

## 📌 Important Notes

- All feature implementations are documented in `implementations/`
- All bug fixes are documented in `fixes/`
- All feature-specific docs are in `features/`
- Root-level docs are for high-level guides and setup

---

**Last Updated**: October 13, 2025
**Version**: 1.0
