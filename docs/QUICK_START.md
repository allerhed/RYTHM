# RYTHM Quick Start Guide

Quick reference for common development and deployment tasks.

## 🌐 URLs

### Production
- **Mobile App**: https://rythm.training
- **Admin App**: https://admin.rythm.training
- **API Backend**: https://api.rythm.training

### Local Development
- **Mobile**: http://localhost:3000
- **Admin**: http://localhost:3002
- **API**: http://localhost:3001

## 🚀 Common Commands

### Development

```bash
# Start all services
npm run dev
# or
docker-compose up -d

# View logs
npm run dev:logs            # All services
npm run dev:logs:api        # API only
npm run dev:logs:mobile     # Mobile only
npm run dev:logs:admin      # Admin only

# Restart services
npm run dev:restart
npm run dev:restart:api

# Stop all services
npm run dev:down

# Clean everything (removes data)
npm run dev:clean
```

### Deployment

```bash
# Deploy specific services
./scripts/build-api-direct.sh
./scripts/build-mobile-direct.sh
./scripts/build-admin-direct.sh

# Deploy everything
./scripts/build-all-direct.sh

# Deploy with custom tag
./scripts/build-api-direct.sh hotfix-$(date +%H%M)
```

### Azure CLI

```bash
# View logs
az containerapp logs show --name ca-api-tvqklipuckq3a --resource-group rg-rythm-prod --follow

# Check status
az containerapp list --resource-group rg-rythm-prod --query "[].{name:name,status:properties.provisioningState,fqdn:properties.configuration.ingress.fqdn}" --output table

# List revisions
az containerapp revision list --name ca-api-tvqklipuckq3a --resource-group rg-rythm-prod --query "[].{name:name,active:properties.active,createdTime:properties.createdTime}" --output table
```

### Database

```bash
# Access database shell
npm run dev:shell:db

# Run migrations
docker-compose exec api npm run db:migrate

# Backup database
docker-compose exec db pg_dump -U rythm_api rythm > backup.sql

# Restore database
docker-compose exec -T db psql -U rythm_api rythm < backup.sql
```

## 🔧 Default Credentials

### Admin Interface
- **System Admin**: admin@rythm.app / admin123
- **Orchestrator**: orchestrator@rythm.app / Password123

### Test User
- **Email**: test@example.com
- **Password**: password123

## 📁 Key Directories

```
apps/
├── api/              # Backend API (Express + tRPC)
├── mobile/           # Mobile PWA (Next.js)
└── admin/            # Admin dashboard (Next.js)

packages/
├── db/               # Database migrations and schemas
└── shared/           # Shared types and utilities

docs/                 # Documentation
scripts/              # Build and deployment scripts
```

## 🐛 Quick Troubleshooting

### Port Conflicts
```bash
# Kill processes on common ports
lsof -ti:3000,3001,3002,5432 | xargs kill -9
```

### Container Issues
```bash
# Rebuild from scratch
docker-compose down -v
docker-compose up -d --build
```

### API Not Responding
```bash
# Check health
curl http://localhost:3001/health

# View logs
docker-compose logs -f api
```

### Database Connection Failed
```bash
# Check database is running
docker-compose ps db

# Restart database
docker-compose restart db
```

## 📚 Documentation

- **[Full Installation Guide](getting-started/installation.md)**
- **[Development Guide](getting-started/development.md)**
- **[Docker Guide](getting-started/docker-guide.md)**
- **[Architecture Overview](architecture/overview.md)**
- **[Deployment Guide](deployment/azure-setup.md)**
- **[Troubleshooting](deployment/troubleshooting.md)**

## 🔗 Important Links

- **Repository**: https://github.com/allerhed/RYTHM
- **Documentation Hub**: [docs/README.md](README.md)
- **CHANGELOG**: [../CHANGELOG.md](../CHANGELOG.md)

---

*For detailed information, see the [complete documentation](README.md)*
