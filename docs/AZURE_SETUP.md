# RYTHM Azure Deployment Setup Guide

This guide provides secure setup instructions for deploying the RYTHM application to Azure using GitHub Actions.

## Prerequisites

- Azure CLI installed and configured
- GitHub CLI installed and configured  
- Access to an Azure subscription
- Repository admin permissions

## Azure Setup

### 1. Create Azure Service Principal

Create a service principal for GitHub Actions authentication:

```bash
# Login to Azure
az login

# Create service principal
az ad sp create-for-rbac \
  --name "rythm-github-actions" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID \
  --sdk-auth
```

**Important**: Save the output JSON securely. You'll need the `clientId`, `clientSecret`, `subscriptionId`, and `tenantId` values.

### 2. Configure GitHub Repository Secrets

Set up the following secrets in your GitHub repository (Settings → Secrets and variables → Actions):

**Required Secrets:**
- `AZURE_CLIENT_ID`: Service principal client ID
- `AZURE_CLIENT_SECRET`: Service principal client secret  
- `AZURE_SUBSCRIPTION_ID`: Your Azure subscription ID
- `AZURE_TENANT_ID`: Your Azure tenant ID

**Repository Variables:**
- `AZURE_LOCATION`: Set to `swedencentral` for EU deployment

### 3. Create GitHub Environment

Create a `prod` environment in your repository:
1. Go to Settings → Environments
2. Click "New environment"
3. Name it `prod`
4. Configure protection rules as needed

## Deployment Process

### Infrastructure Deployment

1. Go to Actions → Deploy Infrastructure
2. Select "prod" environment
3. Type "deploy" to confirm
4. Run workflow

This will:
- Create Azure resource group in Sweden Central
- Deploy Container Apps, PostgreSQL, Storage, Key Vault
- Generate and store secure passwords
- Run database migrations
- Configure all required Azure resources

### Application Deployment

Applications deploy automatically on pushes to `main` branch, or can be triggered manually:

1. Go to Actions → Deploy Applications  
2. Select "prod" environment
3. Run workflow

This will:
- Build Docker images for API and Mobile apps
- Push images to Azure Container Registry
- Deploy to Container Apps
- Perform health checks

## Architecture Overview

**Production Environment (Sweden Central):**
- **API**: Azure Container Apps (ca-rythm-api-prod)
- **Mobile**: Azure Container Apps (ca-rythm-mobile-prod)  
- **Database**: PostgreSQL Flexible Server (Burstable B1ms)
- **Storage**: Azure Storage Account for uploads and backups
- **Registry**: Azure Container Registry (Basic tier)
- **Secrets**: Azure Key Vault for secure credential management

## Backup Strategy

Automated daily backups at 2 AM UTC:
- **Database**: Full PostgreSQL dump with compression
- **Files**: User uploads synchronized to backup containers
- **Retention**: 30 days automatic cleanup
- **Location**: Azure Storage Account with geo-redundancy

## Security Features

- No hardcoded secrets in repository
- Service principal authentication with minimal permissions
- Secrets stored in Azure Key Vault
- GitHub environment protection for production
- Automated secret masking in workflow logs
- HTTPS-only communication between services

## Monitoring and Logs

Access application logs and metrics:
```bash
# View API logs
az containerapp logs show --name ca-rythm-api-prod --resource-group rg-rythm-prod --follow

# View Mobile logs  
az containerapp logs show --name ca-rythm-mobile-prod --resource-group rg-rythm-prod --follow

# View PostgreSQL metrics
az postgres flexible-server show --name [server-name] --resource-group rg-rythm-prod
```

## Troubleshooting

### Common Issues

**Deployment fails with authentication errors:**
- Verify GitHub secrets are correctly set
- Check service principal permissions
- Ensure Azure subscription is active

**Database connection errors:**
- Check PostgreSQL firewall rules
- Verify connection string format
- Confirm password is correctly stored in Key Vault

**Container App startup issues:**
- Review application logs using Azure CLI
- Check environment variables are set correctly
- Verify Docker image builds successfully

### Support Commands

```bash
# Check resource group status
az group show --name rg-rythm-prod

# List all Container Apps
az containerapp list --resource-group rg-rythm-prod --output table

# Check PostgreSQL status
az postgres flexible-server list --resource-group rg-rythm-prod --output table

# View storage account details
az storage account list --resource-group rg-rythm-prod --output table
```

## Cost Management

**Estimated Monthly Costs (Sweden Central):**
- Container Apps: ~$15-30/month (based on usage)
- PostgreSQL Flexible Server (B1ms): ~$25/month
- Azure Storage: ~$5-10/month
- Container Registry (Basic): ~$5/month
- Key Vault: ~$1/month

**Total Estimated**: $50-70/month for production environment

## Next Steps

1. **Custom Domains**: Configure custom domain names for your applications
2. **SSL Certificates**: Set up SSL certificates for custom domains
3. **Monitoring**: Configure Azure Monitor alerts for application health
4. **Scaling**: Adjust Container Apps scaling rules based on usage patterns
5. **Backup Testing**: Periodically test backup restoration procedures