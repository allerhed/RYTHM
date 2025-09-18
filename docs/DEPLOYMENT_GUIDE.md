# Azure Deployment Guide

## Quick Start

### 1. Infrastructure Setup (One-time)
```bash
# Manual deployment via GitHub Actions
1. Go to Actions → Deploy Infrastructure
2. Select environment: prod
3. Type "deploy" to confirm
4. Wait for completion (~10-15 minutes)
```

### 2. Application Deployment (Automatic)
Applications deploy automatically when you push to `main` branch:
```bash
git push origin main
```

Or deploy manually:
```bash
# Manual deployment via GitHub Actions
1. Go to Actions → Deploy Applications  
2. Select environment: prod
3. Run workflow
```

## Production URLs
After deployment, your applications will be available at:
- **API**: `https://ca-rythm-api-prod.[random-id].swedencentral.azurecontainerapps.io`
- **Mobile**: `https://ca-rythm-mobile-prod.[random-id].swedencentral.azurecontainerapps.io`

## Backup & Recovery
- **Automated**: Daily backups at 2 AM UTC
- **Manual**: Run "Backup Strategy" workflow
- **Retention**: 30 days
- **Recovery**: Contact support for restoration

## Environment Details
- **Region**: Sweden Central (EU)
- **Environment**: Production only
- **Resources**: Container Apps, PostgreSQL, Storage, Key Vault
- **Cost**: ~$50-70/month