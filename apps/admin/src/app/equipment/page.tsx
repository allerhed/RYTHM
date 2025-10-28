'use client'
import { AdminLayout } from '@/components/AdminLayout'
import { StatsCard } from '@/components/StatsCard'
import { apiClient, type Equipment, type EquipmentStats } from '@/lib/api'
import { useEffect, useState } from 'react'

// Equipment Modal Component
interface EquipmentModalProps {
  isOpen: boolean
  onClose: () => void
  equipment?: Equipment | null
  onSave: () => void
}

function EquipmentModal({ isOpen, onClose, equipment, onSave }: EquipmentModalProps) {
  const [formData, setFormData] = useState<{
    name: string
    category: 'free_weights' | 'machines' | 'cardio' | 'bodyweight' | 'resistance' | 'other'
    description: string
    is_active: boolean
  }>({
    name: '',
    category: 'other',
    description: '',
    is_active: true,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (equipment) {
      setFormData({
        name: equipment.name,
        category: equipment.category,
        description: equipment.description || '',
        is_active: equipment.is_active,
      })
    } else {
      setFormData({
        name: '',
        category: 'other',
        description: '',
        is_active: true,
      })
    }
    setError(null)
  }, [equipment, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (equipment) {
        await apiClient.admin.updateEquipment({
          equipment_id: equipment.equipment_id,
          ...formData,
        })
      } else {
        await apiClient.admin.createEquipment(formData)
      }
      onSave()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-2xl shadow-2xl border border-gray-700 max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              {equipment ? 'Edit Equipment' : 'Add Equipment'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Equipment Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter equipment name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="free_weights">Free Weights</option>
                <option value="machines">Machines</option>
                <option value="cardio">Cardio</option>
                <option value="bodyweight">Bodyweight</option>
                <option value="resistance">Resistance</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="mr-2"
              />
              <label htmlFor="is_active" className="text-sm text-gray-300">
                Active
              </label>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : equipment ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [stats, setStats] = useState<EquipmentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filters: any = { 
        page, 
        limit: 12, 
        active_only: activeOnly 
      }
      
      if (searchTerm) filters.search = searchTerm
      if (categoryFilter) filters.category = categoryFilter
      
      const [equipmentData, statsData] = await Promise.all([
        apiClient.admin.getEquipment(filters),
        apiClient.admin.getEquipmentStats()
      ])
      
      setEquipment(equipmentData.equipment)
      setTotalPages(equipmentData.totalPages)
      setStats(statsData)
    } catch (err) {
      console.error('Error fetching equipment data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load equipment data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, searchTerm, categoryFilter, activeOnly])

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment)
    setIsModalOpen(true)
  }

  const handleDelete = async (equipment: Equipment) => {
    // First check if equipment is in use
    try {
      const usageResponse = await apiClient.admin.getEquipment({ 
        page: 1, 
        limit: 1,
        search: equipment.name 
      })
      
      const equipmentData = usageResponse.equipment.find(e => e.equipment_id === equipment.equipment_id)
      const exerciseCount = equipmentData?.exercise_count || 0
      const templateCount = equipmentData?.template_count || 0
      
      if (exerciseCount > 0 || templateCount > 0) {
        const message = `Cannot delete "${equipment.name}" because it's being used by ${exerciseCount} exercises and ${templateCount} templates.\n\nWould you like to deactivate it instead? This will hide it from new selections while preserving existing data.`
        
        if (confirm(message)) {
          // Deactivate instead of delete
          await apiClient.admin.updateEquipment({
            equipment_id: equipment.equipment_id,
            name: equipment.name,
            category: equipment.category,
            description: equipment.description,
            is_active: false
          })
          fetchData()
        }
        return
      }
    } catch (error) {
      // If we can't check usage, proceed with original confirmation
    }

    // If not in use, allow deletion
    if (!confirm(`Are you sure you want to permanently delete "${equipment.name}"?`)) return

    try {
      await apiClient.admin.deleteEquipment(equipment.equipment_id)
      fetchData()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete equipment'
      alert(`Error: ${errorMessage}`)
    }
  }

  const handleModalSave = () => {
    fetchData()
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingEquipment(null)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'free_weights':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )
      case 'machines':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        )
      case 'cardio':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
    }
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'free_weights':
        return 'bg-orange-500/20 text-blue-400 border-blue-500/30'
      case 'machines':
        return 'bg-orange-500/20 text-purple-400 border-purple-500/30'
      case 'cardio':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'bodyweight':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'resistance':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">⚠️ Error loading equipment</div>
            <div className="text-gray-400 mb-4">{error}</div>
            <button 
              onClick={fetchData}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Equipment Management
            </h1>
            <p className="mt-2 text-gray-400">
              Manage exercise equipment across all organizations.
            </p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
          >
            Add Equipment
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Equipment"
              value={stats.totalEquipment.toString()}
              gradient="from-orange-500 to-orange-600"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
            />
            <StatsCard
              title="Active Equipment"
              value={stats.activeEquipment.toString()}
              gradient="from-green-500 to-emerald-600"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatsCard
              title="Categories"
              value={stats.equipmentByCategory.length.toString()}
              gradient="from-orange-500 to-orange-600"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
            />
            <StatsCard
              title="Most Used"
              value={stats.mostUsedEquipment[0]?.name || 'None'}
              gradient="from-orange-500 to-red-600"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
            />
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-300">Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search equipment..."
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-300">Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="free_weights">Free Weights</option>
              <option value="machines">Machines</option>
              <option value="cardio">Cardio</option>
              <option value="bodyweight">Bodyweight</option>
              <option value="resistance">Resistance</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="activeOnly"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="mr-1"
            />
            <label htmlFor="activeOnly" className="text-sm font-medium text-gray-300">
              Active Only
            </label>
          </div>
          
          {(searchTerm || categoryFilter || activeOnly) && (
            <button
              onClick={() => {
                setSearchTerm('')
                setCategoryFilter('')
                setActiveOnly(false)
                setPage(1)
              }}
              className="px-3 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-colors text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-400">Loading equipment...</span>
          </div>
        )}

        {/* Equipment Grid */}
        {!loading && equipment.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {equipment.map((item) => (
              <div key={item.equipment_id} className="rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#232323] shadow-xl border border-gray-700 p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg text-white">
                      {getCategoryIcon(item.category)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {item.name}
                      </h3>
                      <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium border ${getCategoryBadge(item.category)}`}>
                        {item.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <span className={`w-3 h-3 rounded-full ${item.is_active ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Usage Statistics */}
                  {((item.exercise_count || 0) > 0 || (item.template_count || 0) > 0) && (
                    <div className="flex items-center space-x-4 text-sm">
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-400">Used by:</span>
                      </div>
                      {(item.exercise_count || 0) > 0 && (
                        <span className="text-blue-400">
                          {item.exercise_count} exercise{item.exercise_count !== 1 ? 's' : ''}
                        </span>
                      )}
                      {(item.template_count || 0) > 0 && (
                        <span className="text-purple-400">
                          {item.template_count} template{item.template_count !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )}

                  {item.description && (
                    <div>
                      <span className="text-gray-400 text-sm">Description</span>
                      <p className="text-gray-300 text-sm mt-1">
                        {item.description}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Exercises</span>
                    <span className="text-white font-semibold">{item.exercise_count || 0}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Templates</span>
                    <span className="text-white font-semibold">{item.template_count || 0}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Created</span>
                    <span className="text-gray-300">{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex-1 px-3 py-2 bg-orange-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-orange-500/30 transition-colors duration-200 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className={`flex-1 px-3 py-2 border rounded-lg transition-colors duration-200 text-sm ${
                        ((item.exercise_count || 0) > 0 || (item.template_count || 0) > 0)
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                      }`}
                      title={
                        ((item.exercise_count || 0) > 0 || (item.template_count || 0) > 0)
                          ? 'Equipment is in use - will offer to deactivate instead'
                          : 'Delete equipment permanently'
                      }
                    >
                      {((item.exercise_count || 0) > 0 || (item.template_count || 0) > 0) ? 'Deactivate' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && equipment.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No equipment found</div>
            <div className="text-gray-500">Add your first equipment to get started</div>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Equipment Modal */}
      <EquipmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        equipment={editingEquipment}
        onSave={handleModalSave}
      />
    </AdminLayout>
  )
}