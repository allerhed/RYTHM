'use client'
import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import { StatsCard } from '@/components/StatsCard'
import { UserModal } from '@/components/UserModal'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { apiClient, type User, type CreateUserData, type UpdateUserData, type UserStats } from '@/lib/api'
import { toast, Toaster } from 'react-hot-toast'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Modal states
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        limit: 10,
      }
      
      if (searchTerm) params.search = searchTerm
      if (selectedRole !== 'all') params.role = selectedRole

      const response = await apiClient.getUsers(params)
      setUsers(response.users)
      setTotalPages(response.pagination.totalPages)
    } catch (error) {
      toast.error('Failed to fetch users')
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const statsData = await apiClient.getUserStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm, selectedRole])

  useEffect(() => {
    fetchStats()
  }, [])

  const handleAddUser = () => {
    setModalMode('add')
    setSelectedUser(null)
    setUserModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setModalMode('edit')
    setSelectedUser(user)
    setUserModalOpen(true)
  }

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user)
    setDeleteModalOpen(true)
  }

  const handleUserSubmit = async (userData: CreateUserData | UpdateUserData) => {
    if (modalMode === 'add') {
      await apiClient.createUser(userData as CreateUserData)
    } else if (selectedUser) {
      await apiClient.updateUser(selectedUser.id, userData as UpdateUserData)
    }
    fetchUsers()
    fetchStats()
  }

  const handleUserDelete = async () => {
    if (userToDelete) {
      await apiClient.deleteUser(userToDelete.id)
      fetchUsers()
      fetchStats()
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'org_admin':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'tenant_admin':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'coach':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'athlete':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return 'Never'
    
    const now = new Date()
    const date = new Date(dateString)
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return formatDate(dateString)
  }

  return (
    <>
      <Toaster position="top-right" />
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                User Management
              </h1>
              <p className="mt-2 text-gray-400">
                Manage users across all organizations and monitor their activity.
              </p>
            </div>
            <button 
              onClick={handleAddUser}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              Add New User
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Total Users"
                value={stats.total_users}
                change="+12%"
                changeType="positive"
                gradient="from-blue-500 to-blue-600"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                }
              />
              <StatsCard
                title="Athletes"
                value={stats.athletes}
                change="+8%"
                changeType="positive"
                gradient="from-green-500 to-emerald-600"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
              <StatsCard
                title="New This Week"
                value={stats.new_this_week}
                change="+23%"
                changeType="positive"
                gradient="from-purple-500 to-pink-600"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                }
              />
              <StatsCard
                title="Coaches"
                value={stats.coaches}
                change="-5%"
                changeType="negative"
                gradient="from-orange-500 to-red-600"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
                  </svg>
                }
              />
            </div>
          )}

          {/* Filters */}
          <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="dropdown-fix block w-full px-3 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="athlete">Athlete</option>
                  <option value="coach">Coach</option>
                  <option value="tenant_admin">Tenant Admin</option>
                  <option value="org_admin">Org Admin</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button 
                  onClick={() => {
                    setSearchTerm('')
                    setSelectedRole('all')
                    setCurrentPage(1)
                  }}
                  className="w-full px-4 py-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                Users ({users.length})
              </h2>
            </div>
            
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-gray-400">Loading users...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                  <p className="text-gray-400">No users found</p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                {`${user.first_name || ''}${user.last_name || ''}`.split(' ').map((n: string) => n[0]).join('')}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white">{`${user.first_name || ''} ${user.last_name || ''}`.trim()}</div>
                                <div className="text-sm text-gray-400">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border capitalize ${getRoleBadge(user.role)}`}>
                              {user.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleEditUser(user)}
                                className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-400 hover:text-red-300 transition-colors duration-200"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50 hover:bg-gray-600 transition-colors duration-200"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 bg-gray-700 text-gray-300 rounded disabled:opacity-50 hover:bg-gray-600 transition-colors duration-200"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Modals */}
        <UserModal
          isOpen={userModalOpen}
          onClose={() => setUserModalOpen(false)}
          onSubmit={handleUserSubmit}
          user={selectedUser}
          mode={modalMode}
        />

        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleUserDelete}
          title="Delete User"
          message={`Are you sure you want to delete ${`${userToDelete?.first_name || ''} ${userToDelete?.last_name || ''}`.trim()}? This action cannot be undone.`}
        />
      </AdminLayout>
    </>
  )
}