# Installation Guide

This guide will help you set up the RYTHM development environment on your local machine.

## Prerequisites

### Required Software
- **Docker Desktop** (latest version)
  - macOS: [Download Docker Desktop for Mac](https://www.docker.com/products/docker-desktop)
  - Windows: [Download Docker Desktop for Windows](https://www.docker.com/products/docker-desktop)
  - Linux: [Install Docker Engine](https://docs.docker.com/engine/install/)

### Optional Software
- **Git** - For version control
- **VS Code** - Recommended code editor with extensions:
  - Docker
  - TypeScript and JavaScript Language Features
  - ESLint
  - Prettier

## System Requirements

- **RAM**: Minimum 8GB (16GB recommended)
- **Disk Space**: Minimum 10GB free space
- **CPU**: 2 cores minimum (4 cores recommended)
- **OS**: macOS 10.15+, Windows 10/11, or modern Linux distribution

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/allerhed/RYTHM.git
cd RYTHM
```

### 2. Verify Docker Installation

Ensure Docker is running:

```bash
docker --version
docker-compose --version
```

You should see version information for both commands.

### 3. Start the Development Environment

The project includes npm scripts that wrap Docker commands:

```bash
npm run dev
```

This command will:
- Build all Docker containers
- Start PostgreSQL database
- Run database migrations
- Start the API server
- Start the mobile frontend
- Start the admin interface

### 4. Verify Installation

Check that all services are running:

```bash
npm run dev:status
```

You should see all services listed as "healthy" or "running".

### 5. Access the Applications

Once everything is running, you can access:

- **Mobile App**: http://localhost:3000
- **Admin Interface**: http://localhost:3002
- **API Health Check**: http://localhost:3001/health
- **Database**: localhost:5432

## Default Login Credentials

### Admin Interface
- **System Admin**: 
  - Email: `admin@rythm.app`
  - Password: `admin123`
  
- **Orchestrator**:
  - Email: `orchestrator@rythm.app`
  - Password: `Password123`

### Test User Account
- Email: `test@example.com`
- Password: `password123`

## Troubleshooting Installation

### Docker Not Starting

If Docker fails to start:

1. Ensure Docker Desktop is running
2. Check Docker has enough resources allocated (Settings → Resources)
3. Restart Docker Desktop

### Port Conflicts

If you get port conflict errors:

```bash
# Check what's using the ports
lsof -i :3000  # Mobile app
lsof -i :3001  # API
lsof -i :3002  # Admin
lsof -i :5432  # Database

# Stop the conflicting process or change ports in docker-compose.yml
```

### Database Connection Issues

If the API can't connect to the database:

```bash
# Check database logs
npm run dev:logs:db

# Restart database service
docker-compose restart db
```

### Container Build Failures

If containers fail to build:

```bash
# Clean Docker cache and rebuild
npm run dev:clean
npm run dev:build
npm run dev
```

## Environment Variables

The development environment uses default values. For production or custom configuration, create `.env.local` files:

### API Environment Variables
```bash
# apps/api/.env.local
NODE_ENV=development
DATABASE_URL=postgresql://rythm_api:password@db:5432/rythm
JWT_SECRET=your-development-secret-key
PORT=3001
```

### Frontend Environment Variables
```bash
# apps/mobile/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NODE_ENV=development
```

## Next Steps

Now that you have RYTHM installed:

1. **[Development Guide](development.md)** - Learn the development workflow
2. **[Docker Guide](docker-guide.md)** - Understand the Docker setup
3. **[Architecture Overview](../architecture/overview.md)** - Understand the system design

## Common Commands

```bash
# Start development environment
npm run dev

# Stop all services
npm run dev:down

# View logs
npm run dev:logs
npm run dev:logs:api
npm run dev:logs:mobile
npm run dev:logs:admin
npm run dev:logs:db

# Restart services
npm run dev:restart
npm run dev:restart:api
npm run dev:restart:mobile

# Clean everything (removes volumes)
npm run dev:clean

# Check service status
npm run dev:status

# Access container shells
npm run dev:shell:api
npm run dev:shell:mobile
npm run dev:shell:db
```

---

*For more detailed development information, see the [Development Guide](development.md)*
