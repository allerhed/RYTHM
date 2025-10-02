'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AdminLayout } from '@/components/AdminLayout'

interface Backup {
  name: string
  size: number
  createdAt: string
  url: string
}

export default function BackupsPage() {
  const { user } = useAuth()
  const [backups, setBackups] = useState<Backup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchBackups = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/backups`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch backups')
      }

      const data = await response.json()
      setBackups(data.data || [])
    } catch (err) {
      console.error('Fetch backups error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load backups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchBackups()
    }
  }, [user])

  const handleCreateBackup = async () => {
    if (!confirm('Create a new database backup? This may take a few minutes.')) {
      return
    }

    try {
      setCreating(true)
      setError(null)

      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/backups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create backup')
      }

      await fetchBackups()
      alert('Backup created successfully!')
    } catch (err) {
      console.error('Create backup error:', err)
      setError(err instanceof Error ? err.message : 'Failed to create backup')
    } finally {
      setCreating(false)
    }
  }

  const handleRestoreBackup = async (filename: string) => {
    if (!confirm(`⚠️ WARNING: This will restore the database from backup "${filename}".\n\nThis action will OVERWRITE the current database and CANNOT be undone.\n\nAre you absolutely sure?`)) {
      return
    }

    if (!confirm('This is your final confirmation. Restore database from backup?')) {
      return
    }

    try {
      setRestoring(filename)
      setError(null)

      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/backups/${filename}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to restore backup')
      }

      alert('Database restored successfully! The application will reload.')
      window.location.reload()
    } catch (err) {
      console.error('Restore backup error:', err)
      setError(err instanceof Error ? err.message : 'Failed to restore backup')
    } finally {
      setRestoring(null)
    }
  }

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Delete backup "${filename}"? This cannot be undone.`)) {
      return
    }

    try {
      setDeleting(filename)
      setError(null)

      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/backups/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete backup')
      }

      await fetchBackups()
    } catch (err) {
      console.error('Delete backup error:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete backup')
    } finally {
      setDeleting(null)
    }
  }

  const handleDownloadBackup = (filename: string) => {
    const token = localStorage.getItem('admin_token')
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/backups/${filename}/download`
    
    // Create temporary link to trigger download
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    link.style.display = 'none'
    document.body.appendChild(link)
    
    // Add authorization header by opening in new window with token
    window.open(`${url}?token=${token}`, '_blank')
    
    document.body.removeChild(link)
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (!user || user.role !== 'system_admin') {
    return (
      <AdminLayout>
        <div className="rounded-2xl bg-red-900/20 border border-red-500/30 text-red-400 px-6 py-4">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Access Denied: System admin privileges required</span>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Database Backups</h1>
            <p className="text-gray-400 mt-2">Manage PostgreSQL database backups and restore points</p>
          </div>
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
          >
            {creating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Create Backup</span>
              </>
            )}
          </button>
        </div>

        {/* Info Card */}
        <div className="rounded-2xl bg-blue-900/20 border border-blue-500/30 text-blue-400 px-6 py-4">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium mb-1">Automatic Retention Policy</p>
              <p className="text-sm text-blue-300">Backups older than 10 days are automatically deleted. Manual backups can be downloaded before deletion.</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-2xl bg-red-900/20 border border-red-500/30 text-red-400 px-6 py-4">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Backups List */}
        <div className="rounded-2xl bg-gray-800/50 border border-gray-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-gray-400">Loading backups...</p>
              </div>
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-400 text-lg mb-2">No backups found</p>
              <p className="text-gray-500 text-sm">Create your first backup to get started</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50 border-b border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Backup Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Size</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Created</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {backups.map((backup) => (
                    <tr key={backup.name} className="hover:bg-gray-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-white font-mono text-sm">{backup.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">{formatBytes(backup.size)}</td>
                      <td className="px-6 py-4 text-gray-300">{formatDate(backup.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleDownloadBackup(backup.name)}
                            className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors flex items-center space-x-1"
                            title="Download backup"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download</span>
                          </button>
                          <button
                            onClick={() => handleRestoreBackup(backup.name)}
                            disabled={restoring === backup.name}
                            className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-700 text-white rounded-lg text-sm transition-colors flex items-center space-x-1"
                            title="Restore from this backup"
                          >
                            {restoring === backup.name ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Restoring...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>Restore</span>
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteBackup(backup.name)}
                            disabled={deleting === backup.name}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 text-white rounded-lg text-sm transition-colors flex items-center space-x-1"
                            title="Delete backup"
                          >
                            {deleting === backup.name ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                <span>Delete</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
