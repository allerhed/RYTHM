# RYTHM Development Environment Setup

## 🐳 Docker Compose Configuration

**CRITICAL: This project requires Docker Compose for local development**

### Why Docker Compose?

This project is specifically configured to use Docker Compose for the local development environment due to:

1. **Service Dependencies**: The application requires PostgreSQL database
2. **Network Configuration**: Internal container networking between services
3. **Environment Consistency**: Same setup across all development machines
4. **Hot Reload Support**: All services support live code changes
5. **Easy Database Management**: PostgreSQL runs in container with persistent data

### Services Architecture

```yaml
services:
  db:          # PostgreSQL 15 database
  api:         # Express.js + tRPC backend  
  mobile:      # Next.js frontend
```

### Network Configuration

- **Internal**: Services communicate via Docker network (api:3001)
- **External**: Host access via localhost ports
- **Frontend → API**: Uses `http://api:3001` internally
- **External API Access**: `http://localhost:3001`
- **External Frontend**: `http://localhost:3000`

## 🚀 Standard Development Workflow

### 1. Starting Development Environment

```bash
# Ensure Docker Desktop is running
open -a Docker

# Start all services
docker-compose up -d

# Verify services are healthy
docker-compose ps
```

### 2. Development Commands

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f mobile
docker-compose logs -f db

# Restart specific service
docker-compose restart api

# Rebuild and restart all services
docker-compose up -d --build
```

### 3. Stopping Development Environment

```bash
# Stop all services (keeps data)
docker-compose down

# Stop and remove volumes (resets database)
docker-compose down -v
```

## 🔧 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill processes on ports 3000/3001
   lsof -ti:3000,3001 | xargs kill -9
   ```

2. **Container Won't Start**
   ```bash
   # Rebuild containers
   docker-compose up -d --build --force-recreate
   ```

3. **Database Connection Issues**
   ```bash
   # Check database container logs
   docker-compose logs -f db
   
   # Reset database
   docker-compose down -v
   docker-compose up -d
   ```

4. **API Not Responding**
   ```bash
   # Check API health
   curl http://localhost:3001/health
   
   # Check API logs
   docker-compose logs -f api
   ```

### Service Health Checks

All services include health checks:
- **DB**: PostgreSQL ready to accept connections
- **API**: Express server responding on /health
- **Mobile**: Next.js development server ready

## 📝 Important Notes for Developers

### DO NOT Use `npm run dev`

- The project is NOT configured for `npm run dev`
- Network configuration expects Docker Compose networking
- Database connection requires containerized PostgreSQL
- tRPC client is configured for container-to-container communication

### Environment Variables

- Located in `.env.local`
- Automatically loaded by Docker Compose
- Contains database connection strings and API configurations

### Code Changes & Hot Reload

- **Frontend**: Next.js hot reload works automatically
- **API**: Nodemon restarts on file changes
- **Database**: Migrations run automatically on API startup

### Database Access

```bash
# Connect to PostgreSQL container
docker-compose exec db psql -U postgres -d rythm

# Run database migrations manually
docker-compose exec api npm run migrate
```

## 🎯 Key URLs During Development

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Main application |
| Dashboard | http://localhost:3000/dashboard | Training dashboard |
| Analytics | http://localhost:3000/analytics | Analytics page |
| API Health | http://localhost:3001/health | API status check |
| tRPC Endpoint | http://localhost:3001/api/trpc | tRPC procedures |

---

**Remember**: Always use Docker Compose for local development. This ensures consistent behavior across all development environments and matches the production deployment architecture.