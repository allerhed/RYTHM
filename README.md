# RYTHM v1.1

A comprehensive hybrid training mobile web app (PWA) with multi-tenant support, real-time analytics, and personalized training insights designed for athletes, coaches, and fitness organizations.

## 🎯 Features

### ✅ **Version 1.1 - Current State**
- **Multi-tenant Architecture**: Secure tenant isolation with Row Level Security (RLS)
- **User Authentication**: JWT-based auth with role management (athlete, coach, tenant_admin, org_admin)
- **Profile Management**: Complete user profiles with avatar upload and bio
- **Session Tracking**: Log workouts with categories (strength, cardio, hybrid)
- **Flexible Set Logging**: Two configurable value fields (weight, distance, duration, calories, reps)
- **Exercise Management**: Global exercise library with templates and custom exercises
- **Training Analytics**: Basic volume tracking and session history
- **Mobile-First PWA**: Responsive design optimized for mobile devices
- **Docker Development**: Complete containerized development environment

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
- **API Health Check**: http://localhost:3001/health
- **Database**: PostgreSQL on localhost:5432

#### Managing the Development Environment

```bash
# View logs from all services
npm run dev:logs

# View logs from specific service
npm run dev:logs:api      # API server logs
npm run dev:logs:mobile   # Frontend logs
npm run dev:logs:db       # Database logs

# Stop all services
npm run dev:down

# Restart all services
npm run dev:restart

# Restart specific service
npm run dev:restart:api
npm run dev:restart:mobile

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
- **Database (db)**: PostgreSQL 15 on port 5432

### Key Features

- **Training Score Widget**: Real-time calculation of weekly training commitment
- **Analytics Dashboard**: Comprehensive workout analytics and trends
- **Workout Tracking**: Log and manage training sessions
- **User Authentication**: Secure login and profile management

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

- `DEBUG_GUIDE.md` - Debugging and troubleshooting
- `APPLICATION_FIXED.md` - Application fixes and improvements
- `TRAINING_LOAD_IMPLEMENTATION.md` - Training load system details