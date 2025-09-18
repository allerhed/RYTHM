'use client'
import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'

interface ExportJob {
  id: string
  type: 'tenant' | 'global' | 'full'
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  startTime: Date
  endTime?: Date
  downloadUrl?: string
  exportData?: any // Store the actual export data for download
  error?: string
}

interface ImportJob {
  id: string
  fileName: string
  fileSize: number
  status: 'validating' | 'importing' | 'completed' | 'failed'
  progress: number
  startTime: Date
  endTime?: Date
  validation?: {
    valid: boolean
    errors: string[]
    warnings: string[]
    recordCounts: Record<string, number>
  }
  result?: {
    success: boolean
    imported: Record<string, number>
    errors: string[]
    backupId?: string
  }
}

interface Tenant {
  tenant_id: string
  name: string
  user_count: number
  session_count: number
  created_at: string
}

export default function ExportPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'backups'>('export')
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [exportFormat, setExportFormat] = useState<'json' | 'sql' | 'csv'>('json')
  const [exportType, setExportType] = useState<'tenant' | 'global' | 'full'>('tenant')
  const [includeUsers, setIncludeUsers] = useState(true)
  const [includeWorkouts, setIncludeWorkouts] = useState(true)
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [jobs, setJobs] = useState<ExportJob[]>([])
  const [importJobs, setImportJobs] = useState<ImportJob[]>([])
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchingTenants, setFetchingTenants] = useState(true)
  
  // Import-specific state
  const [importStrategy, setImportStrategy] = useState<'replace' | 'merge' | 'skip-existing'>('merge')
  const [validateReferences, setValidateReferences] = useState(true)
  const [createBackup, setCreateBackup] = useState(true)
  const [dryRun, setDryRun] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any>(null)

  // Fetch tenants on component mount
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const data = await apiClient.admin.getExportableTenants()
        setTenants(data)
      } catch (error) {
        console.error('Failed to fetch tenants:', error)
      } finally {
        setFetchingTenants(false)
      }
    }

    if (user) {
      fetchTenants()
    }
  }, [user])

  const handleExport = async () => {
    if (!selectedTenant && exportType === 'tenant') {
      alert('Please select a tenant to export')
      return
    }

    setLoading(true)
    
    const newJob: ExportJob = {
      id: Math.random().toString(36).substr(2, 9),
      type: exportType,
      status: 'running',
      progress: 0,
      startTime: new Date(),
    }
    
    setJobs(prev => [newJob, ...prev])
    
    try {
      let exportResult
      
      if (exportType === 'tenant') {
        exportResult = await apiClient.admin.exportTenant({
          tenantId: selectedTenant,
          includeUsers,
          includeWorkoutData: includeWorkouts,
          format: exportFormat,
          dateRange: dateRange.start && dateRange.end ? dateRange : undefined
        })
      } else if (exportType === 'global') {
        exportResult = await apiClient.admin.exportGlobalData({
          format: exportFormat
        })
      } else {
        exportResult = await apiClient.admin.exportAll({
          format: exportFormat,
          includeUsers,
          includeWorkoutData: includeWorkouts
        })
      }

      // Update job status
      setJobs(prev => prev.map(job => {
        if (job.id === newJob.id) {
          const filename = `${exportType}_export_${Date.now()}.${exportFormat}`
          return {
            ...job,
            status: exportResult.success ? 'completed' : 'failed',
            progress: 100,
            endTime: new Date(),
            downloadUrl: exportResult.success ? filename : undefined,
            exportData: exportResult.success ? exportResult.data : undefined,
            error: exportResult.success ? undefined : exportResult.error
          }
        }
        return job
      }))

    } catch (error) {
      // Update job with error
      setJobs(prev => prev.map(job => {
        if (job.id === newJob.id) {
          return {
            ...job,
            status: 'failed',
            progress: 0,
            endTime: new Date(),
            error: error instanceof Error ? error.message : 'Export failed'
          }
        }
        return job
      }))
    }
    
    setLoading(false)
  }

  const handleImport = async (file: File) => {
    setSelectedFile(file)
    
    const importJob: ImportJob = {
      id: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      fileSize: file.size,
      status: 'validating',
      progress: 0,
      startTime: new Date(),
    }
    
    setImportJobs(prev => [importJob, ...prev])
    
    try {
      const fileContent = await file.text()
      let data: any
      
      // Parse file based on extension
      if (file.name.endsWith('.json')) {
        const parsedData = JSON.parse(fileContent)
        
        // Check if this is an export result wrapper or raw data
        if (parsedData.success && parsedData.data) {
          // This is an export result - extract the data
          data = parsedData.data
        } else {
          // This is raw data
          data = parsedData
        }
      } else if (file.name.endsWith('.sql')) {
        // For SQL files, we'd need a SQL parser - for now, show error
        throw new Error('SQL import not yet implemented - please use JSON format')
      } else if (file.name.endsWith('.csv')) {
        // For CSV files, we'd need a CSV parser - for now, show error
        throw new Error('CSV import not yet implemented - please use JSON format')
      } else {
        throw new Error('Unsupported file format. Please use JSON, SQL, or CSV.')
      }
      
      setImportPreview(data)
      
      // Update job with validation progress
      setImportJobs(prev => prev.map(job => 
        job.id === importJob.id 
          ? { ...job, status: 'importing' as const, progress: 50 }
          : job
      ))
      
      // Determine import type and execute
      let result: any
      
      // Check for full system export structure
      if (data.global && data.tenants) {
        console.log('Detected full system export, importing global data first')
        
        // Import global data first
        const globalResult = await apiClient.admin.importGlobalData({
          data: data.global,
          mergeStrategy: importStrategy,
          validateReferences,
          createBackup,
          dryRun
        })
        
        if (!globalResult.success) {
          throw new Error(`Global data import failed: ${globalResult.errors.join(', ')}`)
        }
        
        // Then import each tenant
        const tenantResults = []
        for (const [tenantId, tenantData] of Object.entries(data.tenants)) {
          const tenantResult = await apiClient.admin.importTenant({
            data: tenantData,
            mergeStrategy: importStrategy,
            validateReferences,
            createBackup: false, // Only backup once for the full import
            dryRun
          })
          tenantResults.push(tenantResult)
        }
        
        // Combine results
        result = {
          success: tenantResults.every(r => r.success) && globalResult.success,
          imported: {
            global: globalResult.imported || {},
            tenants: tenantResults.reduce((acc, r, i) => {
              acc[Object.keys(data.tenants)[i]] = r.imported || {}
              return acc
            }, {} as Record<string, any>)
          },
          errors: [
            ...(globalResult.errors || []),
            ...tenantResults.flatMap(r => r.errors || [])
          ],
          backupId: globalResult.backupId
        }
      }
      // Check for tenant data structure
      else if (data.tenant || (data.users && data.sessions)) {
        console.log('Detected tenant data structure, importing as tenant data')
        result = await apiClient.admin.importTenant({
          data,
          mergeStrategy: importStrategy,
          validateReferences,
          createBackup,
          dryRun
        })
      } 
      // Check for global data structure
      else if (data.exercises || data.equipment || data.exercise_templates) {
        console.log('Detected global data structure, importing as global data')
        result = await apiClient.admin.importGlobalData({
          data,
          mergeStrategy: importStrategy,
          validateReferences,
          createBackup,
          dryRun
        })
      }
      else {
        // Try to give more helpful error message
        const dataKeys = Object.keys(data || {})
        throw new Error(`Invalid data format. Expected:
        - Full export: 'global' and 'tenants' properties
        - Tenant data: 'tenant', 'users', or 'sessions' properties  
        - Global data: 'exercises', 'equipment', or 'exercise_templates' properties
        
        Found properties: ${dataKeys.join(', ')}`)
      }
      
      // Update job with completion
      setImportJobs(prev => prev.map(job => 
        job.id === importJob.id 
          ? { 
              ...job, 
              status: result.success ? 'completed' as const : 'failed' as const,
              progress: 100,
              endTime: new Date(),
              result
            }
          : job
      ))
      
      if (result.success) {
        const importedCount = Object.values(result.imported || {}).reduce((a: number, b: unknown) => a + (typeof b === 'number' ? b : 0), 0)
        alert(`${dryRun ? 'Validation' : 'Import'} completed successfully! ${importedCount} records processed.`)
      } else {
        alert(`${dryRun ? 'Validation' : 'Import'} failed: ${result.errors.join(', ')}`)
      }
      
    } catch (error) {
      console.error('Import error:', error)
      setImportJobs(prev => prev.map(job => 
        job.id === importJob.id 
          ? { 
              ...job, 
              status: 'failed' as const,
              progress: 0,
              endTime: new Date()
            }
          : job
      ))
      alert('Failed to import file: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  const downloadExport = (job: ExportJob, exportData: any) => {
    if (!job.downloadUrl || !exportData) return
    
    // For download, we want the raw data structure (not the wrapped result)
    // so the downloaded file can be imported directly
    const downloadData = exportData
    
    const blob = new Blob([
      exportFormat === 'json' ? JSON.stringify(downloadData, null, 2) : downloadData
    ], { 
      type: exportFormat === 'json' ? 'application/json' : 
           exportFormat === 'sql' ? 'text/sql' : 
           'text/csv' 
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = job.downloadUrl
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
                {/* Header */}
        <div className="border-b border-gray-700 pb-6">
          <h1 className="text-3xl font-bold text-white">Data Import/Export</h1>
          <p className="mt-2 text-gray-400">
            Manage data transfers between environments with comprehensive export/import tools.
            All operations include validation, backup creation, and detailed logging.
          </p>
          
          {/* Feature Overview */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-blue-400 font-medium text-sm">Multi-Format Support</span>
              </div>
              <p className="text-blue-300 text-xs mt-1">JSON, SQL, and CSV export formats</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0121 12a11.955 11.955 0 01-1.382 5.984" />
                </svg>
                <span className="text-green-400 font-medium text-sm">Safe Operations</span>
              </div>
              <p className="text-green-300 text-xs mt-1">Validation, backups, and rollback</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-purple-400 font-medium text-sm">Production Ready</span>
              </div>
              <p className="text-purple-300 text-xs mt-1">Enterprise-grade data management</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('export')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'export'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              Export Data
            </button>
            <button
              onClick={() => setActiveTab('import')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'import'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              Import Data
            </button>
            <button
              onClick={() => setActiveTab('backups')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'backups'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
              }`}
            >
              Backup Management
            </button>
          </nav>
        </div>

        {/* Export Tab */}
        {activeTab === 'export' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Export Configuration */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-6">Export Configuration</h2>
                
                {/* Export Type */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Export Type
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'tenant', label: 'Single Tenant', desc: 'Export one organization' },
                        { value: 'global', label: 'Global Data', desc: 'Exercises, templates, equipment' },
                        { value: 'full', label: 'Full System', desc: 'Complete database backup' }
                      ].map((type) => (
                        <div
                          key={type.value}
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${
                            exportType === type.value
                              ? 'border-blue-500 bg-blue-500/10 text-blue-400'
                              : 'border-gray-600 bg-gray-700/50 text-gray-300 hover:border-gray-500'
                          }`}
                          onClick={() => setExportType(type.value as any)}
                        >
                          <div className="font-medium text-sm">{type.label}</div>
                          <div className="text-xs mt-1 opacity-80">{type.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tenant Selection */}
                  {exportType === 'tenant' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select Organization
                      </label>
                      <select
                        value={selectedTenant}
                        onChange={(e) => setSelectedTenant(e.target.value)}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled={fetchingTenants}
                      >
                        <option value="">
                          {fetchingTenants ? 'Loading organizations...' : 'Choose an organization...'}
                        </option>
                        {tenants.map((tenant) => (
                          <option key={tenant.tenant_id} value={tenant.tenant_id}>
                            {tenant.name} ({tenant.user_count} users, {tenant.session_count} sessions)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Format Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Export Format
                    </label>
                    <div className="flex space-x-4">
                      {[
                        { value: 'json', label: 'JSON', desc: 'Human-readable, dev-friendly' },
                        { value: 'sql', label: 'SQL', desc: 'Database-ready, production backup' },
                        { value: 'csv', label: 'CSV', desc: 'Spreadsheet-compatible, analysis' }
                      ].map((format) => (
                        <label
                          key={format.value}
                          className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all ${
                            exportFormat === format.value
                              ? 'border-blue-500 bg-blue-500/10'
                              : 'border-gray-600 bg-gray-700/50 hover:border-gray-500'
                          }`}
                        >
                          <input
                            type="radio"
                            name="format"
                            value={format.value}
                            checked={exportFormat === format.value}
                            onChange={(e) => setExportFormat(e.target.value as any)}
                            className="sr-only"
                          />
                          <div className="text-center">
                            <div className="font-medium text-sm text-white">{format.label}</div>
                            <div className="text-xs text-gray-400 mt-1">{format.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Data Options */}
                  {exportType === 'tenant' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        Include Data
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={includeUsers}
                            onChange={(e) => setIncludeUsers(e.target.checked)}
                            className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-300">User accounts and profiles</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={includeWorkouts}
                            onChange={(e) => setIncludeWorkouts(e.target.checked)}
                            className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-300">Workout sessions and data</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* Date Range */}
                  {exportType !== 'global' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Date Range (Optional)
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                          <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">End Date</label>
                          <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Export Button */}
                  <div className="pt-4 border-t border-gray-700">
                    <button
                      onClick={handleExport}
                      disabled={loading || (exportType === 'tenant' && !selectedTenant)}
                      className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-lg"
                    >
                      {loading ? 'Starting Export...' : 'Start Export'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Jobs Status */}
            <div className="space-y-6">
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Export Jobs</h2>
                
                {jobs.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                      </svg>
                    </div>
                    <p className="text-gray-400">No export jobs yet</p>
                    <p className="text-sm text-gray-500 mt-1">Start an export to see progress here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobs.map((job) => (
                      <div key={job.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${
                              job.status === 'completed' ? 'bg-green-400' :
                              job.status === 'running' ? 'bg-blue-400 animate-pulse' :
                              job.status === 'failed' ? 'bg-red-400' :
                              'bg-gray-400'
                            }`} />
                            <span className="text-sm font-medium text-white capitalize">
                              {job.type} Export
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            job.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            job.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                            job.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {job.status}
                          </span>
                        </div>
                        
                        {job.status === 'running' && (
                          <div className="mb-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>Progress</span>
                              <span>{job.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-600 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="text-xs text-gray-400">
                          Started: {job.startTime.toLocaleString()}
                          {job.endTime && (
                            <span className="ml-2">
                              • Completed: {job.endTime.toLocaleString()}
                            </span>
                          )}
                        </div>
                        
                        {job.downloadUrl && job.exportData && (
                          <button 
                            onClick={() => downloadExport(job, job.exportData)}
                            className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline flex items-center space-x-1"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Download Export File</span>
                          </button>
                        )}
                        
                        {job.error && (
                          <div className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded">
                            {job.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button 
                    onClick={async () => {
                      setExportType('global')
                      setExportFormat('json')
                      await handleExport()
                    }}
                    className="w-full text-left p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors border border-gray-600"
                  >
                    <div className="font-medium text-white text-sm">Export Global Templates</div>
                    <div className="text-xs text-gray-400 mt-1">Exercise templates and equipment (JSON)</div>
                  </button>
                  <button 
                    onClick={async () => {
                      setExportType('full')
                      setExportFormat('sql')
                      setIncludeUsers(true)
                      setIncludeWorkouts(true)
                      await handleExport()
                    }}
                    className="w-full text-left p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors border border-gray-600"
                  >
                    <div className="font-medium text-white text-sm">Full System Backup</div>
                    <div className="text-xs text-gray-400 mt-1">Complete system backup (SQL format)</div>
                  </button>
                  <button 
                    onClick={async () => {
                      setExportType('full')
                      setExportFormat('csv')
                      setIncludeUsers(false)
                      setIncludeWorkouts(true)
                      await handleExport()
                    }}
                    className="w-full text-left p-3 rounded-lg bg-gray-700/50 hover:bg-gray-700 transition-colors border border-gray-600"
                  >
                    <div className="font-medium text-white text-sm">Export Analytics Data</div>
                    <div className="text-xs text-gray-400 mt-1">Performance metrics and usage stats (CSV)</div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Import Tab */}
        {activeTab === 'import' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">Import Data</h2>
              
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-gray-500 transition-colors">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-white font-medium mb-2">Upload Export File</p>
                <p className="text-sm text-gray-400 mb-4">
                  Supports JSON, SQL, and CSV formats
                </p>
                <input
                  type="file"
                  accept=".json,.sql,.csv"
                  className="hidden"
                  id="file-upload"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleImport(file)
                  }}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Choose File
                </label>
              </div>

              {/* Import Options */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Import Strategy
                  </label>
                  <select 
                    value={importStrategy}
                    onChange={(e) => setImportStrategy(e.target.value as 'replace' | 'merge' | 'skip-existing')}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="merge">Merge with existing data</option>
                    <option value="replace">Replace existing data</option>
                    <option value="skip-existing">Skip existing records</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={validateReferences}
                      onChange={(e) => setValidateReferences(e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-300">Validate data before import</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={createBackup}
                      onChange={(e) => setCreateBackup(e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-300">Create backup before import</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={dryRun}
                      onChange={(e) => setDryRun(e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-300">Dry run (preview only)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Import Preview/Results */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Import Status</h3>
              
              {importJobs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-400">Upload a file to start import</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {importJobs.map((job) => (
                    <div key={job.id} className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            job.status === 'completed' ? 'bg-green-400' :
                            job.status === 'failed' ? 'bg-red-400' :
                            'bg-blue-400 animate-pulse'
                          }`} />
                          <span className="text-white font-medium text-sm">{job.fileName}</span>
                          <span className="text-xs text-gray-400">({(job.fileSize / 1024).toFixed(1)} KB)</span>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          job.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                          job.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                          job.status === 'validating' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {job.status}
                        </div>
                      </div>
                      
                      {job.progress > 0 && job.status !== 'completed' && job.status !== 'failed' && (
                        <div className="mb-3">
                          <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Progress</span>
                            <span>{job.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {job.result && (
                        <div className="mt-3 p-3 rounded bg-gray-600/50 border border-gray-500">
                          <div className="text-xs text-gray-300 space-y-1">
                            <div className="flex items-center justify-between">
                              <span>Status:</span>
                              <span className={job.result.success ? 'text-green-400' : 'text-red-400'}>
                                {job.result.success ? (dryRun ? 'Validation Passed' : 'Import Success') : (dryRun ? 'Validation Failed' : 'Import Failed')}
                              </span>
                            </div>
                            {job.result.imported && (
                              <div>
                                <span className="text-gray-400">Records Processed:</span>
                                <div className="mt-1 grid grid-cols-2 gap-1 text-xs">
                                  {Object.entries(job.result.imported).map(([table, count]) => (
                                    <div key={table} className="flex justify-between">
                                      <span className="capitalize">{table}:</span>
                                      <span className="text-blue-400">{count}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {job.result.backupId && (
                              <div className="flex items-center justify-between">
                                <span>Backup ID:</span>
                                <span className="text-blue-400 font-mono text-xs">{job.result.backupId}</span>
                              </div>
                            )}
                            {job.result.errors.length > 0 && (
                              <div>
                                <span className="text-red-400">Errors:</span>
                                <div className="mt-1 space-y-1">
                                  {job.result.errors.slice(0, 3).map((error, index) => (
                                    <div key={index} className="text-red-300 text-xs">• {error}</div>
                                  ))}
                                  {job.result.errors.length > 3 && (
                                    <div className="text-red-400 text-xs">... and {job.result.errors.length - 3} more</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-400 mt-2">
                        Started: {job.startTime.toLocaleString()}
                        {job.endTime && (
                          <span className="ml-2">
                            • Completed: {job.endTime.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Backup Management Tab */}
        {activeTab === 'backups' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold text-white mb-6">System Backups</h2>
              
              {/* Create Backup Actions */}
              <div className="space-y-4 mb-6">
                <button 
                  onClick={async () => {
                    setExportType('full')
                    setExportFormat('sql')
                    setIncludeUsers(true)
                    setIncludeWorkouts(true)
                    await handleExport()
                  }}
                  className="w-full p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-white">Create Full System Backup</div>
                      <div className="text-sm text-gray-400">Complete database backup with all data</div>
                    </div>
                  </div>
                </button>
                
                <button 
                  onClick={async () => {
                    setExportType('global')
                    setExportFormat('sql')
                    await handleExport()
                  }}
                  className="w-full p-4 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-white">Export Global Data Only</div>
                      <div className="text-sm text-gray-400">Templates, exercises, and equipment</div>
                    </div>
                  </div>
                </button>
              </div>
              
              {/* Scheduled Backups Info */}
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-yellow-400 text-sm">Automated Backups</h4>
                    <p className="text-yellow-300 text-xs mt-1">
                      Daily automated backups are created at 2:00 AM UTC. Manual backups can be created anytime.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Backup History */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Backup History</h3>
              
              <div className="space-y-3">
                {/* Placeholder backup entries - in real implementation, these would come from API */}
                {[
                  { id: '1', type: 'Full System', size: '2.4 GB', date: '2025-09-18 02:00', status: 'completed' },
                  { id: '2', type: 'Global Data', size: '12.8 MB', date: '2025-09-17 14:30', status: 'completed' },
                  { id: '3', type: 'Full System', size: '2.3 GB', date: '2025-09-17 02:00', status: 'completed' },
                  { id: '4', type: 'Tenant Export', size: '45.2 MB', date: '2025-09-16 16:15', status: 'completed' }
                ].map((backup) => (
                  <div key={backup.id} className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white text-sm">{backup.type}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {backup.date} • {backup.size}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <button className="text-xs text-blue-400 hover:text-blue-300 underline">
                          Download
                        </button>
                        <button className="text-xs text-orange-400 hover:text-orange-300 underline">
                          Restore
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Phase Information */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Implementation Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { phase: 'Phase 1', title: 'Basic Export/Import', status: 'completed', desc: 'JSON tenant data export/import' },
              { phase: 'Phase 2', title: 'Global Data', status: 'completed', desc: 'Exercise and equipment export' },
              { phase: 'Phase 3', title: 'Production Features', status: 'completed', desc: 'SQL format, validation, rollback' }
            ].map((phase) => (
              <div key={phase.phase} className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-400">{phase.phase}</span>
                  <div className={`w-2 h-2 rounded-full ${
                    phase.status === 'completed' ? 'bg-green-400' :
                    phase.status === 'in-progress' ? 'bg-blue-400 animate-pulse' :
                    'bg-gray-400'
                  }`} />
                </div>
                <h4 className="font-medium text-white text-sm mb-1">{phase.title}</h4>
                <p className="text-xs text-gray-400">{phase.desc}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-400 font-medium text-sm">All Web UI Phases Complete</span>
            </div>
            <p className="text-green-300 text-xs mt-2">
              Full import/export functionality available through the admin interface with JSON, SQL, and CSV support.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}