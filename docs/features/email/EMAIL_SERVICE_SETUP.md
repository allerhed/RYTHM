# Email Service Setup Guide - Azure Communication Services

This guide walks you through setting up Azure Communication Services Email for the RYTHM platform.

---

## 📋 Overview

RYTHM uses **Azure Communication Services (ACS) Email** to send:
- ✅ **Backup notifications** - Alert admins when backups succeed/fail
- 🔐 **Password reset emails** - Secure token delivery for password resets
- 💪 **Workout reminders** - Scheduled session notifications
- ⚠️ **Admin alerts** - System health, security, and resource warnings

---

## 💰 Cost Estimate

| Component | Cost | RYTHM Estimate |
|-----------|------|----------------|
| Per email | $0.00025 | 500-1,000 emails/month |
| Data transfer | $0.00012/MB | ~1MB per email |
| **Monthly Total** | | **~$0.20-$0.40** 💚 |

*Actual costs may vary based on email volume and content size.*

---

## 🚀 Azure Resource Setup

### Step 1: Create Azure Communication Services Resource

```bash
# Set variables
RESOURCE_GROUP="rg-rythm-prod"
LOCATION="swedencentral"
ACS_NAME="acs-rythm-prod"

# Create ACS resource
az communication create \
  --name $ACS_NAME \
  --resource-group $RESOURCE_GROUP \
  --location global \
  --data-location europe
```

**Note:** ACS is a global service, but data is stored in `europe` for GDPR compliance.

### Step 2: Create Email Communication Resource

```bash
# Set variables
EMAIL_NAME="email-rythm-prod"

# Create Email resource
az communication email create \
  --name $EMAIL_NAME \
  --resource-group $RESOURCE_GROUP \
  --location global \
  --data-location europe
```

### Step 3: Provision Email Domain

You have two options:

#### Option A: Azure-Managed Domain (Recommended for Quick Start)

```bash
# Create Azure-managed domain (instant, free)
az communication email domain create \
  --email-service-name $EMAIL_NAME \
  --resource-group $RESOURCE_GROUP \
  --domain-management AzureManaged \
  --location global
```

This creates a domain like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net`

✅ **Pros:**
- Instant setup (no DNS configuration)
- Free to use
- Microsoft-managed deliverability

⚠️ **Cons:**
- Generic sender address (e.g., `DoNotReply@...azurecomm.net`)
- Less professional branding

#### Option B: Custom Verified Domain (Recommended for Production)

```bash
# Create custom domain (requires DNS verification)
az communication email domain create \
  --email-service-name $EMAIL_NAME \
  --resource-group $RESOURCE_GROUP \
  --domain-management CustomerManaged \
  --domain-name "notify.rythm.training" \
  --location global
```

**DNS Configuration Required:**
1. Add TXT record for domain verification
2. Add SPF record: `v=spf1 include:spf.protection.outlook.com -all`
3. Add DKIM records (2x CNAME records provided by Azure)
4. Wait 24-48 hours for DNS propagation

✅ **Pros:**
- Professional sender address (e.g., `noreply@notify.rythm.training`)
- Better brand recognition
- Custom reply-to addresses

⚠️ **Cons:**
- Requires DNS access and configuration
- 24-48 hour verification time

### Step 4: Link Email Domain to ACS Resource

```bash
# Connect email domain to ACS resource
az communication email domain link \
  --email-service-name $EMAIL_NAME \
  --domain-name "notify.rythm.training" \
  --communication-service-name $ACS_NAME \
  --resource-group $RESOURCE_GROUP
```

### Step 5: Get Connection String

```bash
# Get ACS connection string
az communication list-key \
  --name $ACS_NAME \
  --resource-group $RESOURCE_GROUP \
  --query "primaryConnectionString" \
  --output tsv
