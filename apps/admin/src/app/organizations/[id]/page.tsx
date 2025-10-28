'use client'
import { AdminLayout } from '@/components/AdminLayout'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient, type Organization } from '@/lib/api'

interface User {
  user_id: string
  email: string
  role: string
  first_name?: string
  last_name?: string
  created_at: string
  updated_at: string
}

interface UsersResponse {
  users: User[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export default function OrganizationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [usersLoading, setUsersLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)

  const loadOrganization = async () => {
    try {
      setLoading(true)
      setError(null)
      const orgData = await apiClient.admin.getOrganization(params.id)
      setOrganization(orgData)
    } catch (err) {
      console.error('Failed to load organization:', err)
      setError(err instanceof Error ? err.message : 'Failed to load organization')
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async (page = 1) => {
    try {
      setUsersLoading(true)
      const usersData = await apiClient.admin.getOrganizationUsers(params.id, {
        page,
        limit: 10,
      })
      setUsers(usersData.users)
      setTotalPages(usersData.totalPages)
      setTotalUsers(usersData.totalCount)
      setCurrentPage(page)
    } catch (err) {
      console.error('Failed to load users:', err)
    } finally {
      setUsersLoading(false)
    }
  }

  useEffect(() => {
    loadOrganization()
    loadUsers()
  }, [params.id])

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'tenant_admin':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'coach':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'athlete':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      default:
        return 'bg-dark-elevated0/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatRoleName = (role: string) => {
    switch (role) {
      case 'tenant_admin':
        return 'Admin'
      case 'coach':
        return 'Coach'
      case 'athlete':
        return 'Athlete'
      default:
        return role
    }
  }

  const formatLastActivity = (lastActivity: string | null) => {
    if (!lastActivity) return 'Never'
    
    const date = new Date(lastActivity)
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hours ago`
    if (diffInDays === 1) return '1 day ago'
    if (diffInDays < 7) return `${diffInDays} days ago`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-8">
          <div className="flex items-center space-x-4">
            <div className="h-8 w-8 bg-gray-700 rounded"></div>
            <div className="h-8 w-64 bg-gray-700 rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-2xl"></div>
            ))}
          </div>
          <div className="h-96 bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-2xl"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Error loading organization</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <div className="space-x-4">
            <button 
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors duration-200"
            >
              Go Back
            </button>
            <button 
              onClick={loadOrganization}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!organization) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 rounded-full bg-gray-700 flex items-center justify-center mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-9 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white mb-2">Organization not found</h3>
          <p className="text-gray-400 mb-4">The organization you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors duration-200"
          >
            Go Back
          </button>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold text-white">
                {organization.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{organization.name}</h1>
              <p className="mt-1 text-gray-400">
                Created on {new Date(organization.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors duration-200">
              Edit Organization
            </button>
            <button className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors duration-200">
              Delete Organization
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#232323] shadow-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  Total Users
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {organization.user_count || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#232323] shadow-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  Total Sessions
                </p>
                <p className="mt-2 text-3xl font-bold text-green-400">
                  {organization.session_count || 0}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#232323] shadow-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  Last Activity
                </p>
                <p className="mt-2 text-xl font-bold text-orange-400">
                  {formatLastActivity(organization.last_activity || null)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#232323] shadow-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  Organization ID
                </p>
                <p className="mt-2 text-xs font-mono text-gray-300 break-all">
                  {organization.tenant_id}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-r from-gray-500 to-gray-600 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Branding Configuration */}
        {organization.branding && Object.keys(organization.branding).length > 0 && (
          <div className="rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#232323] shadow-xl border border-gray-700 p-6">
            <h2 className="text-xl font-bold text-white mb-4">Branding Configuration</h2>
            <pre className="bg-gray-900 rounded-xl p-4 text-sm text-gray-300 overflow-x-auto">
              {JSON.stringify(organization.branding, null, 2)}
            </pre>
          </div>
        )}

        {/* Users Table */}
        <div className="rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#232323] shadow-xl border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Users</h2>
              <div className="text-sm text-gray-400">
                {totalUsers} total users
              </div>
            </div>
          </div>

          {usersLoading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gray-700 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/4"></div>
                    </div>
                    <div className="h-6 w-16 bg-gray-700 rounded-full"></div>
                    <div className="h-4 w-20 bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : users.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-700/50 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center">
                              <span className="text-sm font-bold text-white">
                                {user.first_name ? user.first_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">
                                {user.first_name && user.last_name 
                                  ? `${user.first_name} ${user.last_name}`
                                  : 'Unnamed User'
                                }
                              </div>
                              <div className="text-sm text-gray-400 font-mono">
                                {user.user_id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-300">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${getRoleBadge(user.role)}`}>
                            {formatRoleName(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
                  <p className="text-sm text-gray-400">
                    Showing {users.length} of {totalUsers} users
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => loadUsers(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-2 text-gray-300">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => loadUsers(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto h-16 w-16 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No users found</h3>
              <p className="text-gray-400">This organization doesn't have any users yet.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}