# Changelog

All notable changes to the RYTHM project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-10-28

### Added
- **Semantic Theme System**: Unified cinematic dark + burnt orange design palette across mobile and admin
- **Elevation-Based Surfaces**: Semantic surface classes (`bg-dark-primary`, `bg-dark-elevated1`, `bg-dark-elevated2`)
- **Text Hierarchy**: Semantic text tiers (`text-text-primary`, `text-text-secondary`, `text-text-tertiary`)
- **Component Helpers**: Helper classes for buttons (`btn-primary`/`btn-secondary`), icons (`icon-accent`), badges
- **ESLint Enforcement**: Automated prevention of deprecated gradient utilities via `no-restricted-syntax` rule
- **Theme Documentation**: Comprehensive semantic theme guide with patterns, examples, and anti-patterns
- **Contributing Guidelines**: Detailed contribution guide with theme adherence requirements
- **User Profile Management**: Complete profile editing with bio/about field support
- **Avatar Upload System**: Secure file upload and management with proper CORS handling
- **Smart Proxy Routing**: Intelligent API proxy that handles both endpoints and static files
- **Database Schema Consolidation**: Complete schema.sql file reflecting current database structure
- **Enhanced Session Tracking**: Added session name, duration, training load, and perceived exertion fields
- **Exercise Templates System**: Global exercise template library for standardized exercises

### Changed
- **UI Migration**: Complete overhaul of all mobile and admin pages to use semantic surfaces
  - Removed all gradient utility classes (`bg-gradient-to-*`)
  - Replaced with elevation-based surfaces and semantic tokens
  - Consistent styling across auth, training, analytics, profile, and admin pages
- **Design Consistency**: Unified look and feel across mobile PWA and admin dashboard
- **Documentation Structure**: Streamlined README with semantic theme overview
- **Project Organization**: Moved implementation docs to archive for cleaner root directory
- **Package Versions**: Updated all packages to 1.1.0 with consistent dependency management
- **Profile Update API**: Fixed response format to prevent logout redirects during profile saves
- **Database Structure**: Migrated exercises to global scope (removed tenant_id dependency)
- **Authentication UX**: Removed social login buttons for cleaner, focused experience

### Fixed
- **Gradient Deprecation**: Zero gradient utilities remain in production code (enforced via ESLint)
- **Theme Consistency**: All surfaces use proper elevation tokens with borders
- **Text Styling**: Eliminated ad-hoc gray utilities in favor of semantic text classes
- **Profile Save Redirects**: Users no longer get logged out when saving profile changes
- **Avatar Display**: Fixed avatar URL construction and smart proxy routing
- **CORS Issues**: Resolved cross-origin resource sharing problems for file uploads
- **Database Migrations**: Added missing 'about' column to users table
- **API Response Format**: Standardized profile update responses to match frontend expectations

### Technical Improvements
- **Linting Rules**: Custom ESLint rule prevents reintroduction of gradient utilities
- **Design System**: Single source of truth via CSS variables in global styles
- **Accessibility**: Proper focus states and contrast ratios for all interactive elements
- **Multi-tenant Architecture**: Robust tenant isolation with Row Level Security (RLS)
- **Docker Development**: Complete containerized development environment
- **Code Quality**: Removed development console logs and improved error handling
- **Security**: Enhanced authentication and authorization flows

### Database Schema Changes
- Added `about` TEXT column to `users` table
- Added `avatar_url` TEXT column to `users` table  
- Added `name` TEXT column to `sessions` table
- Added `duration_seconds` INTEGER column to `sessions` table
- Added `training_load` INTEGER column to `sessions` table
- Added `perceived_exertion` NUMERIC(3,1) column to `sessions` table
- Added `exercise_templates` table for global exercise templates
- Removed `tenant_id` from `exercises` table (now global)
- Enhanced enum types: added 'reps' to `set_value_type` enum
- Added `exercise_type` enum with 'STRENGTH' and 'CARDIO' values

### Development Experience
- **Hot Reload**: Instant code changes in Docker development environment
- **Consistent Environment**: All developers use identical containerized setup
- **Theme Enforcement**: ESLint catches gradient utilities during development
- **Clean Migration Path**: Clear upgrade path with documented theme patterns
- **Comprehensive Documentation**: Updated docs reflect current architecture and design system

### Documentation
- **SEMANTIC_THEME.md**: Complete guide to design system with enforcement section
- **CONTRIBUTING.md**: New contribution guidelines with theme requirements
- **README.md**: Streamlined with semantic theme overview and quick links
- **Archive**: Moved implementation summaries to archive for cleaner structure

## [1.0.0] - 2025-09-10

### Added
- Initial release of RYTHM hybrid training application
- Multi-tenant architecture with PostgreSQL and RLS
- User authentication with JWT tokens
- Basic workout session tracking
- Exercise management system
- Training analytics foundation
- Docker-based development environment
- Mobile-first responsive design

### Core Features
- User registration and authentication
- Multi-tenant data isolation
- Session logging with categories (strength, cardio, hybrid)
- Set tracking with configurable value fields
- Basic exercise library
- Docker Compose development stack

### Technical Foundation
- Next.js frontend application
- Express.js API with tRPC
- PostgreSQL database with Row Level Security
- Docker containerization
- TypeScript throughout the stack