```

**Output example:**
```
endpoint=https://acs-rythm-prod.communication.azure.com/;accesskey=abc123...
```

---

## 🔧 Environment Configuration

### Local Development (Docker Compose)

Add to `docker-compose.yml`:

```yaml
services:
  api:
    environment:
      # ... existing vars ...
      
      # Azure Communication Services Email
      ACS_CONNECTION_STRING: "endpoint=https://acs-rythm-prod.communication.azure.com/;accesskey=YOUR_KEY_HERE"
      ACS_SENDER_ADDRESS: "DoNotReply@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net"
```

### Azure Container Apps (Production)

```bash
# Set environment variables in Container App
az containerapp update \
  --name ca-api-rythm-prod \
  --resource-group $RESOURCE_GROUP \
  --set-env-vars \
    "ACS_CONNECTION_STRING=secretref:acs-connection-string" \
    "ACS_SENDER_ADDRESS=DoNotReply@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net"

# Store connection string as secret
az containerapp secret set \
  --name ca-api-rythm-prod \
  --resource-group $RESOURCE_GROUP \
  --secrets acs-connection-string="YOUR_CONNECTION_STRING_HERE"
```

**Security Best Practice:** Always use `secretref:` for connection strings in production.

---

## 📝 Bicep Infrastructure Template

Add to `infra/core/email/email.bicep`:

```bicep
@description('Azure Communication Services Email')
param name string
param location string = 'global'
param dataLocation string = 'europe'
param emailDomainName string
param tags object = {}

// Communication Services Resource
resource acs 'Microsoft.Communication/communicationServices@2023-04-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    dataLocation: dataLocation
  }
}

// Email Communication Resource
resource emailService 'Microsoft.Communication/emailServices@2023-04-01' = {
  name: '${name}-email'
  location: location
  tags: tags
  properties: {
    dataLocation: dataLocation
  }
}

// Azure-Managed Domain
resource emailDomain 'Microsoft.Communication/emailServices/domains@2023-04-01' = {
  parent: emailService
  name: 'AzureManagedDomain'
  location: location
  properties: {
    domainManagement: 'AzureManaged'
  }
}

// Link domain to ACS
resource domainLink 'Microsoft.Communication/communicationServices/linkedEmailServices@2023-04-01' = {
  parent: acs
  name: emailService.name
  properties: {
    emailServiceId: emailService.id
  }
}

output acsName string = acs.name
output acsEndpoint string = acs.properties.hostName
output senderAddress string = emailDomain.properties.fromSenderDomain
output connectionString string = acs.listKeys().primaryConnectionString
```

Add to `infra/main.bicep`:

```bicep
module email 'core/email/email.bicep' = {
  name: 'email-deployment'
  scope: rg
  params: {
    name: 'acs-rythm-prod'
    location: 'global'
    dataLocation: 'europe'
    emailDomainName: 'AzureManagedDomain'
    tags: tags
  }
}
```

---

## 🧪 Testing the Email Service

### Test Email Configuration

```bash
# SSH into API container or use local terminal
cd /Users/lars-olofallerhed/Code/Azure/RYTHM/apps/api

# Create test script
cat > test-email.ts << 'EOF'
import { emailService } from './src/services/EmailService';

async function testEmail() {
  console.log('📧 Testing Email Service...');
  console.log(`Service ready: ${emailService.isReady()}`);
  console.log(`Sender: ${emailService.getSenderAddress()}`);
  
  // Test backup notification
  const result = await emailService.sendBackupNotification({
    adminEmail: 'your-email@example.com',
    backupId: 'test-backup-123',
    status: 'success',
    size: 1024 * 1024 * 5, // 5 MB
    duration: 3500, // 3.5 seconds
    tenantName: 'Test Tenant',
  });
  
  console.log('Result:', result);
}

testEmail().catch(console.error);
EOF

