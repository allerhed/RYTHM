@description('Azure Communication Services Email Infrastructure')
param name string
param location string = 'global'
param dataLocation string = 'europe'
param tags object = {}

@description('Whether to use Azure-managed domain (true) or custom domain (false)')
param useAzureManagedDomain bool = true

@description('Custom domain name (only used if useAzureManagedDomain = false)')
param customDomainName string = ''

// ============================================================================
// Azure Communication Services Resource
// ============================================================================

resource communicationService 'Microsoft.Communication/communicationServices@2023-04-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    dataLocation: dataLocation
  }
}

// ============================================================================
// Email Communication Service
// ============================================================================

resource emailService 'Microsoft.Communication/emailServices@2023-04-01' = {
  name: '${name}-email'
  location: location
  tags: tags
  properties: {
    dataLocation: dataLocation
  }
}

// ============================================================================
// Email Domain - Azure Managed
// ============================================================================

resource azureManagedDomain 'Microsoft.Communication/emailServices/domains@2023-04-01' = if (useAzureManagedDomain) {
  parent: emailService
  name: 'AzureManagedDomain'
  location: location
  properties: {
    domainManagement: 'AzureManaged'
  }
}

// ============================================================================
// Email Domain - Custom Domain
// ============================================================================

resource customDomain 'Microsoft.Communication/emailServices/domains@2023-04-01' = if (!useAzureManagedDomain && !empty(customDomainName)) {
  parent: emailService
  name: customDomainName
  location: location
  properties: {
    domainManagement: 'CustomerManaged'
    userEngagementTracking: 'Enabled'
  }
}

// ============================================================================
// Link Email Service to Communication Service
// ============================================================================

resource domainLink 'Microsoft.Communication/emailServices/domains/senderUsernames@2023-04-01' = if (useAzureManagedDomain) {
  parent: azureManagedDomain
  name: 'DoNotReply'
  properties: {
    username: 'DoNotReply'
    displayName: 'RYTHM Training Platform'
  }
}

// ============================================================================
// Outputs
// ============================================================================

output communicationServiceName string = communicationService.name
output communicationServiceId string = communicationService.id
output endpoint string = communicationService.properties.hostName

// Connection string - retrieve via CLI: az communication list-key
output connectionStringSecretName string = 'acs-connection-string'

output emailServiceName string = emailService.name
output emailServiceId string = emailService.id

output senderDomain string = useAzureManagedDomain && useAzureManagedDomain 
  ? azureManagedDomain.properties.fromSenderDomain 
  : 'pending-verification'

output senderAddress string = useAzureManagedDomain && useAzureManagedDomain
  ? 'DoNotReply@${azureManagedDomain.properties.fromSenderDomain}'
  : 'noreply@${customDomainName}'

output domainVerificationStatus string = useAzureManagedDomain 
  ? 'Verified' 
  : 'Pending'

@description('Instructions for custom domain verification')
output customDomainInstructions string = useAzureManagedDomain 
  ? 'Using Azure-managed domain - no verification needed' 
  : 'Custom domain requires DNS verification. Check Azure Portal for TXT, SPF, DKIM records.'
