'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AdminLayout } from '@/components/AdminLayout'

interface EmailLog {
  email_log_id: string
  tenant_id: string | null
  user_id: string | null
  email_type: string
  status: string
  to_address: string
  from_address: string
  subject: string
  message_id: string | null
  error_message: string | null
  sent_at: string | null
  created_at: string
}

interface EmailLogDetails extends EmailLog {
  reply_to_address: string | null
  plain_text_body: string
  html_body: string | null
  delivered_at: string | null
  metadata: Record<string, any>
  updated_at: string
}

export default function EmailLogsPage() {
  const { user } = useAuth()
  const [emails, setEmails] = useState<EmailLog[]>([])
  const [selectedEmail, setSelectedEmail] = useState<EmailLogDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    email_type: '',
    status: '',
    search: '',
  })

  const fetchEmails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const token = localStorage.getItem('admin_token')
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '50',
        ...(filters.email_type && { email_type: filters.email_type }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
      })
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email-logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch email logs')
      }

      const data = await response.json()
      setEmails(data.data || [])
      setTotalPages(data.pagination?.totalPages || 1)
      setTotal(data.pagination?.total || 0)
    } catch (err) {
      console.error('Fetch email logs error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load email logs')
    } finally {
      setLoading(false)
    }
  }

  const fetchEmailDetails = async (emailId: string) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email-logs/${emailId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch email details')
      }

      const data = await response.json()
      setSelectedEmail(data.data)
    } catch (err) {
      console.error('Fetch email details error:', err)
      alert(err instanceof Error ? err.message : 'Failed to load email details')
    }
  }

  useEffect(() => {
    if (user) {
      fetchEmails()
    }
  }, [user, page, filters])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'delivered': return 'bg-blue-100 text-blue-800'
      case 'bounced': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'backup_notification': return 'bg-purple-100 text-purple-800'
      case 'password_reset': return 'bg-blue-100 text-blue-800'
      case 'workout_reminder': return 'bg-green-100 text-green-800'
      case 'admin_alert': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Email Logs</h1>
            <p className="text-gray-600 mt-1">
              View all emails sent by the RYTHM platform ({total} total)
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Type
              </label>
              <select
                value={filters.email_type}
                onChange={(e) => setFilters({ ...filters, email_type: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="backup_notification">Backup Notification</option>
                <option value="password_reset">Password Reset</option>
                <option value="workout_reminder">Workout Reminder</option>
                <option value="admin_alert">Admin Alert</option>
                <option value="generic">Generic</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
                <option value="delivered">Delivered</option>
                <option value="bounced">Bounced</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Search by recipient, subject, or content..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Email List */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-4">Loading email logs...</p>
          </div>
        ) : emails.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600">No email logs found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emails.map((email) => (
                  <tr key={email.email_log_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(email.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeColor(email.email_type)}`}>
                        {email.email_type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {email.to_address}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {email.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(email.status)}`}>
                        {email.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => fetchEmailDetails(email.email_log_id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Page <span className="font-medium">{page}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Email Detail Modal */}
        {selectedEmail && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-900">Email Details</h3>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeBadgeColor(selectedEmail.email_type)}`}>
                      {selectedEmail.email_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>
                    <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(selectedEmail.status)}`}>
                      {selectedEmail.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">From:</span>
                    <span className="ml-2 text-gray-900">{selectedEmail.from_address}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">To:</span>
                    <span className="ml-2 text-gray-900">{selectedEmail.to_address}</span>
                  </div>
                  {selectedEmail.reply_to_address && (
                    <div>
                      <span className="font-medium text-gray-700">Reply-To:</span>
                      <span className="ml-2 text-gray-900">{selectedEmail.reply_to_address}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <span className="ml-2 text-gray-900">{formatDate(selectedEmail.created_at)}</span>
                  </div>
                  {selectedEmail.sent_at && (
                    <div>
                      <span className="font-medium text-gray-700">Sent:</span>
                      <span className="ml-2 text-gray-900">{formatDate(selectedEmail.sent_at)}</span>
                    </div>
                  )}
                  {selectedEmail.message_id && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-700">Message ID:</span>
                      <span className="ml-2 text-gray-600 text-xs font-mono">{selectedEmail.message_id}</span>
                    </div>
                  )}
                </div>

                {selectedEmail.error_message && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <span className="font-medium text-red-800">Error:</span>
                    <p className="text-red-700 mt-1">{selectedEmail.error_message}</p>
                  </div>
                )}

                {/* Subject */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Subject</h4>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded">{selectedEmail.subject}</p>
                </div>

                {/* HTML Body (if available) */}
                {selectedEmail.html_body ? (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">HTML Preview</h4>
                    <div className="border border-gray-300 rounded overflow-hidden">
                      <iframe
                        srcDoc={selectedEmail.html_body}
                        className="w-full h-96"
                        sandbox="allow-same-origin"
                      />
                    </div>
                  </div>
                ) : null}

                {/* Plain Text Body */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Plain Text Body</h4>
                  <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap font-mono">
                    {selectedEmail.plain_text_body}
                  </pre>
                </div>

                {/* Metadata */}
                {selectedEmail.metadata && Object.keys(selectedEmail.metadata).length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Additional Metadata</h4>
                    <pre className="text-sm text-gray-900 bg-gray-50 p-3 rounded whitespace-pre-wrap font-mono">
                      {JSON.stringify(selectedEmail.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