# Run test
npx tsx test-email.ts
```

### Expected Output

```
📧 Testing Email Service...
✅ EmailService initialized with sender: DoNotReply@...azurecomm.net
Service ready: true
Sender: DoNotReply@xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.azurecomm.net
📧 Sending email to your-email@example.com: "✅ Database Backup Completed Successfully"
✅ Email sent successfully (ID: abc123...)
Result: { success: true, messageId: 'abc123...' }
```

---

## 📊 Monitoring & Analytics

### Azure Portal

1. Navigate to **Azure Communication Services** resource
2. Go to **Insights** → **Email Logs**
3. View:
   - Email send status (Succeeded/Failed)
   - Delivery reports
   - Bounce rates
   - Engagement metrics (opens, clicks)

### Query Logs with Azure Monitor

```kusto
ACSEmailStatusUpdateOperational
| where TimeGenerated > ago(7d)
| where MessageStatus == "Delivered" or MessageStatus == "Bounced"
| summarize 
    TotalSent = count(),
    Delivered = countif(MessageStatus == "Delivered"),
    Bounced = countif(MessageStatus == "Bounced")
  by bin(TimeGenerated, 1d)
| render timechart
```

---

## 🔍 Troubleshooting

### Issue: "EmailService: Not configured"

**Cause:** Missing environment variables

**Solution:**
```bash
# Check if variables are set
echo $ACS_CONNECTION_STRING
echo $ACS_SENDER_ADDRESS

# If empty, set them:
export ACS_CONNECTION_STRING="endpoint=https://...;accesskey=..."
export ACS_SENDER_ADDRESS="DoNotReply@...azurecomm.net"

# Restart API server
docker-compose restart api
```

### Issue: "Email send timeout or unknown status"

**Cause:** Email service is busy or experiencing delays

**Solution:**
- Check Azure service health: https://status.azure.com/
- Increase timeout in `EmailService.ts` (default: 30s)
- Verify sender address matches provisioned domain

### Issue: Emails going to spam

**Solutions:**
1. **Use custom domain** with proper SPF/DKIM records
2. **Warm up sender reputation** (send gradually increasing volumes)
3. **Avoid spam triggers** (no ALL CAPS, excessive links, spammy words)
4. **Include unsubscribe link** (optional but improves reputation)

### Issue: "Domain verification failed"

**Cause:** DNS records not configured correctly

**Solution:**
```bash
# Get verification records
az communication email domain show \
  --email-service-name $EMAIL_NAME \
  --domain-name "notify.rythm.training" \
  --resource-group $RESOURCE_GROUP

# Check DNS propagation
dig TXT notify.rythm.training
nslookup -type=TXT notify.rythm.training

# Wait 24-48 hours and verify again
az communication email domain verify \
  --email-service-name $EMAIL_NAME \
  --domain-name "notify.rythm.training" \
  --resource-group $RESOURCE_GROUP
```

---

## 📚 Additional Resources

- [Azure Communication Services Email Documentation](https://learn.microsoft.com/azure/communication-services/quickstarts/email/send-email)
- [Email Pricing Calculator](https://azure.microsoft.com/pricing/details/communication-services/)
- [Email Best Practices](https://learn.microsoft.com/azure/communication-services/concepts/email/email-best-practices)
- [Domain Verification Guide](https://learn.microsoft.com/azure/communication-services/quickstarts/email/add-custom-verified-domains)

---

## ✅ Next Steps

1. **Provision Azure resources** using CLI commands above
2. **Configure environment variables** in Container Apps
3. **Test email sending** with the test script
4. **(Optional) Configure custom domain** for professional branding
5. **Monitor email analytics** in Azure Portal

---

## 🎯 Usage Examples in Code

The email service is automatically integrated with:

1. **Backup notifications** - `apps/api/src/routes/backups.ts`
2. **Password resets** - Add to `apps/api/src/routes/auth.ts` (TODO)
3. **Workout reminders** - Add scheduled job (TODO)
4. **Admin alerts** - Add to error handlers (TODO)

See `apps/api/src/services/EmailService.ts` for all available methods.

---

*Last updated: October 2, 2025*
