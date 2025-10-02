# Docker Development Guide

RYTHM runs exclusively in Docker containers. This guide explains the Docker setup and how to work effectively with the containerized development environment.

## Why Docker-Only Development?

- ✅ **Zero Local Dependencies** - No Node.js, PostgreSQL, or other tools needed on your machine
- ✅ **Consistent Environment** - Identical setup across all development machines
- ✅ **Instant Hot Reload** - Volume mounting provides instant code changes without rebuilds
- ✅ **Isolated Database** - PostgreSQL runs in container with persistent data volumes
- ✅ **Perfect Networking** - Container networking matches production deployment
- ✅ **Easy Reset** - Clean slate development environment with one command
- ✅ **Production Parity** - Development environment matches production containers

## Docker Compose Architecture

```yaml
services:
  db:        # PostgreSQL 15 database
  api:       # Express.js + tRPC API server
  mobile:    # Next.js mobile PWA
  admin:     # Next.js admin interface
```

### Service Details

#### Database (db)
- **Image**: postgres:15-alpine
- **Port**: 5432
- **Volumes**: Persistent data storage
- **Health Check**: Ensures database is ready before starting dependent services

#### API (api)
- **Build**: Custom Dockerfile with Node.js
- **Port**: 3001
- **Volumes**: Hot reload for src files
- **Dependencies**: Waits for db to be healthy

#### Mobile (mobile)
- **Build**: Next.js development container
- **Port**: 3000
- **Volumes**: Hot reload for src files
- **Dependencies**: None (communicates with API via HTTP)

#### Admin (admin)
- **Build**: Next.js development container
- **Port**: 3002
- **Volumes**: Hot reload for src files
- **Dependencies**: None (communicates with API via HTTP)

## Volume Mounting

The development setup uses volume mounting for instant code changes:

```yaml
volumes:
  # API hot reload
  - ./apps/api/src:/app/apps/api/src
  - ./packages:/app/packages
  
  # Mobile hot reload
  - ./apps/mobile/src:/app/apps/mobile/src
  - ./packages:/app/packages
  
  # Admin hot reload
  - ./apps/admin/src:/app/apps/admin/src
  - ./packages:/app/packages
```

### What This Means

When you edit files in your local editor:
1. Changes are immediately reflected in the container
2. Next.js/tsx watch mode detects changes
3. Hot reload triggers automatically
4. No rebuild required

## Container Networking

Services communicate using Docker's internal network:

```
mobile (3000) ──HTTP──> api (3001) ──TCP──> db (5432)
admin (3002)  ──HTTP──> api (3001)
```

### Internal vs External Access

**Internal (container-to-container)**:
- API connects to database: `db:5432`
- Frontend would use: `http://api:3001` (not used, uses external)

**External (host-to-container)**:
- Browser to mobile: `http://localhost:3000`
- Browser to admin: `http://localhost:3002`
- Mobile/Admin to API: `http://localhost:3001`

## Managing Containers

### Starting Services

```bash
# Start all services
npm run dev

# Or manually with Docker Compose
docker-compose up -d

# Start specific services
docker-compose up -d db api
```

### Stopping Services

```bash
# Stop all services (keeps containers and volumes)
npm run dev:down

# Or manually
docker-compose down

# Stop and remove volumes (deletes database data)
docker-compose down -v
```

### Viewing Logs

```bash
# All services
npm run dev:logs

# Specific service
npm run dev:logs:api
npm run dev:logs:mobile
npm run dev:logs:admin
npm run dev:logs:db

# Follow logs in real-time
docker-compose logs -f api
```

### Restarting Services

```bash
# Restart all
npm run dev:restart

# Restart specific service
npm run dev:restart:api
docker-compose restart api

# Rebuild and restart after Dockerfile changes
npm run dev:build
docker-compose up -d --build
```

### Checking Status

```bash
# Check running containers
npm run dev:status
docker-compose ps

# Check container health
docker ps --format "table {{.Names}}\t{{.Status}}"
```

## Working with Containers

### Accessing Container Shells

```bash
# API container shell
npm run dev:shell:api
docker-compose exec api sh

# Database shell (psql)
npm run dev:shell:db
docker-compose exec db psql -U rythm_api -d rythm

# Mobile container shell
npm run dev:shell:mobile
docker-compose exec mobile sh
```

### Running Commands in Containers

```bash
# Install npm package in API
docker-compose exec api npm install package-name

# Run database migration
docker-compose exec api npm run db:migrate

# Run tests
docker-compose exec api npm test
```

### Inspecting Container Details

```bash
# View container configuration
docker inspect rythm-api-1

# View container logs from specific time
docker logs --since 10m rythm-api-1

# View container resource usage
docker stats
```

