# Changelog

All notable changes to the RYTHM project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-09-11

### Added
- **User Profile Management**: Complete profile editing with bio/about field support
- **Avatar Upload System**: Secure file upload and management with proper CORS handling
- **Smart Proxy Routing**: Intelligent API proxy that handles both endpoints and static files
- **Database Schema Consolidation**: Complete schema.sql file reflecting current database structure
- **Enhanced Session Tracking**: Added session name, duration, training load, and perceived exertion fields
- **Exercise Templates System**: Global exercise template library for standardized exercises
- **Improved Authentication Flow**: Enhanced error handling and user experience
- **Code Cleanup**: Removed debug console logs and cleaned up development artifacts

### Changed
- **Profile Update API**: Fixed response format to prevent logout redirects during profile saves
- **Database Structure**: Migrated exercises to global scope (removed tenant_id dependency)
- **Package Versions**: Updated all packages to 1.1.0 with consistent dependency management
- **Documentation**: Updated README to reflect current v1.1 features and architecture
- **Authentication UX**: Removed social login buttons for cleaner, focused experience

### Fixed
- **Profile Save Redirects**: Users no longer get logged out when saving profile changes
- **Avatar Display**: Fixed avatar URL construction and smart proxy routing
- **CORS Issues**: Resolved cross-origin resource sharing problems for file uploads
- **Database Migrations**: Added missing 'about' column to users table
- **API Response Format**: Standardized profile update responses to match frontend expectations

### Technical Improvements
- **Multi-tenant Architecture**: Robust tenant isolation with Row Level Security (RLS)
- **Docker Development**: Complete containerized development environment
- **Database Schema**: Consolidated migration history into single authoritative schema file
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
- **Clean Migration Path**: Clear upgrade path from 1.0.0 to 1.1.0
- **Comprehensive Documentation**: Updated docs reflect current architecture

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