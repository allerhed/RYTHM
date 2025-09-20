# DNS Configuration for api.rythm.training

## Required DNS Records

To complete the setup of `api.rythm.training` custom domain, you need to add the following DNS records to your domain registrar:

### 1. Domain Verification Record
**Type:** TXT  
**Name:** `asuid.api.rythm.training`  
**Value:** `5E8E9E4CF55A7645D02D12FA6815374B3BA938F9968F2A9E77BF186DC63F6C6B`  
**TTL:** 300 (or default)

### 2. CNAME Record (add after verification)
**Type:** CNAME  
**Name:** `api.rythm.training`  
**Value:** `ca-api-tvqklipuckq3a.niceflower-8f98874d.swedencentral.azurecontainerapps.io`  
**TTL:** 300 (or default)

## Setup Steps

1. **Add TXT Record First**: Add the TXT record for domain verification
2. **Wait for DNS Propagation**: Usually takes 5-15 minutes
3. **Verify with Azure**: Run the hostname add command again:
   ```bash
   az containerapp hostname add --hostname api.rythm.training --name ca-api-tvqklipuckq3a --resource-group rg-rythm-prod
   ```
4. **Add CNAME Record**: After Azure verification succeeds
5. **Test**: Access `https://api.rythm.training` to verify

## Current Status

- ✅ **API Container**: Deployed and running with updated image
- ✅ **Build Scripts**: Direct ACR build scripts created and tested
- ✅ **Code Updates**: All apps now reference `api.rythm.training`
- ⏳ **DNS Setup**: Waiting for TXT record to be added to domain

## URLs After Complete Setup

- **Mobile App**: `https://rythm.training`
- **Admin App**: `https://admin.rythm.training`  
- **API**: `https://api.rythm.training`

All apps are now configured to use the clean custom domain URLs!