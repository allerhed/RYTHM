# RYTHM

A comprehensive fitness training application with real-time analytics, workout tracking, and personalized training insights.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for development)

### Local Development Environment

**⚠️ IMPORTANT: This project uses Docker Compose for local development**

The local development environment is configured to run with Docker Compose, which provides:
- Containerized PostgreSQL database
- API server with hot reload
- Frontend with Next.js development server
- Proper networking between services

#### Starting the Development Environment

1. **Ensure Docker is running**
   ```bash
   # Start Docker Desktop if not already running
   open -a Docker
   ```

2. **Start all services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Verify all services are running**
   ```bash
   docker-compose ps
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
docker-compose logs -f

# View logs from specific service
docker-compose logs -f api
docker-compose logs -f mobile
docker-compose logs -f db

# Stop all services
docker-compose down

# Rebuild and restart services
docker-compose up -d --build

# Check service status
docker-compose ps
```

#### Why Docker Compose?

- **Consistent Environment**: Same setup across all development machines
- **Database Management**: PostgreSQL runs in a container with persistent data
- **Service Networking**: Proper internal networking between API and frontend
- **Hot Reload**: Development servers support live code changes
- **Easy Reset**: Clean database and services with simple commands

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

### Hot Reload

Both the API and frontend support hot reload during development:
- Frontend changes trigger Next.js hot reload
- API changes trigger nodemon restart
- Database schema changes require container restart

## 📝 Additional Documentation

- `DEBUG_GUIDE.md` - Debugging and troubleshooting
- `APPLICATION_FIXED.md` - Application fixes and improvements
- `TRAINING_LOAD_IMPLEMENTATION.md` - Training load system details