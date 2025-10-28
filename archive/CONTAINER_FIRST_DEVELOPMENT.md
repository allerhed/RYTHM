# 🐳 Container-First Local Development

**Updated:** October 10, 2025  
**Approach:** All local development uses Docker containers

---

## 🎯 Philosophy

RYTHM uses a **container-first approach** for local development. This means:

✅ **No local installation required** - No PostgreSQL, Node.js version management, etc.  
✅ **Consistent environments** - Same setup for all developers  
✅ **Production parity** - Dev environment matches Azure Container Apps  
✅ **Easy onboarding** - `npm run dev` and you're running  
✅ **Clean cleanup** - `docker-compose down` and nothing persists  

---

## 📋 Prerequisites

Only 2 things needed:

1. **Docker Desktop** - [Install Docker](https://www.docker.com/products/docker-desktop)
2. **npm** - For running convenience scripts (comes with Node.js)

That's it! No PostgreSQL, no version managers, no system dependencies.

---

## 🚀 Quick Start

### 1. Start Everything
```bash
npm run dev
# or
./scripts/start.sh
```

This will:
- ✅ Create `.env` file if needed
- ✅ Build Docker images
- ✅ Start PostgreSQL database
- ✅ Run migrations
- ✅ Start API server
- ✅ Start mobile PWA
- ✅ Start admin dashboard
- ✅ Health check all services

### 2. Access Services
- **Mobile PWA:** http://localhost:3000
- **Admin Dashboard:** http://localhost:3002
- **API Server:** http://localhost:3001
- **Database:** localhost:5432

### 3. Stop Everything
```bash
npm run dev:down
# or
./scripts/stop.sh
```

---

## 🛠️ All Docker-Based Scripts

### Core Development Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| **Start dev** | `npm run dev` | Start all services in Docker |
| **Stop dev** | `npm run dev:down` | Stop all services |
| **Rebuild** | `npm run dev:build` | Rebuild Docker images |
| **Health check** | `npm run dev:health` | Check service status |
| **View logs** | `npm run dev:logs` | Tail all service logs |

### Service Management Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| **Restart API** | `npm run dev:restart:api` | Restart API container |
| **Restart Mobile** | `npm run dev:restart:mobile` | Restart mobile container |
| **Restart Admin** | `npm run dev:restart:admin` | Restart admin container |
| **API logs** | `npm run dev:logs:api` | View API logs only |
| **Mobile logs** | `npm run dev:logs:mobile` | View mobile logs only |
| **DB logs** | `npm run dev:logs:db` | View database logs |

### Database Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| **DB shell** | `npm run dev:shell:db` | Open psql in container |
| **API shell** | `npm run dev:shell:api` | Open shell in API container |
| **Run migrations** | `./scripts/run-migrations.sh` | Auto-detects Docker/prod |
| **Create admin user** | `./scripts/create-admin-user.sh` | Uses Docker container |
| **Generate test data** | `npm run generate-test-data` | Uses Docker DB |
| **Generate training data** | `npm run generate-training-data` | Uses Docker DB |

---

## 📁 Container Structure

### Services Defined
```yaml
# docker-compose.yml

services:
  db:           # PostgreSQL 15-alpine
    - Port: 5432
    - User: rythm_api
    - Database: rythm
    - Volume: postgres_data (persistent)
    - Migrations: Auto-run on init

  api:          # Node.js tRPC API
    - Port: 3001
    - Depends on: db
    - Hot reload: Yes (volume mounted)
    - Health check: /health endpoint

  mobile:       # Next.js PWA
    - Port: 3000
    - Depends on: api
    - Hot reload: Yes (volume mounted)
    - Dev mode: next dev

  admin:        # Next.js Admin Dashboard
    - Port: 3002
    - Depends on: api
    - Hot reload: Yes (volume mounted)
    - Dev mode: next dev
```

---

## 🔄 Script Auto-Detection

### `run-migrations.sh`
```bash
# Smart migration script
1. Checks if Docker is running
2. Checks if db container is up
3. If yes → Uses Docker (run-migrations-docker.sh)
4. If no → Falls back to environment variables (for Azure)
```

This means:
- ✅ **Local dev:** Automatically uses Docker
- ✅ **Production:** Uses Azure environment variables
- ✅ **No configuration needed!**

---

## 🚫 What NOT to Use for Local Dev

### ❌ Native PostgreSQL Installation
```bash
# DON'T DO THIS for local dev
brew install postgresql@15
```

**Why not:**
- Extra system dependencies
- Version conflicts
- Manual configuration
- Not production-like
- Hard to clean up

### ❌ Local Node.js Servers
```bash
# DON'T DO THIS for local dev
cd apps/api && npm run dev
```

**Why not:**
- Database connection issues
- Environment variable management
- Not containerized
- Different from production
- Hard to onboard teammates

### ✅ Use Docker Instead
```bash
# DO THIS for local dev
npm run dev
```

**Benefits:**
- Everything just works
- Production parity
- Easy onboarding
- Clean cleanup
- Consistent for everyone

---

## 🐛 Troubleshooting

### Docker Not Running
```bash
❌ Docker is not running. Please start Docker and try again.
```
**Solution:** Start Docker Desktop

### Port Already in Use
```bash
❌ Error: Port 5432 already in use
```
**Solution:** 
```bash
# Check what's using the port
lsof -i :5432

# If it's local PostgreSQL, stop it
brew services stop postgresql@15

# Or change port in docker-compose.yml
```

### Containers Won't Start
```bash
# Check container status
docker-compose ps

# Check logs
docker-compose logs

# Rebuild from scratch
npm run dev:clean
npm run dev:build
npm run dev
```

### Database Issues
```bash
# Connect to database
npm run dev:shell:db

# Check tables
\dt

# Check schema
\d sessions

# Exit
\q
```

### Code Changes Not Reflecting
```bash
# Restart specific service
npm run dev:restart:api
npm run dev:restart:mobile

# Or rebuild everything
npm run dev:build
npm run dev
```

---

## 📊 Development Workflow

### Daily Workflow
```bash
# Morning: Start everything
npm run dev

# Work on code (hot reload works!)
# Edit files in apps/api, apps/mobile, etc.
# Changes auto-reload in containers

# Check service health
npm run dev:health

# View logs if needed
npm run dev:logs:api

# Evening: Stop everything
npm run dev:down
```

### Database Workflow
```bash
# Create migration
# Edit packages/db/migrations/XXX_your_migration.sql

# Apply migration
docker-compose exec api npm run db:migrate

# Verify in DB shell
npm run dev:shell:db
\dt
\q

# Generate test data
npm run generate-training-data
```

### Testing Workflow
```bash
# Run tests in container
docker-compose exec api npm test

# Or run specific service tests
docker-compose exec mobile npm test
```

---

## 🎓 For New Developers

### Onboarding Checklist
1. ✅ Install Docker Desktop
2. ✅ Clone repository
3. ✅ Run `npm install`
4. ✅ Run `npm run dev`
5. ✅ Open http://localhost:3000
6. ✅ Start coding!

**That's it!** No PostgreSQL installation, no version managers, no environment setup.

---

## 🏗️ Production vs Development

| Aspect | Local Dev (Docker) | Production (Azure) |
|--------|-------------------|-------------------|
| **Database** | Docker container | Azure PostgreSQL Flexible |
| **API** | Docker container | Azure Container App |
| **Mobile** | Docker container | Azure Container App |
| **Admin** | Docker container | Azure Container App |
| **Migrations** | Auto-detected (Docker) | Environment variables |
| **Environment** | `.env` file | Azure Key Vault + Config |
| **Scaling** | Single instance | Auto-scaling |
| **SSL** | No | Yes (automatic) |

**Key point:** Development uses Docker to mimic production container environment!

---

## 📝 Best Practices

### ✅ Do This
- Run `npm run dev` to start
- Use Docker for all local development
- Commit with containers running (hot reload works)
- Use `npm run dev:logs` to debug
- Run `npm run dev:down` when done

### ❌ Don't Do This
- Install PostgreSQL locally
- Run services outside Docker
- Modify Docker files without team discussion
- Commit `.env` file (it's gitignored)
- Mix Docker and native installations

---

## 🔗 Related Documentation

- **Docker Compose:** `docker-compose.yml`
- **Container Dockerfiles:**
  - `apps/api/Dockerfile.dev`
  - `apps/mobile/Dockerfile.dev`
  - `apps/admin/Dockerfile.dev`
- **Migration Scripts:** `scripts/run-migrations*.sh`
- **Database Schema:** `packages/db/migrations/`

---

## 🆘 Getting Help

### Check Service Status
```bash
npm run dev:status
```

### Check Health
```bash
npm run dev:health
```

### View All Logs
```bash
npm run dev:logs
```

### Nuclear Option (Clean Everything)
```bash
npm run dev:clean
# This removes all containers, volumes, and images
# Then start fresh:
npm run dev
```

---

**Remember:** When in doubt, `npm run dev` is your friend! 🐳
