@description('The name of the Log Analytics workspace')
param logAnalyticsName string = ''

@description('The name of the Application Insights resource')
param applicationInsightsName string = ''

@description('Location for the resources')
param location string = resourceGroup().location

@description('Tags to apply to resources')
param tags object = {}

@description('Flag to deploy Application Insights')
param useApplicationInsights bool = true

@description('Flag to deploy Log Analytics')
param useLogAnalytics bool = true

var actualLogAnalyticsName = !empty(logAnalyticsName) ? logAnalyticsName : 'log-${uniqueString(resourceGroup().id)}'
var actualApplicationInsightsName = !empty(applicationInsightsName) ? applicationInsightsName : 'appi-${uniqueString(resourceGroup().id)}'

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = if (useLogAnalytics) {
  name: actualLogAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
    features: {
      searchVersion: 1
      legacy: 0
      enableLogAccessUsingOnlyResourcePermissions: true
    }
  }
}

resource applicationInsights 'Microsoft.Insights/components@2020-02-02' = if (useApplicationInsights) {
  name: actualApplicationInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: useLogAnalytics ? logAnalytics.id : null
    IngestionMode: useLogAnalytics ? 'LogAnalytics' : 'ApplicationInsights'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
  }
}

output logAnalyticsWorkspaceName string = useLogAnalytics ? logAnalytics.name : ''
output logAnalyticsWorkspaceId string = useLogAnalytics ? logAnalytics.id : ''
output applicationInsightsName string = useApplicationInsights ? applicationInsights.name : ''
output applicationInsightsConnectionString string = useApplicationInsights ? applicationInsights.properties.ConnectionString ?? '' : ''
output applicationInsightsInstrumentationKey string = useApplicationInsights ? applicationInsights.properties.InstrumentationKey ?? '' : ''
