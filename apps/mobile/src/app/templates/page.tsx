'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { trpc } from '../../lib/trpc'
import { CustomExerciseModal } from '@/components/CustomExerciseModal'
import { PullToRefresh } from '../../components/PullToRefresh'
import { 
  VALUE_TYPE_LABELS, 
  VALUE_TYPE_UNITS, 
  VALUE_TYPE_PLACEHOLDERS,
  COMMON_VALUE_TYPE_COMBINATIONS,
  type SetValueType,
  type SessionCategory
} from '@rythm/shared'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ClipboardDocumentIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface ExerciseTemplate {
  template_id: string
  name: string
  muscle_groups: string[]
  equipment: string
  exercise_category: string
  exercise_type: 'STRENGTH' | 'CARDIO'
  default_value_1_type: string
  default_value_2_type: string
  description: string
  instructions: string
}

interface TemplateExercise {
  exercise_id?: string
  name: string
  category: 'strength' | 'cardio' | 'hybrid'
  muscle_groups: string[]
  sets: number
  // Configurable value types instead of hardcoded fields
  value_1_type?: SetValueType
  value_1_default?: string
  value_2_type?: SetValueType
  value_2_default?: string
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
  created_by_name?: string
  created_by_lastname?: string
}

interface TemplateFormData {
  name: string
  description: string
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

// Helper function to display exercise values
const getExerciseValueDisplay = (exercise: TemplateExercise): string => {
  const parts: string[] = []
  
  if (exercise.value_1_type && exercise.value_1_default) {
    const unit = VALUE_TYPE_UNITS[exercise.value_1_type]
    parts.push(`${exercise.value_1_default}${unit === 'reps' ? '' : unit}`)
  }
  
  if (exercise.value_2_type && exercise.value_2_default) {
    const unit = VALUE_TYPE_UNITS[exercise.value_2_type]
    parts.push(`${exercise.value_2_default}${unit === 'reps' ? '' : unit}`)
  }
  
  return parts.length > 0 ? parts.join(' × ') : 'No values set'
}

function TemplatesPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedScope, setSelectedScope] = useState<'all' | 'user' | 'tenant' | 'system'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<WorkoutTemplate | null>(null)
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([])
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [showCustomExerciseModal, setShowCustomExerciseModal] = useState(false)
  const [isCreatingExercise, setIsCreatingExercise] = useState(false)
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    exercises: []
  })

  // tRPC mutation for creating exercise templates
  const createExerciseTemplate = trpc.exerciseTemplates.create.useMutation()

  // Fetch exercise templates using tRPC
  const { data: exerciseTemplatesData } = trpc.exerciseTemplates.list.useQuery({
    limit: 200
  })

  // Update local state when tRPC data changes
  useEffect(() => {
    if (exerciseTemplatesData) {
      setExerciseTemplates(exerciseTemplatesData)
    }
  }, [exerciseTemplatesData])

  // Fetch templates
  const { 
    data: templates, 
    isLoading, 
    error,
    refetch 
  } = trpc.workoutTemplates.list.useQuery({
    search: searchTerm || undefined,
    scope: selectedScope === 'all' ? undefined : selectedScope,
    limit: 50
  }, {
    enabled: !!user
  })

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    await refetch()
  }

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
      setShowCreateModal(false)
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
      exercises: template.exercises.sort((a, b) => a.order - b.order)
    })
    setEditingTemplate(template)
    setShowCreateModal(true)
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
        scope: 'user',
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

  const addExerciseToTemplate = async (exerciseName: string) => {
    // First try to find the exercise in templates
    const template = exerciseTemplates.find(t => t.name === exerciseName)
    
    let exerciseData: TemplateExercise
    
    if (template) {
      // Create exercise from template with default value types
      const defaultValue1 = getDefaultValueForType(template.default_value_1_type as SetValueType, template.exercise_type)
      const defaultValue2 = getDefaultValueForType(template.default_value_2_type as SetValueType, template.exercise_type)
      
      exerciseData = {
        exercise_id: template.template_id,
        name: template.name,
        category: template.exercise_category as 'strength' | 'cardio' | 'hybrid',
        muscle_groups: template.muscle_groups,
        sets: 3,
        value_1_type: template.default_value_1_type as SetValueType || undefined,
        value_1_default: defaultValue1,
        value_2_type: template.default_value_2_type as SetValueType || undefined,
        value_2_default: defaultValue2,
        order: formData.exercises.length,
        notes: ''
      }
    } else {
      // Create custom exercise with default strength configuration
      exerciseData = {
        name: exerciseName,
        category: 'strength',
        muscle_groups: [],
        sets: 3,
        value_1_type: 'weight_kg',
        value_1_default: '75',
        value_2_type: 'reps',
        value_2_default: '8-10',
        order: formData.exercises.length,
        notes: ''
      }
    }
    
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, exerciseData]
    }))
    setShowExerciseModal(false)
  }

  // Helper function to get default values based on value type and exercise type
  const getDefaultValueForType = (valueType: SetValueType | undefined, exerciseType: string): string | undefined => {
    if (!valueType) return undefined
    
    switch (valueType) {
      case 'weight_kg':
        return '75'
      case 'reps':
        return exerciseType === 'STRENGTH' ? '8-10' : '12'
      case 'duration_m':
        return exerciseType === 'CARDIO' ? '300' : '60' // 5 min for cardio, 1 min for others
      case 'distance_m':
        return exerciseType === 'CARDIO' ? '5000' : '100' // 5km for cardio, 100m for others
      case 'calories':
        return '200'
      default:
        return undefined
    }
  }

  const handleCreateCustomExercise = async (exerciseData: any) => {
    setIsCreatingExercise(true)
    try {
      const newTemplate = await createExerciseTemplate.mutateAsync(exerciseData)
      // Add the new exercise to the template
      addExerciseToTemplate(newTemplate.name)
      setShowCustomExerciseModal(false)
    } catch (error) {
      console.error('Error creating custom exercise:', error)
      alert('Failed to create custom exercise. Please try again.')
    } finally {
      setIsCreatingExercise(false)
    }
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
      exercises: prev.exercises.filter((_, i) => i !== index).map((ex, i) => ({
        ...ex,
        order: i
      }))
    }))
  }

  const moveExerciseUp = (index: number) => {
    if (index === 0) return // Can't move the first item up
    
    setFormData(prev => {
      const newExercises = [...prev.exercises]
      const temp = newExercises[index]
      newExercises[index] = { ...newExercises[index - 1], order: index }
      newExercises[index - 1] = { ...temp, order: index - 1 }
      return {
        ...prev,
        exercises: newExercises
      }
    })
  }

  const moveExerciseDown = (index: number) => {
    setFormData(prev => {
      if (index === prev.exercises.length - 1) return prev // Can't move the last item down
      
      const newExercises = [...prev.exercises]
      const temp = newExercises[index]
      newExercises[index] = { ...newExercises[index + 1], order: index }
      newExercises[index + 1] = { ...temp, order: index + 1 }
      return {
        ...prev,
        exercises: newExercises
      }
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Please log in to view your workout templates
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Workout Templates
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Create and manage reusable workout templates
                </p>
              </div>
              <button
                onClick={handleCreateTemplate}
                className="inline-flex items-center justify-center px-4 py-3 min-h-[48px] border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <PlusIcon className="w-5 h-5 mr-2" />
                New Template
              </button>
            </div>

            {/* Filters */}
            <div className="mt-6 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
              <div>
                <label htmlFor="search" className="sr-only">Search templates</label>
                <input
                  id="search"
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full h-12 px-4 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
              <div>
                <label htmlFor="scope-filter" className="sr-only">Filter by scope</label>
                <select
                  id="scope-filter"
                  value={selectedScope}
                  onChange={(e) => setSelectedScope(e.target.value as any)}
                  className="block w-full h-12 px-4 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="all">All Templates</option>
                  <option value="user">My Templates</option>
                  <option value="tenant">Organization</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
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
          <div className="text-center py-12 px-4">
            <div className="max-w-md mx-auto">
              <ClipboardDocumentIcon className="mx-auto h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                No templates found
              </h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {searchTerm || selectedScope !== 'all' 
                  ? 'Try adjusting your search or filter settings'
                  : 'Get started by creating your first workout template'}
              </p>
              <div className="mt-6">
                <button
                  onClick={handleCreateTemplate}
                  className="inline-flex items-center px-6 py-3 min-h-[48px] border border-transparent text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <PlusIcon className="w-5 h-5 mr-2" />
                  Create Your First Template
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {templates.map((template: WorkoutTemplate) => (
              <div
                key={template.template_id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 sm:p-6 hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 truncate">
                      {template.name}
                    </h3>
                    {template.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center flex-wrap gap-2 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${SCOPE_COLORS[template.scope]}`}>
                        {SCOPE_LABELS[template.scope]}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {template.exercise_count || template.exercises?.length || 0} exercises
                      </span>
                    </div>
                  </div>
                  {template.scope === 'user' && (
                    <div className="flex items-center space-x-1 ml-3">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="p-2 min-h-[44px] min-w-[44px] text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        aria-label="Edit template"
                      >
                        <PencilIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template)}
                        className="p-2 min-h-[44px] min-w-[44px] text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        aria-label="Delete template"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Exercise Preview */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exercises
                  </h4>
                  {template.exercises?.sort((a, b) => a.order - b.order).slice(0, 3).map((exercise, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate block">
                          {exercise.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {exercise.sets} sets × {getExerciseValueDisplay(exercise)}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ml-2 flex-shrink-0 ${CATEGORY_COLORS[exercise.category]}`}>
                        {exercise.category}
                      </span>
                    </div>
                  ))}
                  {template.exercises && template.exercises.length > 3 && (
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        +{template.exercises.length - 3} more exercises
                      </p>
                    </div>
                  )}
                  {(!template.exercises || template.exercises.length === 0) && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        No exercises added yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </PullToRefresh>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)} />
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full max-w-md max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {editingTemplate ? 'Edit Template' : 'Create New Template'}
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    aria-label="Close modal"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <div className="space-y-6">
                  {/* Template Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Template Name *
                      </label>
                      <input
                        id="template-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter template name"
                        className="block w-full h-12 px-4 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="template-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        id="template-description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe this template (optional)"
                        rows={3}
                        className="block w-full px-4 py-3 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-blue-500 resize-none"
                      />
                    </div>
                  </div>

                  {/* Exercises Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        Exercises ({formData.exercises.length})
                      </h4>
                      <button
                        onClick={() => setShowExerciseModal(true)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      >
                        <PlusIcon className="w-4 h-4 mr-1" />
                        Add Exercise
                      </button>
                    </div>
                    
                    {formData.exercises.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                        <ClipboardDocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No exercises</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          Add exercises to create your template
                        </p>
                        <div className="mt-4">
                          <button
                            onClick={() => setShowExerciseModal(true)}
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                          >
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Add First Exercise
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.exercises.map((exercise, index) => (
                          <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <label htmlFor={`exercise-name-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Exercise Name
                                </label>
                                <input
                                  id={`exercise-name-${index}`}
                                  type="text"
                                  value={exercise.name}
                                  onChange={(e) => updateExercise(index, { ...exercise, name: e.target.value })}
                                  placeholder="e.g., Bench Press"
                                  className="block w-full h-10 px-3 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex items-center gap-2 ml-3">
                                {/* Move buttons */}
                                {formData.exercises.length > 1 && (
                                  <div className="flex flex-col gap-1">
                                    <button
                                      onClick={() => moveExerciseUp(index)}
                                      disabled={index === 0}
                                      className={`p-1 rounded ${
                                        index === 0 
                                          ? 'text-gray-400 cursor-not-allowed' 
                                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                                      }`}
                                      aria-label="Move exercise up"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => moveExerciseDown(index)}
                                      disabled={index === formData.exercises.length - 1}
                                      className={`p-1 rounded ${
                                        index === formData.exercises.length - 1 
                                          ? 'text-gray-400 cursor-not-allowed' 
                                          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'
                                      }`}
                                      aria-label="Move exercise down"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </button>
                                  </div>
                                )}
                                <button
                                  onClick={() => removeExercise(index)}
                                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  aria-label="Remove exercise"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label htmlFor={`exercise-category-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Category
                                </label>
                                <select
                                  id={`exercise-category-${index}`}
                                  value={exercise.category}
                                  onChange={(e) => updateExercise(index, { ...exercise, category: e.target.value as any })}
                                  className="block w-full h-10 px-3 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:border-blue-500 focus:ring-blue-500"
                                >
                                  <option value="strength">Strength</option>
                                  <option value="cardio">Cardio</option>
                                  <option value="hybrid">Hybrid</option>
                                </select>
                              </div>
                              
                              <div>
                                <label htmlFor={`exercise-sets-${index}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Sets
                                </label>
                                <input
                                  id={`exercise-sets-${index}`}
                                  type="number"
                                  value={exercise.sets}
                                  onChange={(e) => updateExercise(index, { ...exercise, sets: parseInt(e.target.value) || 1 })}
                                  placeholder="3"
                                  min="1"
                                  max="20"
                                  className="block w-full h-10 px-3 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:border-blue-500 focus:ring-blue-500"
                                />
                              </div>
                            </div>

                            {/* Value Type Configuration */}
                            <div className="mt-3 space-y-3">
                              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Set Values</h5>
                              
                              {/* Value 1 */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label htmlFor={`value-1-type-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Value 1 Type
                                  </label>
                                  <select
                                    id={`value-1-type-${index}`}
                                    value={exercise.value_1_type || ''}
                                    onChange={(e) => updateExercise(index, { 
                                      ...exercise, 
                                      value_1_type: e.target.value as SetValueType || undefined,
                                      value_1_default: e.target.value ? exercise.value_1_default || '' : undefined
                                    })}
                                    className="block w-full h-9 px-2 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:border-blue-500 focus:ring-blue-500"
                                  >
                                    <option value="">None</option>
                                    {Object.entries(VALUE_TYPE_LABELS).map(([value, label]) => (
                                      <option key={value} value={value}>{label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor={`value-1-default-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Default Value
                                  </label>
                                  <input
                                    id={`value-1-default-${index}`}
                                    type="text"
                                    value={exercise.value_1_default || ''}
                                    onChange={(e) => updateExercise(index, { ...exercise, value_1_default: e.target.value })}
                                    placeholder={exercise.value_1_type ? VALUE_TYPE_PLACEHOLDERS[exercise.value_1_type] : 'Select type first'}
                                    disabled={!exercise.value_1_type}
                                    className="block w-full h-9 px-2 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </div>
                              </div>

                              {/* Value 2 */}
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label htmlFor={`value-2-type-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Value 2 Type
                                  </label>
                                  <select
                                    id={`value-2-type-${index}`}
                                    value={exercise.value_2_type || ''}
                                    onChange={(e) => updateExercise(index, { 
                                      ...exercise, 
                                      value_2_type: e.target.value as SetValueType || undefined,
                                      value_2_default: e.target.value ? exercise.value_2_default || '' : undefined
                                    })}
                                    className="block w-full h-9 px-2 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:border-blue-500 focus:ring-blue-500"
                                  >
                                    <option value="">None</option>
                                    {Object.entries(VALUE_TYPE_LABELS).map(([value, label]) => (
                                      <option key={value} value={value}>{label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label htmlFor={`value-2-default-${index}`} className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    Default Value
                                  </label>
                                  <input
                                    id={`value-2-default-${index}`}
                                    type="text"
                                    value={exercise.value_2_default || ''}
                                    onChange={(e) => updateExercise(index, { ...exercise, value_2_default: e.target.value })}
                                    placeholder={exercise.value_2_type ? VALUE_TYPE_PLACEHOLDERS[exercise.value_2_type] : 'Select type first'}
                                    disabled={!exercise.value_2_type}
                                    className="block w-full h-9 px-2 rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  />
                                </div>
                              </div>

                              {/* Quick preset buttons for common combinations */}
                              <div className="mt-2">
                                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                  Quick Presets
                                </label>
                                <div className="flex flex-wrap gap-1">
                                  {COMMON_VALUE_TYPE_COMBINATIONS[exercise.category].map((combo, comboIndex) => (
                                    <button
                                      key={comboIndex}
                                      type="button"
                                      onClick={() => updateExercise(index, {
                                        ...exercise,
                                        value_1_type: combo.value_1_type,
                                        value_1_default: combo.value_1_type === 'weight_kg' ? '75' : combo.value_1_type === 'reps' ? '8-10' : '30',
                                        value_2_type: combo.value_2_type || undefined,
                                        value_2_default: combo.value_2_type === 'reps' ? '8-10' : combo.value_2_type === 'distance_m' ? '1000' : undefined,
                                      })}
                                      className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                    >
                                      {combo.label}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex flex-col sm:flex-row sm:justify-end gap-3 flex-shrink-0">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-3 min-h-[48px] border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitTemplate}
                  disabled={!formData.name.trim() || createTemplate.isLoading || updateTemplate.isLoading}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-3 min-h-[48px] border border-transparent text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createTemplate.isLoading || updateTemplate.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4 mr-2" />
                      {editingTemplate ? 'Update Template' : 'Create Template'}
                    </>
                  )}
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
            
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-6 pt-6 pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-gray-100">
                      Delete Template
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete <span className="font-medium text-gray-900 dark:text-gray-100">"{showDeleteModal.name}"</span>? 
                        This action cannot be undone and will permanently remove this template.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex flex-col sm:flex-row sm:justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-3 min-h-[48px] border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteTemplate.isLoading}
                  className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-3 min-h-[48px] border border-transparent text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteTemplate.isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Delete Template
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Exercise Modal */}
      {showExerciseModal && (
        <AddExerciseModal
          onClose={() => setShowExerciseModal(false)}
          onAddExercise={addExerciseToTemplate}
          templates={exerciseTemplates}
          onShowCustomModal={() => {
            setShowExerciseModal(false)
            setShowCustomExerciseModal(true)
          }}
        />
      )}

      {/* Custom Exercise Modal */}
      {showCustomExerciseModal && (
        <CustomExerciseModal
          onSave={handleCreateCustomExercise}
          onClose={() => setShowCustomExerciseModal(false)}
          loading={isCreatingExercise}
        />
      )}
    </div>
  )
}

// AddExerciseModal component for template creation
function AddExerciseModal({
  onClose,
  onAddExercise,
  templates,
  onShowCustomModal
}: {
  onClose: () => void
  onAddExercise: (exerciseName: string) => void
  templates: ExerciseTemplate[]
  onShowCustomModal: () => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')

  // Filter templates based on search, category, and type
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.exercise_category === selectedCategory
    const matchesType = selectedType === 'all' || template.exercise_type === selectedType
    return matchesSearch && matchesCategory && matchesType
  })

  const categories = ['all', 'strength', 'cardio', 'flexibility', 'sports']
  const types = ['all', 'STRENGTH', 'CARDIO']

  // Get counts for each type
  const strengthCount = templates.filter(t => t.exercise_type === 'STRENGTH').length
  const cardioCount = templates.filter(t => t.exercise_type === 'CARDIO').length

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Add Exercise</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onShowCustomModal}
              className="text-teal-500 hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300 font-medium text-sm"
            >
              Custom Exercise
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Exercise Type Filter */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Exercise Type</h4>
          <div className="flex gap-2">
            {types.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {type === 'all' ? `All (${templates.length})` : 
                 type === 'STRENGTH' ? `💪 Strength (${strengthCount})` : 
                 `🏃 Cardio (${cardioCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</h4>
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              {searchQuery ? 'SEARCH RESULTS' : 
               selectedType !== 'all' ? `${selectedType} EXERCISES` : 
               'EXERCISE LIBRARY'} ({filteredTemplates.length})
            </h3>
            <div className="space-y-1">
              {filteredTemplates.map((template) => (
                <button
                  key={template.template_id}
                  onClick={() => onAddExercise(template.name)}
                  className="w-full text-left px-3 py-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-gray-900 dark:text-gray-100">{template.name}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      template.exercise_type === 'STRENGTH' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {template.exercise_type === 'STRENGTH' ? '💪 STR' : '🏃 CAR'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {template.muscle_groups.join(', ')} • {template.exercise_category}
                    {template.equipment && ` • ${template.equipment}`}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Default: {template.default_value_1_type}{template.default_value_2_type && ` + ${template.default_value_2_type}`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* No Results */}
          {searchQuery && filteredTemplates.length === 0 && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              <p>No exercises found for "{searchQuery}"</p>
              <button
                onClick={() => onAddExercise(searchQuery)}
                className="mt-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Create "{searchQuery}" as custom exercise
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default withAuth(TemplatesPage)