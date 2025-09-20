# RYTHM Quick Reference

## 🌐 Production URLs

| **Application** | **URL** | **Status** |
|----------------|---------|------------|
| **Mobile App** | `https://rythm.training` | ✅ Live |
| **Admin App** | `https://admin.rythm.training` | ✅ Live |
| **API Backend** | `https://api.rythm.training` | ⏳ DNS Pending |

## 🚀 Fast Deployment Commands

```bash
# Deploy API only (fastest for backend changes)
./scripts/build-api-direct.sh

# Deploy mobile app
./scripts/build-mobile-direct.sh

# Deploy admin app  
./scripts/build-admin-direct.sh

# Deploy everything
./scripts/build-all-direct.sh

# Deploy with custom tag
./scripts/build-api-direct.sh hotfix-$(date +%H%M)
```

## 🔧 Development URLs

```bash
# Local development
Mobile:  http://localhost:3000
Admin:   http://localhost:3002  
API:     http://localhost:3001

# Environment variable
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 📋 Common Tasks

### DNS Setup for api.rythm.training
```bash
# 1. Add TXT record: asuid.api.rythm.training
# Value: 5E8E9E4CF55A7645D02D12FA6815374B3BA938F9968F2A9E77BF186DC63F6C6B

# 2. Verify domain
az containerapp hostname add --hostname api.rythm.training --name ca-api-tvqklipuckq3a --resource-group rg-rythm-prod

# 3. Add CNAME: api.rythm.training → ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io
```

### Check Deployment Status
```bash
# Check container app status
az containerapp list --resource-group rg-rythm-prod --query "[].{name:name,status:properties.provisioningState,fqdn:properties.configuration.ingress.fqdn}" --output table

# Check latest revisions
az containerapp revision list --name ca-api-tvqklipuckq3a --resource-group rg-rythm-prod --query "[].{name:name,active:properties.active,createdTime:properties.createdTime}" --output table
```

### View Logs
```bash
# API logs
az containerapp logs show --name ca-api-tvqklipuckq3a --resource-group rg-rythm-prod --follow

# Mobile app logs  
az containerapp logs show --name ca-mobile-tvqklipuckq3a --resource-group rg-rythm-prod --follow

# Admin app logs
az containerapp logs show --name ca-admin-tvqklipuckq3a --resource-group rg-rythm-prod --follow
```

## 🔍 Troubleshooting

### API Not Responding
1. Check container status: `az containerapp show --name ca-api-tvqklipuckq3a --resource-group rg-rythm-prod`
2. Check logs: `az containerapp logs show --name ca-api-tvqklipuckq3a --resource-group rg-rythm-prod`
3. Quick redeploy: `./scripts/build-api-direct.sh`

### CORS Issues
- Mobile/Admin apps should use relative URLs (`/api/*`) 
- API proxy handles routing to backend
- Check environment variables in apps

### Build Issues
- Use direct ACR builds: `./scripts/build-*-direct.sh`
- Check ACR login: `az acr login --name crtvqklipuckq3a`
- Verify resource group access

## 📁 Key Files

- **Documentation**: `PRODUCTION_URLS.md`, `DNS_SETUP.md`
- **Build Scripts**: `scripts/build-*-direct.sh`
- **Config Files**: `apps/*/Dockerfile`, `apps/*/src/contexts/AuthContext.tsx`
- **Environment**: `.env.local` (development), Dockerfile ENV (production)