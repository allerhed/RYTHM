# Archive Directory

This directory contains legacy documentation files that have been superseded by the consolidated documentation structure.

## What's Here

This archive includes:

### Implementation Reports
- Completion reports for features (e.g., `ADMIN_INTERFACE_COMPLETE.md`)
- Fix summaries for bugs (e.g., `REGISTRATION_FIX_SUMMARY.md`)
- Feature implementation summaries (e.g., `FEATURE_IMPLEMENTATION_SUMMARY.md`)

### Legacy Files
- Old test files (`test-*.html`)
- Legacy SQL migration files (now consolidated)
- Temporary debug files
- Development snapshots

## Why These Files Are Archived

These files were created during development to track progress and document fixes. While valuable for historical context, they are no longer needed for day-to-day development since:

1. **Consolidated Documentation** - Information has been merged into the main documentation
2. **Version Control** - Git history provides complete implementation timeline
3. **Clarity** - Removing clutter from the root directory improves navigation

## Using Archived Files

### When to Reference
- Understanding the history of a specific feature
- Investigating past bug fixes
- Reviewing implementation decisions
- Onboarding context for legacy code

### When NOT to Use
- Current feature documentation (use `/docs` instead)
- API reference (use `/docs/api/endpoints.md`)
- Development guides (use `/docs/getting-started/`)
- Troubleshooting (use `/docs/deployment/troubleshooting.md`)

## File Index

### Admin Features
- `ADMIN_INTERFACE_COMPLETE.md` - Admin UI implementation completion
- `ADMIN_GUIDE_0.9.md` - *(Moved to `/docs/user-guides/admin-interface.md`)*

### Authentication
- `AUTHENTICATION_COMPLETE.md` - Auth system implementation
- `LOGIN_TIMEOUT_FIX_COMPLETE.md` - Session timeout fix

### Database
- `DATABASE_PASSWORD_FIXED_FINAL.md` - Database password configuration fix
- `DATABASE_SCHEMA_FIXED_FINAL.md` - Schema consolidation
- Various `.sql` files - Legacy migration scripts

### Application Fixes
- `APPLICATION_FIXED.md` - General application fixes
- `FRONTEND_ERROR_FIX.md` - Frontend error resolution
- `PROFILE_ENDPOINT_FIX_REPORT.md` - Profile API fix

### Features
- `FEATURE_IMPLEMENTATION_SUMMARY.md` - Feature completion summary
- `PULL_TO_REFRESH_IMPLEMENTATION_GUIDE.md` - *(Moved to `/docs/features/pull-to-refresh.md`)*
- `TRAINING_LOAD_IMPLEMENTATION.md` - *(Moved to `/docs/features/training-load.md`)*
- `HYBRID_TRAINING_IMPLEMENTATION.md` - *(Moved to `/docs/features/hybrid-training.md`)*

### Deployment
- `AZURE_BUILD_FIX_COMPLETE.md` - Azure build configuration fix
- `DEPLOYMENT_FIX_SUMMARY.md` - Deployment issue resolutions
- `DEPLOYMENT_DOCUMENTATION.md` - *(Moved to `/docs/deployment/azure-setup.md`)*

### Registration
- `REGISTRATION_FIXED.md` - User registration bug fixes
- `REGISTRATION_FIX_SUMMARY.md` - Registration issue summary

### Testing
- `TEST_DATA_COMPLETE.md` - Test data seeding completion
- `TEST_IMPLEMENTATION_SUMMARY.md` - Test implementation status
- `test-*.html` - Manual test pages

### Status Reports
- `IMPLEMENTATION_COMPLETE.md` - Overall implementation status
- `IMPLEMENTATION_STATUS.md` - Development progress tracking

## Preservation Policy

These files are preserved in version control for historical reference but are not actively maintained. If you need information from these files:

1. Check if the information exists in current documentation
2. Review git history for the original implementation
3. Reference archived files only for additional context

## Cleanup

These files were moved to the archive on **October 2, 2025** as part of the documentation consolidation effort.

For current documentation, see:
- **[Documentation Hub](../docs/README.md)**
- **[Getting Started Guides](../docs/getting-started/)**
- **[Architecture Documentation](../docs/architecture/)**
- **[User Guides](../docs/user-guides/)**

---

*For questions about archived content, contact the development team.*