## Development Workflow

### Making Code Changes

1. Edit files in your local editor (VS Code, etc.)
2. Changes are automatically synced to container
3. Watch mode detects changes and reloads
4. Refresh browser to see changes (or automatic with Next.js)

**No rebuild required for code changes!**

### Adding Dependencies

When you add a new npm package:

```bash
# 1. Access the container shell
npm run dev:shell:api

# 2. Install the package
npm install new-package

# 3. Exit shell
exit

# 4. Restart the service
npm run dev:restart:api
```

Or do it directly:

```bash
docker-compose exec api npm install new-package
docker-compose restart api
```

### Database Changes

```bash
# Create migration file (in packages/db/migrations/)
# Example: 004_add_new_column.sql

# Run migrations
docker-compose exec api npm run db:migrate

# Or access database directly
npm run dev:shell:db
# Then run SQL commands
```

### Dockerfile Changes

When you modify a Dockerfile:

```bash
# Rebuild specific service
docker-compose build api

# Rebuild and restart
docker-compose up -d --build api

# Or rebuild everything
npm run dev:build
npm run dev
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker-compose logs api

# Try rebuilding
docker-compose build --no-cache api
docker-compose up -d api
```

### Port Already in Use

```bash
# Find what's using the port
lsof -i :3001

# Kill the process or change ports in docker-compose.yml
```

### Database Connection Issues

```bash
# Check database is running
docker-compose ps db

# Check database logs
npm run dev:logs:db

# Verify database is ready
docker-compose exec db pg_isready -U rythm_api

# Restart database
docker-compose restart db
```

### Hot Reload Not Working

```bash
# Ensure volume mounts are correct
docker inspect rythm-api-1 | grep Mounts -A 20

# Restart the service
npm run dev:restart:api

# Rebuild if necessary
docker-compose build api
docker-compose up -d api
```

### Out of Disk Space

```bash
# Remove unused containers, networks, images
docker system prune -f

# Remove all stopped containers
docker container prune -f

# Remove unused volumes (WARNING: deletes data)
docker volume prune -f

# Remove unused images
docker image prune -f
```

### Clean Slate Reset

```bash
# Stop everything and remove volumes
npm run dev:clean

# This removes:
# - All containers
# - All volumes (database data)
# - Unused networks
# - Dangling images

# Then start fresh
npm run dev
```

## Best Practices

### ✅ Do's

- Use npm scripts (`npm run dev`, etc.) for consistency
- Keep containers running during development
- Use `docker-compose exec` for running commands
- Commit changes to git before major cleanup
- Use volume mounts for code (already configured)
- Check logs when things don't work

### ❌ Don'ts

- Don't install Node.js or PostgreSQL locally
- Don't run `npm install` outside containers
- Don't edit files inside containers
- Don't remove volumes without backing up data
- Don't run production commands in development

## Performance Tips

### Optimize Docker Desktop

**macOS Settings → Resources**:
- **CPUs**: Allocate at least 2 cores (4 recommended)
- **Memory**: Allocate at least 4GB (8GB recommended)
- **Disk**: Ensure enough space for volumes

### Speed Up Builds

```bash
# Use BuildKit for faster builds
export DOCKER_BUILDKIT=1
docker-compose build

# Or add to docker-compose.yml:
version: '3.8'
x-build: &build
  context: .
  cache_from:
    - node:18-alpine
```

### Reduce Volume Overhead

The development setup already excludes `node_modules` from volume mounts to improve performance.

## Environment Variables

### Default Development Values

```bash
# Database (db service)
POSTGRES_DB=rythm
POSTGRES_USER=rythm_api
POSTGRES_PASSWORD=password

# API (api service)
NODE_ENV=development
DATABASE_URL=postgresql://rythm_api:password@db:5432/rythm
JWT_SECRET=your-development-secret-key
PORT=3001

# Frontend (mobile/admin services)
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Overriding Values

Create `.env` file in project root:

```bash
# Custom database password
POSTGRES_PASSWORD=my-secure-password

# Custom JWT secret
JWT_SECRET=my-secret-key
```

Docker Compose will automatically load these.

## Dockerfile Structure

### Multi-Stage Builds

```dockerfile
# Development Dockerfile (Dockerfile.dev)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# Production Dockerfile (Dockerfile)
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/index.js"]
```

## Next Steps

- **[Development Guide](development.md)** - Learn the development workflow
- **[Architecture Overview](../architecture/overview.md)** - Understand the system
- **[Troubleshooting](../deployment/troubleshooting.md)** - Fix common issues

---

*For installation help, see the [Installation Guide](installation.md)*
