'use client'
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ClipboardDocumentIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

interface TemplateExercise {
  exercise_id?: string
  name: string
  category: 'strength' | 'cardio' | 'hybrid'
  muscle_groups: string[]
  sets: number
  reps?: string
  weight?: string
  duration?: string
  distance?: string
  notes?: string
  rest_time?: string
  order: number
}

interface WorkoutTemplate {
  template_id: string
  name: string
  description?: string
  scope: 'user' | 'tenant' | 'system'
  exercises: TemplateExercise[]
  exercise_count: number
  created_at: string
  updated_at: string
  created_by_name?: string
  created_by_lastname?: string
  user_id?: string
}

interface TemplateFormData {
  name: string
  description: string
  scope: 'tenant' | 'system'
  exercises: TemplateExercise[]
}

const CATEGORY_COLORS = {
  strength: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  cardio: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  hybrid: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
}

const SCOPE_LABELS = {
  user: 'Personal',
  tenant: 'Organization',
  system: 'System'
}

const SCOPE_COLORS = {
  user: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  tenant: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  system: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
}

export default function AdminTemplatesPage() {
  const { user } = useAuth()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedScope, setSelectedScope] = useState<'all' | 'user' | 'tenant' | 'system'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null)
  const [viewingTemplate, setViewingTemplate] = useState<WorkoutTemplate | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<WorkoutTemplate | null>(null)
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    scope: 'tenant',
    exercises: []
  })

  const pageSize = 20
  const offset = (currentPage - 1) * pageSize

  // Fetch templates
  const { 
    data: templates, 
    isLoading, 
    error,
    refetch 
  } = trpc.workoutTemplates.list.useQuery({
    search: searchTerm || undefined,
    scope: selectedScope === 'all' ? undefined : selectedScope,
    limit: pageSize,
    offset: offset
  })

  // Fetch total count for pagination
  const { data: totalCount } = trpc.workoutTemplates.count.useQuery({
    search: searchTerm || undefined,
    scope: selectedScope === 'all' ? undefined : selectedScope
  })

  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 0

  // Mutations
  const createTemplate = trpc.workoutTemplates.create.useMutation({
    onSuccess: () => {
      refetch()
      resetForm()
      setShowCreateModal(false)
    }
  })

  const updateTemplate = trpc.workoutTemplates.update.useMutation({
    onSuccess: () => {
      refetch()
      resetForm()
      setEditingTemplate(null)
    }
  })

  const deleteTemplate = trpc.workoutTemplates.delete.useMutation({
    onSuccess: () => {
      refetch()
      setShowDeleteModal(null)
    }
  })

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      scope: 'tenant',
      exercises: []
    })
  }

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    resetForm()
    setShowCreateModal(true)
  }

  const handleEditTemplate = (template: WorkoutTemplate) => {
    setFormData({
      name: template.name,
      description: template.description || '',
      scope: template.scope as 'tenant' | 'system',
      exercises: template.exercises
    })
    setEditingTemplate(template)
    setShowCreateModal(true)
  }

  const handleViewTemplate = (template: WorkoutTemplate) => {
    setViewingTemplate(template)
  }

  const handleSubmitTemplate = () => {
    if (!formData.name.trim()) return

    if (editingTemplate) {
      updateTemplate.mutate({
        template_id: editingTemplate.template_id,
        name: formData.name,
        description: formData.description || undefined,
        exercises: formData.exercises
      })
    } else {
      createTemplate.mutate({
        name: formData.name,
        description: formData.description || undefined,
        scope: formData.scope,
        exercises: formData.exercises
      })
    }
  }

  const handleDeleteTemplate = (template: WorkoutTemplate) => {
    setShowDeleteModal(template)
  }

  const confirmDelete = () => {
    if (showDeleteModal) {
      deleteTemplate.mutate({ templateId: showDeleteModal.template_id })
    }
  }

  const addExercise = () => {
    const newExercise: TemplateExercise = {
      name: '',
      category: 'strength',
      muscle_groups: [],
      sets: 3,
      reps: '8-12',
      order: formData.exercises.length
    }
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, newExercise]
    }))
  }

  const updateExercise = (index: number, exercise: TemplateExercise) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => i === index ? exercise : ex)
    }))
  }

  const removeExercise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }))
  }

  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  // Check admin permissions
  if (!user || !['tenant_admin', 'org_admin'].includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need admin permissions to manage workout templates.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Workout Templates
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Manage organizational and system workout templates
                </p>
              </div>
              {(user.role === 'org_admin' || user.role === 'tenant_admin') && (
                <button
                  onClick={handleCreateTemplate}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  New Template
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <select
                  value={selectedScope}
                  onChange={(e) => setSelectedScope(e.target.value as any)}
                  className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">All Scopes</option>
                  <option value="user">Personal Templates</option>
                  <option value="tenant">Organization Templates</option>
                  {user.role === 'org_admin' && <option value="system">System Templates</option>}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">
              Error loading templates. Please try again.
            </p>
          </div>
        ) : !templates || templates.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardDocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No templates found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating your first workout template
            </p>
            {(user.role === 'org_admin' || user.role === 'tenant_admin') && (
              <div className="mt-6">
                <button
                  onClick={handleCreateTemplate}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Create Template
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Templates Table */}
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {templates.map((template: WorkoutTemplate) => (
                  <li key={template.template_id}>
                    <div className="px-4 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                              {template.name}
                            </h3>
                            {template.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {template.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 mt-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${SCOPE_COLORS[template.scope]}`}>
                                {SCOPE_LABELS[template.scope]}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {template.exercise_count || template.exercises?.length || 0} exercises
                              </span>
                              {template.created_by_name && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  Created by {template.created_by_name} {template.created_by_lastname}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewTemplate(template)}
                              className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              title="View template"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {(template.scope !== 'user' || user.role === 'org_admin') && (
                              <>
                                <button
                                  onClick={() => handleEditTemplate(template)}
                                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                                  title="Edit template"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteTemplate(template)}
                                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                                  title="Delete template"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => goToPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                          page === currentPage
                            ? 'bg-blue-600 text-white border border-blue-600'
                            : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  
                  <button
                    onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Modal - Similar to mobile version but with admin-specific fields */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)} />
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {editingTemplate ? 'Edit Template' : 'Create New Template'}
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Template Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter template name"
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description (optional)
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe this template"
                        rows={3}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Scope
                      </label>
                      <select
                        value={formData.scope}
                        onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value as 'tenant' | 'system' }))}
                        className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        disabled={editingTemplate?.scope === 'user'}
                      >
                        <option value="tenant">Organization</option>
                        {user.role === 'org_admin' && <option value="system">System</option>}
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formData.scope === 'tenant' 
                          ? 'Available to all users in your organization' 
                          : 'Available to all users across all organizations'
                        }
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Exercises
                      </label>
                      <button
                        onClick={addExercise}
                        className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Add Exercise
                      </button>
                    </div>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {formData.exercises.map((exercise, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-md p-3">
                          <div className="flex items-center justify-between mb-2">
                            <input
                              type="text"
                              value={exercise.name}
                              onChange={(e) => updateExercise(index, { ...exercise, name: e.target.value })}
                              placeholder="Exercise name"
                              className="flex-1 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                            />
                            <button
                              onClick={() => removeExercise(index)}
                              className="ml-2 text-red-500 hover:text-red-700"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            <select
                              value={exercise.category}
                              onChange={(e) => updateExercise(index, { ...exercise, category: e.target.value as any })}
                              className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                              <option value="strength">Strength</option>
                              <option value="cardio">Cardio</option>
                              <option value="hybrid">Hybrid</option>
                            </select>
                            
                            <input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => updateExercise(index, { ...exercise, sets: parseInt(e.target.value) || 1 })}
                              placeholder="Sets"
                              min="1"
                              className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                            
                            <input
                              type="text"
                              value={exercise.reps || ''}
                              onChange={(e) => updateExercise(index, { ...exercise, reps: e.target.value })}
                              placeholder="Reps"
                              className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleSubmitTemplate}
                  disabled={!formData.name.trim() || createTemplate.isLoading || updateTemplate.isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {createTemplate.isLoading || updateTemplate.isLoading ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Template Modal */}
      {viewingTemplate && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setViewingTemplate(null)} />
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    {viewingTemplate.name}
                  </h3>
                  <button
                    onClick={() => setViewingTemplate(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {viewingTemplate.description && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {viewingTemplate.description}
                      </p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Exercises ({viewingTemplate.exercises?.length || 0})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {viewingTemplate.exercises?.map((exercise, index) => (
                        <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <h5 className="font-medium text-gray-900 dark:text-gray-100">
                              {exercise.name}
                            </h5>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${CATEGORY_COLORS[exercise.category]}`}>
                              {exercise.category}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {exercise.sets} sets {exercise.reps && `• ${exercise.reps} reps`} {exercise.weight && `• ${exercise.weight}`}
                          </div>
                          {exercise.notes && (
                            <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                              {exercise.notes}
                            </div>
                          )}
                        </div>
                      )) || (
                        <p className="text-sm text-gray-500 dark:text-gray-400">No exercises defined</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setViewingTemplate(null)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteModal(null)} />
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                      Delete Template
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete "{showDeleteModal.name}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={confirmDelete}
                  disabled={deleteTemplate.isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {deleteTemplate.isLoading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}