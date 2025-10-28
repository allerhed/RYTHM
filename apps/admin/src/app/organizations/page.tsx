'use client'
import { AdminLayout } from '@/components/AdminLayout'
import { OrganizationModal } from '@/components/OrganizationModal'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient, type Organization, type GetOrganizationsParams } from '@/lib/api'

export default function OrganizationsPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const loadOrganizations = async (params: GetOrganizationsParams = {}) => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.admin.getOrganizations({
        page: currentPage,
        limit: 9, // 3x3 grid
        search: searchTerm || undefined,
        ...params,
      })
      setOrganizations(response.tenants)
      setTotalPages(response.totalPages)
      setTotalCount(response.totalCount)
    } catch (err) {
      console.error('Failed to load organizations:', err)
      setError(err instanceof Error ? err.message : 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrganizations({ page: currentPage, search: searchTerm || undefined })
  }, [currentPage, searchTerm])

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handleCreateOrganization = () => {
    setSelectedOrganization(null)
    setIsModalOpen(true)
  }

  const handleEditOrganization = (org: Organization) => {
    setSelectedOrganization(org)
    setIsModalOpen(true)
  }

  const handleSaveOrganization = async (data: { name: string; branding?: Record<string, any> }) => {
    try {
      setIsSubmitting(true)
      if (selectedOrganization) {
        // Update existing organization
        await apiClient.admin.updateOrganization({
          tenant_id: selectedOrganization.tenant_id,
          ...data,
        })
      } else {
        // Create new organization
        await apiClient.admin.createOrganization(data)
      }
      
      await loadOrganizations({ page: currentPage, search: searchTerm || undefined })
      setIsModalOpen(false)
    } catch (err) {
      console.error('Failed to save organization:', err)
      throw err // Re-throw to let modal handle the error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteOrganization = async (org: Organization) => {
    if (!confirm(`Are you sure you want to delete "${org.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      await apiClient.admin.deleteOrganization(org.tenant_id)
      await loadOrganizations({ page: currentPage, search: searchTerm || undefined })
    } catch (err) {
      console.error('Failed to delete organization:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete organization')
    }
  }

  const getStatusBadge = (org: Organization) => {
    // Determine status based on activity and user count
    if (!org.last_activity) {
      return 'bg-dark-elevated0/20 text-gray-400 border-gray-500/30'
    }
    
    const lastActivity = new Date(org.last_activity)
    const now = new Date()
    const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceActivity <= 7) {
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    } else if (daysSinceActivity <= 30) {
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    } else {
      return 'bg-red-500/20 text-red-400 border-red-500/30'
    }
  }

  const getStatusText = (org: Organization) => {
    if (!org.last_activity) return 'Inactive'
    
    const lastActivity = new Date(org.last_activity)
    const now = new Date()
    const daysSinceActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSinceActivity <= 7) return 'Active'
    else if (daysSinceActivity <= 30) return 'Low Activity'
    else return 'Inactive'
  }

  const getOrgIcon = (name: string) => {
    return name.charAt(0).toUpperCase()
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

  const activeOrgs = organizations.filter(org => {
    if (!org.last_activity) return false
    const daysSinceActivity = Math.floor((new Date().getTime() - new Date(org.last_activity).getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceActivity <= 7
  }).length

  const inactiveOrgs = organizations.filter(org => {
    if (!org.last_activity) return true
    const daysSinceActivity = Math.floor((new Date().getTime() - new Date(org.last_activity).getTime()) / (1000 * 60 * 60 * 24))
    return daysSinceActivity > 30
  }).length

  const totalUsers = organizations.reduce((sum, org) => sum + (org.user_count || 0), 0)

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Organizations
            </h1>
            <p className="mt-2 text-gray-400">
              Manage organizations, users, and tenant configurations.
            </p>
          </div>
          <button 
            onClick={handleCreateOrganization}
            className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
          >
            Add Organization
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="dropdown-fix w-full px-4 py-2 rounded-xl bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors duration-200"
            />
          </div>
          {searchTerm && (
            <button
              onClick={() => handleSearch('')}
              className="px-3 py-2 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors duration-200"
            >
              Clear
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4">
            <p className="text-red-400">{error}</p>
            <button 
              onClick={() => loadOrganizations()}
              className="mt-2 text-sm text-red-300 hover:text-red-200 underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-2xl bg-dark-elevated1 shadow-xl border border-dark-border p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-xl bg-gray-700"></div>
                    <div>
                      <div className="h-4 w-24 bg-gray-700 rounded mb-2"></div>
                      <div className="h-3 w-20 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                  <div className="h-6 w-16 bg-gray-700 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-700 rounded"></div>
                  <div className="h-4 w-3/4 bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Organizations Grid */}
            {organizations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {organizations.map((org) => (
                  <div key={org.tenant_id} className="rounded-2xl bg-dark-elevated1 shadow-xl border border-dark-border p-6 hover:shadow-2xl transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="h-12 w-12 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-lg icon-accent">
                          <span className="text-lg font-bold text-white">
                            {getOrgIcon(org.name)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            {org.name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            Created {new Date(org.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusBadge(org)}`}>
                        {getStatusText(org)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Users</span>
                        <span className="text-white font-semibold">{(org.user_count || 0).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Sessions</span>
                        <span className="text-white font-semibold">{(org.session_count || 0).toLocaleString()}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Last Active</span>
                        <span className="text-gray-300">{formatLastActivity(org.last_activity || null)}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-700">
                      <div className="flex space-x-3">
                        <button 
                          onClick={() => router.push(`/organizations/${org.tenant_id}`)}
                          className="flex-1 btn-secondary text-sm"
                        >
                          View Details
                        </button>
                        <button 
                          onClick={() => handleEditOrganization(org)}
                          className="flex-1 btn-primary text-sm"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteOrganization(org)}
                          className="btn-danger text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-24 w-24 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-9 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No organizations found</h3>
                <p className="text-gray-400 mb-4">
                  {searchTerm ? 'No organizations match your search criteria.' : 'Get started by creating your first organization.'}
                </p>
                <button 
                  onClick={handleCreateOrganization}
                  className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Create Organization
                </button>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Showing {organizations.length} of {totalCount} organizations
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  Total Organizations
                </p>
                <p className="mt-2 text-3xl font-bold text-white">
                  {totalCount}
                </p>
              </div>
              <div className="p-3 rounded-xl icon-accent bg-primary/20 border border-primary/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-9 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  Active Organizations
                </p>
                <p className="mt-2 text-3xl font-bold text-green-400">
                  {activeOrgs}
                </p>
              </div>
              <div className="p-3 rounded-xl icon-accent bg-primary/20 border border-primary/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  Inactive Organizations
                </p>
                <p className="mt-2 text-3xl font-bold text-red-400">
                  {inactiveOrgs}
                </p>
              </div>
              <div className="p-3 rounded-xl icon-accent bg-primary/20 border border-primary/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-dark-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                  Total Users
                </p>
                <p className="mt-2 text-3xl font-bold text-orange-400">
                  {totalUsers.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl icon-accent bg-primary/20 border border-primary/30">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <OrganizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveOrganization}
        organization={selectedOrganization}
        isLoading={isSubmitting}
      />
    </AdminLayout>
  )
}