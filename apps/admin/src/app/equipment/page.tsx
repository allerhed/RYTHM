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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-4">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
        
        <div className="relative bg-dark-card rounded-xl shadow-2xl border border-dark-border max-w-md w-full" onClick={(e) => e.stopPropagation()}>
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                className="flex-1 px-4 py-2 btn-primary rounded-lg transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : equipment ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
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
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [activeOnly, setActiveOnly] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<Equipment | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filters: any = { 
        page: 1, 
        limit: 1000,
        active_only: activeOnly 
      }
      
      if (searchTerm) filters.search = searchTerm
      if (categoryFilter) filters.category = categoryFilter
      
      const [equipmentData, statsData] = await Promise.all([
        apiClient.admin.getEquipment(filters),
        apiClient.admin.getEquipmentStats()
      ])
      
      setEquipment(equipmentData.equipment)
      setStats(statsData)
    } catch (err) {
      console.error('Error fetching equipment data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load equipment data')
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort equipment client-side
  const filteredEquipment = equipment.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))

  useEffect(() => {
    fetchData()
  }, [searchTerm, categoryFilter, activeOnly])

  const handleEdit = (equipment: Equipment) => {
    setEditingEquipment(equipment)
    setIsModalOpen(true)
  }

  const handleDelete = (equipment: Equipment) => {
    setShowDeleteModal(equipment)
    setDeleteError(null)
  }

  const confirmDelete = async () => {
    if (!showDeleteModal) return

    try {
      setIsDeleting(true)
      setDeleteError(null)

      const exerciseCount = showDeleteModal.exercise_count || 0
      const templateCount = showDeleteModal.template_count || 0
      
      if (exerciseCount > 0 || templateCount > 0) {
        // Deactivate instead of delete
        await apiClient.admin.updateEquipment({
          equipment_id: showDeleteModal.equipment_id,
          name: showDeleteModal.name,
          category: showDeleteModal.category,
          description: showDeleteModal.description,
          is_active: false
        })
        setEquipment(prev => prev.map(e => 
          e.equipment_id === showDeleteModal.equipment_id 
            ? { ...e, is_active: false } 
            : e
        ))
        setShowDeleteModal(null)
        return
      }
      
      // Safe to delete
      await apiClient.admin.deleteEquipment(showDeleteModal.equipment_id)
      setEquipment(prev => prev.filter(e => e.equipment_id !== showDeleteModal.equipment_id))
      setShowDeleteModal(null)
    } catch (err) {
      console.error('Error handling equipment deletion:', err)
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete/deactivate equipment')
    } finally {
      setIsDeleting(false)
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
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'machines':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'cardio':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'bodyweight':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'resistance':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default:
        return 'bg-dark-elevated0/20 text-gray-400 border-gray-500/30'
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
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
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
            className="px-4 py-2 btn-primary rounded-lg transition-all duration-200 shadow-lg"
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
              accent="primary"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
            />
            <StatsCard
              title="Active Equipment"
              value={stats.activeEquipment.toString()}
              accent="primary"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatsCard
              title="Categories"
              value={stats.equipmentByCategory.length.toString()}
              accent="primary"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
            />
            <StatsCard
              title="Most Used"
              value={stats.mostUsedEquipment[0]?.name || 'None'}
              accent="primary"
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
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-400"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-300">Category:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              }}
              className="px-3 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-dark-elevated0 transition-colors text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
            <span className="ml-3 text-gray-400">Loading equipment...</span>
          </div>
        )}

        {/* Equipment Table */}
        {!loading && filteredEquipment.length > 0 && (
          <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-gray-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">
                Equipment ({filteredEquipment.length})
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Equipment
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Exercises
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Templates
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredEquipment.map((item) => (
                    <tr key={item.equipment_id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="icon-accent h-10 w-10 rounded-lg flex items-center justify-center shadow-lg text-white mr-3">
                            {getCategoryIcon(item.category)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {item.name}
                            </div>
                            {item.description && (
                              <div className="text-xs text-gray-400 line-clamp-1 max-w-xs">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`badge-primary ${getCategoryBadge(item.category)}`}>
                          {item.category.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`w-2 h-2 rounded-full mr-2 ${item.is_active ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                          <span className="text-sm text-gray-300">{item.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{item.exercise_count || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">{item.template_count || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-primary hover:text-primary/80 transition-colors"
                            title="Edit equipment"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className={`transition-colors ${
                              ((item.exercise_count || 0) > 0 || (item.template_count || 0) > 0)
                                ? 'text-yellow-400 hover:text-yellow-400/80'
                                : 'text-error hover:text-error/80'
                            }`}
                            title={
                              ((item.exercise_count || 0) > 0 || (item.template_count || 0) > 0)
                                ? 'Equipment is in use - will deactivate'
                                : 'Delete equipment'
                            }
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredEquipment.length === 0 && (
          <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-gray-700 p-12 text-center">
            <div className="text-gray-400 text-lg mb-4">No equipment found</div>
            <div className="text-gray-500">Add your first equipment to get started</div>
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => !isDeleting && setShowDeleteModal(null)} />
            
            <div className="relative bg-dark-card rounded-xl text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full border border-dark-border">
              <div className="bg-dark-card px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${((showDeleteModal.exercise_count || 0) > 0 || (showDeleteModal.template_count || 0) > 0) ? 'bg-yellow-500/20' : 'bg-error/20'} sm:mx-0 sm:h-10 sm:w-10`}>
                    <svg className={`h-6 w-6 ${((showDeleteModal.exercise_count || 0) > 0 || (showDeleteModal.template_count || 0) > 0) ? 'text-yellow-400' : 'text-error'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-primary">
                      {((showDeleteModal.exercise_count || 0) > 0 || (showDeleteModal.template_count || 0) > 0) ? 'Deactivate Equipment' : 'Delete Equipment'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-secondary">
                        {((showDeleteModal.exercise_count || 0) > 0 || (showDeleteModal.template_count || 0) > 0) ? (
                          <>
                            "{showDeleteModal.name}" is being used by {showDeleteModal.exercise_count || 0} exercise(s) and {showDeleteModal.template_count || 0} template(s).
                            <br /><br />
                            This equipment will be <strong>deactivated</strong> (hidden from new selections) while preserving existing data.
                          </>
                        ) : (
                          `Are you sure you want to delete "${showDeleteModal.name}"? This action cannot be undone.`
                        )}
                      </p>
                      {deleteError && (
                        <p className="mt-2 text-sm text-error">
                          {deleteError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-dark-elevated px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-dark-border">
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className={`w-full inline-flex justify-center rounded-xl border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                    ((showDeleteModal.exercise_count || 0) > 0 || (showDeleteModal.template_count || 0) > 0)
                      ? 'bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500'
                      : 'bg-error hover:bg-error/90 focus:ring-error/50'
                  }`}
                >
                  {isDeleting ? 'Processing...' : ((showDeleteModal.exercise_count || 0) > 0 || (showDeleteModal.template_count || 0) > 0) ? 'Deactivate' : 'Delete'}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(null)
                    setDeleteError(null)
                  }}
                  disabled={isDeleting}
                  className="mt-3 w-full inline-flex justify-center rounded-xl border border-dark-border shadow-sm px-4 py-2 bg-dark-elevated text-base font-medium text-secondary hover:text-primary hover:bg-dark-card focus:outline-none focus:ring-2 focus:ring-primary/30 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}