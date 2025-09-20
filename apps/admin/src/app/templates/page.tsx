'use client'
import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AdminLayout } from '@/components/AdminLayout'
import { StatsCard } from '@/components/StatsCard'
import { CustomExerciseModal } from '@/components/CustomExerciseModal'
import { AddExerciseModal } from '@/components/AddExerciseModal'
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  ClipboardDocumentIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  SparklesIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'
// Temporarily disabled drag-and-drop due to Docker dependency issues
// import {
//   DndContext,
//   closestCenter,
//   KeyboardSensor,
//   PointerSensor,
//   useSensor,
//   useSensors,
//   DragEndEvent,
// } from '@dnd-kit/core'
// import {
//   arrayMove,
//   SortableContext,
//   sortableKeyboardCoordinates,
//   verticalListSortingStrategy,
// } from '@dnd-kit/sortable'
// import {
//   useSortable,
// } from '@dnd-kit/sortable'
// import { CSS } from '@dnd-kit/utilities'

// Local constants to avoid import issues
type SetValueType = 'weight_kg' | 'distance_m' | 'duration_s' | 'calories' | 'reps'

const VALUE_TYPE_LABELS = {
  weight_kg: 'Weight (kg)',
  distance_m: 'Distance (m)',
  duration_s: 'Duration (s)',
  calories: 'Calories',
  reps: 'Reps',
} as const

const VALUE_TYPE_UNITS = {
  weight_kg: 'kg',
  distance_m: 'm',
  duration_s: 's',
  calories: 'cal',
  reps: 'reps',
} as const

const VALUE_TYPE_PLACEHOLDERS = {
  weight_kg: 'e.g., 75, 80, 85',
  distance_m: 'e.g., 1000, 5000',
  duration_s: 'e.g., 30, 60, 120',
  calories: 'e.g., 200, 300',
  reps: 'e.g., 8-10, 12, AMRAP',
} as const

const COMMON_VALUE_TYPE_COMBINATIONS = {
  strength: [
    { value_1_type: 'weight_kg' as const, value_2_type: 'reps' as const, label: 'Weight × Reps' },
    { value_1_type: 'reps' as const, value_2_type: null, label: 'Reps Only' },
  ],
  cardio: [
    { value_1_type: 'duration_s' as const, value_2_type: 'distance_m' as const, label: 'Duration × Distance' },
    { value_1_type: 'duration_s' as const, value_2_type: null, label: 'Duration Only' },
    { value_1_type: 'distance_m' as const, value_2_type: null, label: 'Distance Only' },
    { value_1_type: 'calories' as const, value_2_type: null, label: 'Calories Only' },
  ],
  hybrid: [
    { value_1_type: 'weight_kg' as const, value_2_type: 'reps' as const, label: 'Weight × Reps' },
    { value_1_type: 'duration_s' as const, value_2_type: 'distance_m' as const, label: 'Duration × Distance' },
    { value_1_type: 'reps' as const, value_2_type: null, label: 'Reps Only' },
    { value_1_type: 'duration_s' as const, value_2_type: null, label: 'Duration Only' },
  ],
} as const

interface ExerciseTemplate {
  template_id: string
  name: string
  muscle_groups: string[]
  equipment: string
  equipment_id?: string
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
  value_1_type?: SetValueType
  value_1_default?: string
  value_2_type?: SetValueType
  value_2_default?: string
  order: number
  notes?: string
}

interface WorkoutTemplate {
  template_id: string
  name: string
  description?: string
  scope: 'user' | 'tenant' | 'system'
  exercises?: TemplateExercise[]
  exercise_count?: number
  created_by_name?: string
  created_by_lastname?: string
  created_at?: string
  updated_at?: string
}

interface TemplateFormData {
  name: string
  description: string
  scope: 'user' | 'tenant' | 'system'
  exercises: TemplateExercise[]
}



const CATEGORY_COLORS = {
  strength: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  cardio: 'bg-green-500/20 text-green-400 border-green-500/30',
  hybrid: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
}

const SCOPE_COLORS = {
  user: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  tenant: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  system: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
}

const SCOPE_LABELS = {
  user: 'Personal',
  tenant: 'Organization',
  system: 'System'
}

// Sortable Exercise Item Component
interface SortableExerciseItemProps {
  exercise: TemplateExercise
  index: number
  updateExercise: (index: number, exercise: TemplateExercise) => void
  removeExercise: (index: number) => void
  moveExerciseUp: (index: number) => void
  moveExerciseDown: (index: number) => void
  isFirst: boolean
  isLast: boolean
}

function SortableExerciseItem({
  exercise,
  index,
  updateExercise,
  removeExercise,
  moveExerciseUp,
  moveExerciseDown,
  isFirst,
  isLast
}: SortableExerciseItemProps) {
  // Temporarily disabled drag-and-drop - using mock values
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = {
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
  }

  const style = {
    // transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-gray-600 rounded-lg p-4 bg-gray-750 ${
        isDragging ? 'opacity-50 z-50' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-300"
            title="Drag to reorder"
          >
            <Bars3Icon className="w-5 h-5" />
          </div>
          
          {/* Exercise Name Input */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Exercise Name
            </label>
            <input
              type="text"
              value={exercise.name}
              onChange={(e) => updateExercise(index, { ...exercise, name: e.target.value })}
              placeholder="e.g., Bench Press"
              className="block w-full h-10 px-3 rounded-lg border-gray-600 bg-gray-700 text-white text-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        
        {/* Arrow Controls and Remove Button */}
        <div className="flex items-center space-x-1 ml-3">
          {/* Move Up Button */}
          <button
            onClick={() => moveExerciseUp(index)}
            disabled={isFirst}
            className="p-2 text-gray-400 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 rounded-lg transition-colors"
            title="Move up"
          >
            <ChevronUpIcon className="w-4 h-4" />
          </button>
          
          {/* Move Down Button */}
          <button
            onClick={() => moveExerciseDown(index)}
            disabled={isLast}
            className="p-2 text-gray-400 hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600 rounded-lg transition-colors"
            title="Move down"
          >
            <ChevronDownIcon className="w-4 h-4" />
          </button>
          
          {/* Remove Button */}
          <button
            onClick={() => removeExercise(index)}
            className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
            title="Remove exercise"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Category
          </label>
          <select
            value={exercise.category}
            onChange={(e) => updateExercise(index, { ...exercise, category: e.target.value as any })}
            className="block w-full h-10 px-3 rounded-lg border-gray-600 bg-gray-700 text-white text-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="strength">Strength</option>
            <option value="cardio">Cardio</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Sets
          </label>
          <input
            type="number"
            value={exercise.sets}
            onChange={(e) => updateExercise(index, { ...exercise, sets: parseInt(e.target.value) || 1 })}
            placeholder="3"
            min="1"
            max="20"
            className="block w-full h-10 px-3 rounded-lg border-gray-600 bg-gray-700 text-white text-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Value Type Configuration */}
      <div className="mt-3 space-y-3">
        <h5 className="text-sm font-medium text-gray-300">Set Values</h5>
        
        {/* Value 1 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Value 1 Type
            </label>
            <select
              value={exercise.value_1_type || ''}
              onChange={(e) => updateExercise(index, {
                ...exercise, 
                value_1_type: e.target.value as SetValueType || undefined,
                value_1_default: e.target.value ? exercise.value_1_default || '' : undefined
              })}
              className="block w-full h-9 px-2 rounded-lg border-gray-600 bg-gray-700 text-white text-xs focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">None</option>
              {Object.entries(VALUE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Default Value
            </label>
            <input
              type="text"
              value={exercise.value_1_default || ''}
              onChange={(e) => updateExercise(index, { ...exercise, value_1_default: e.target.value })}
              placeholder={exercise.value_1_type ? VALUE_TYPE_PLACEHOLDERS[exercise.value_1_type] : 'Select type first'}
              disabled={!exercise.value_1_type}
              className="block w-full h-9 px-2 rounded-lg border-gray-600 bg-gray-700 text-white text-xs focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Value 2 */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Value 2 Type
            </label>
            <select
              value={exercise.value_2_type || ''}
              onChange={(e) => updateExercise(index, { 
                ...exercise, 
                value_2_type: e.target.value as SetValueType || undefined,
                value_2_default: e.target.value ? exercise.value_2_default || '' : undefined
              })}
              className="block w-full h-9 px-2 rounded-lg border-gray-600 bg-gray-700 text-white text-xs focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">None</option>
              {Object.entries(VALUE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">
              Default Value
            </label>
            <input
              type="text"
              value={exercise.value_2_default || ''}
              onChange={(e) => updateExercise(index, { ...exercise, value_2_default: e.target.value })}
              placeholder={exercise.value_2_type ? VALUE_TYPE_PLACEHOLDERS[exercise.value_2_type] : 'Select type first'}
              disabled={!exercise.value_2_type}
              className="block w-full h-9 px-2 rounded-lg border-gray-600 bg-gray-700 text-white text-xs focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Quick preset buttons for common combinations */}
        <div className="mt-2">
          <label className="block text-xs font-medium text-gray-400 mb-1">
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
                className="text-xs px-2 py-1 bg-blue-900 text-blue-200 rounded-md hover:bg-blue-800 transition-colors"
              >
                {combo.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminTemplatesPage() {
  const { user } = useAuth()
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedScope, setSelectedScope] = useState<'all' | 'user' | 'tenant' | 'system'>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<WorkoutTemplate | null>(null)
  const [viewingTemplate, setViewingTemplate] = useState<WorkoutTemplate | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<WorkoutTemplate | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // API state management
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Exercise template state
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([])
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [showCustomExerciseModal, setShowCustomExerciseModal] = useState(false)
  const [isCreatingExercise, setIsCreatingExercise] = useState(false)
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    scope: 'tenant',
    exercises: []
  })

  // Check admin permissions with better error handling
  if (!user) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              Loading...
            </h1>
            <p className="text-gray-400">
              Please wait while we verify your authentication.
            </p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!['tenant_admin', 'org_admin', 'system_admin'].includes(user.role)) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">
              Access Denied
            </h1>
            <p className="text-gray-400">
              You need admin permissions to manage workout templates.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Current role: {user.role}
            </p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesScope = selectedScope === 'all' || template.scope === selectedScope
    return matchesSearch && matchesScope
  })

  // Load templates from API instead of mock data
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Check if we're in the browser environment and have a token
        if (typeof window === 'undefined') {
          setError('Not in browser environment')
          setIsLoading(false)
          return
        }

        const token = localStorage.getItem('admin_token')
        if (!token) {
          setError('No authentication token found')
          setIsLoading(false)
          return
        }

        // For system admins, we should fetch ALL templates across all tenants
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.rythm.training'}/api/trpc/admin.getAllWorkoutTemplates?input=${encodeURIComponent(JSON.stringify({
          limit: 100,
          offset: 0,
          search: searchTerm || undefined,
          scope: selectedScope === 'all' ? undefined : selectedScope
        }))}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`)
        }

        const data = await response.json()
        
        // Transform API response to match our interface
        const apiTemplates: WorkoutTemplate[] = (data.result?.data || []).map((template: any) => ({
          template_id: template.template_id,
          name: template.name,
          description: template.description,
          scope: template.scope,
          exercises: template.exercises || [],
          exercise_count: template.exercise_count || 0,
          created_by_name: template.created_by_name,
          created_by_lastname: template.created_by_lastname,
          created_at: template.created_at,
          updated_at: template.updated_at,
        }))

        setTemplates(apiTemplates)
        setIsLoading(false)
      } catch (err) {
        console.error('Error loading templates:', err)
        
        if (err instanceof Error && err.message.includes('401')) {
          setError('Authentication required. Please log in.')
        } else {
          setError('Failed to load templates from API. Please check your connection and try again.')
        }
        
        // Don't fall back to mock data - show empty state instead
        setTemplates([])
        setIsLoading(false)
      }
    }

    fetchTemplates()
  }, [searchTerm, selectedScope]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch exercise templates for adding to workout templates
  useEffect(() => {
    const fetchExerciseTemplates = async () => {
      try {
        // Get auth token for API call
        const token = localStorage.getItem('admin_token')
        if (!token) {
          console.warn('No admin token found, using empty exercise templates')
          setExerciseTemplates([])
          return
        }

        // Fetch exercise templates from API using admin endpoint
        const queryParams = encodeURIComponent(JSON.stringify({
          limit: 200, // Get a large number of templates
        }))
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.rythm.training'}/api/trpc/admin.getExerciseTemplates?input=${queryParams}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch exercise templates: ${response.status}`)
        }

        const data = await response.json()
        const templates = data.result.data.exerciseTemplates // Admin endpoint returns exerciseTemplates array

        // Transform API response to match our ExerciseTemplate interface
        const exerciseTemplates: ExerciseTemplate[] = templates.map((template: any) => ({
          template_id: template.template_id,
          name: template.name,
          muscle_groups: template.muscle_groups || [],
          equipment: template.equipment || '',
          exercise_category: template.exercise_category || 'strength',
          exercise_type: template.exercise_type || 'STRENGTH',
          default_value_1_type: template.default_value_1_type || 'weight_kg',
          default_value_2_type: template.default_value_2_type || 'reps',
          description: template.description || '',
          instructions: template.instructions || '',
        }))

        setExerciseTemplates(exerciseTemplates)
      } catch (error) {
        console.error('Error loading exercise templates:', error)
        // Fallback to empty array if API fails
        setExerciseTemplates([])
      }
    }

    fetchExerciseTemplates()
  }, [])

  const getTemplateIcon = (scope: string) => {
    switch (scope) {
      case 'system':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        )
      case 'tenant':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
    }
  }

  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setFormData({
      name: '',
      description: '',
      scope: 'tenant',
      exercises: []
    })
    setShowCreateModal(true)
  }

  const handleEditTemplate = (template: WorkoutTemplate) => {
    setFormData({
      name: template.name,
      description: template.description || '',
      scope: template.scope as 'user' | 'tenant' | 'system',
      exercises: template.exercises || []
    })
    setEditingTemplate(template)
    setShowCreateModal(true)
  }

  const handleViewTemplate = (template: WorkoutTemplate) => {
    setViewingTemplate(template)
  }

  const handleDeleteTemplate = (template: WorkoutTemplate) => {
    setShowDeleteModal(template)
  }

  const confirmDelete = async () => {
    if (!showDeleteModal) return
    
    setIsDeleting(true)
    setDeleteError(null)
    
    try {
      // Check if we're in the browser environment and have a token
      if (typeof window === 'undefined') {
        throw new Error('Not in browser environment')
      }

      const token = localStorage.getItem('admin_token')
      if (!token) {
        throw new Error('No admin token found')
      }

      console.log('Attempting to delete template:', showDeleteModal.template_id)

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.rythm.training'}/api/trpc/workoutTemplates.delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          templateId: showDeleteModal.template_id
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Delete failed:', response.status, errorText)
        
        if (response.status === 403) {
          throw new Error('You do not have permission to delete this template')
        } else if (response.status === 404) {
          throw new Error('Template not found')
        } else {
          throw new Error(`Failed to delete template (${response.status})`)
        }
      }

      const result = await response.json()
      console.log('Delete response:', result)

      // Remove the template from the local state
      setTemplates(prev => prev.filter(t => t.template_id !== showDeleteModal.template_id))
      setShowDeleteModal(null)
      
      console.log('Template deleted successfully')
    } catch (error) {
      console.error('Error deleting template:', error)
      setDeleteError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmitTemplate = async () => {
    if (!formData.name.trim()) return

    try {
      // Check if we're in the browser environment and have a token
      if (typeof window === 'undefined') {
        console.error('Not in browser environment')
        return
      }

      const token = localStorage.getItem('admin_token')
      if (!token) {
        console.error('No authentication token found')
        return
      }

      // Prepare the template data for API
      console.log('🔍 FormData before sending:', {
        name: formData.name,
        scope: formData.scope,
        scopeType: typeof formData.scope,
        description: formData.description,
        exerciseCount: formData.exercises.length
      });
      
      const templateData = {
        name: formData.name,
        description: formData.description || undefined,
        scope: formData.scope,
        exercises: formData.exercises.map(exercise => {
          const exerciseData: any = {
            name: exercise.name,
            category: exercise.category,
            muscle_groups: exercise.muscle_groups || [],
            sets: exercise.sets,
            value_1_type: exercise.value_1_type,
            value_1_default: exercise.value_1_default,
            value_2_type: exercise.value_2_type,
            value_2_default: exercise.value_2_default,
            notes: exercise.notes || '',
            order: exercise.order || 0,
          }
          
          // Only include exercise_id if it exists and is a valid UUID
          if (exercise.exercise_id && exercise.exercise_id.length > 10) {
            exerciseData.exercise_id = exercise.exercise_id
          }
          
          return exerciseData
        })
      }

      console.log('Sending template data:', templateData)
      console.log('🔍 TemplateData scope check:', {
        scope: templateData.scope,
        scopeType: typeof templateData.scope,
        scopeExists: 'scope' in templateData,
        templateDataKeys: Object.keys(templateData)
      });

      let response
      if (editingTemplate) {
        // Update existing template - explicitly include all fields and ensure scope is not undefined
        const updateData = {
          template_id: editingTemplate.template_id,
          name: templateData.name,
          description: templateData.description,
          scope: formData.scope, // Use formData.scope directly instead of templateData.scope
          exercises: templateData.exercises
        };
        
        console.log('🔄 Update request data:', updateData);
        console.log('🔄 Update request JSON:', JSON.stringify(updateData));
        console.log('🔄 FormData scope direct:', formData.scope);
        
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.rythm.training'}/api/trpc/workoutTemplates.update`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        })
      } else {
        // Create new template
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.rythm.training'}/api/trpc/workoutTemplates.create`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(templateData),
        })
      }

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      const result = await response.json()
      console.log('Template saved successfully:', result)

      setShowCreateModal(false)
      setEditingTemplate(null)
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        scope: 'user' as const,
        exercises: []
      })

      // Trigger templates refresh by updating searchTerm temporarily
      const currentSearchTerm = searchTerm
      setSearchTerm(currentSearchTerm + ' ')
      setTimeout(() => setSearchTerm(currentSearchTerm), 100)

    } catch (error) {
      console.error('Error saving template:', error)
      alert('Failed to save template. Please try again.')
    }
  }

  // Exercise management functions
  const addExerciseToTemplate = async (exerciseName: string) => {
    // First try to find the exercise in templates
    const template = exerciseTemplates.find(t => t.name === exerciseName)
    
    let exerciseData: TemplateExercise
    
    if (template) {
      // Use existing template data
      exerciseData = {
        exercise_id: template.template_id,
        name: template.name,
        category: template.exercise_category === 'cardio' ? 'cardio' : 'strength',
        muscle_groups: template.muscle_groups,
        sets: 3,
        value_1_type: template.default_value_1_type as SetValueType,
        value_1_default: getDefaultValue(template.default_value_1_type, template.exercise_type),
        value_2_type: template.default_value_2_type as SetValueType,
        value_2_default: getDefaultValue(template.default_value_2_type, template.exercise_type),
        order: formData.exercises.length,
        notes: ''
      }
    } else {
      // Create custom exercise
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

  const getDefaultValue = (valueType: string, exerciseType: string) => {
    switch (valueType) {
      case 'weight_kg':
        return '75'
      case 'reps':
        return '8-10'
      case 'duration_s':
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
      // Get auth token for API call
      const token = localStorage.getItem('admin_token')
      if (!token) {
        alert('Authentication required. Please login again.')
        return
      }

      // Save custom exercise to exercise_templates database first using admin endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.rythm.training'}/api/trpc/admin.createExerciseTemplate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: exerciseData.name,
          muscle_groups: exerciseData.muscle_groups || [],
          equipment: exerciseData.equipment || '',
          equipment_id: exerciseData.equipment_id || null,
          exercise_category: exerciseData.exercise_category || 'strength',
          exercise_type: exerciseData.exercise_type || 'STRENGTH',
          default_value_1_type: exerciseData.default_value_1_type || 'weight_kg',
          default_value_2_type: exerciseData.default_value_2_type || 'reps',
          description: exerciseData.description || '',
          instructions: exerciseData.instructions || '',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || `Failed to save exercise template: ${response.status}`)
      }

      const savedTemplate = await response.json()
      
      // Create the template object for local state
      const newTemplate: ExerciseTemplate = {
        template_id: savedTemplate.result.data.template_id,
        name: savedTemplate.result.data.name,
        muscle_groups: savedTemplate.result.data.muscle_groups,
        equipment: savedTemplate.result.data.equipment,
        equipment_id: savedTemplate.result.data.equipment_id,
        exercise_category: savedTemplate.result.data.exercise_category,
        exercise_type: savedTemplate.result.data.exercise_type,
        default_value_1_type: savedTemplate.result.data.default_value_1_type,
        default_value_2_type: savedTemplate.result.data.default_value_2_type,
        description: savedTemplate.result.data.description,
        instructions: savedTemplate.result.data.instructions,
      }
      
      // Update local state with the saved template
      setExerciseTemplates(prev => [...prev, newTemplate])
      
      // Add the exercise to the workout template
      addExerciseToTemplate(newTemplate.name)
      setShowCustomExerciseModal(false)
    } catch (error) {
      console.error('Error creating custom exercise:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create custom exercise. Please try again.'
      alert(errorMessage)
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
      exercises: prev.exercises.filter((_, i) => i !== index)
    }))
  }

  // Arrow control functions for reordering
  const moveExerciseUp = (index: number) => {
    if (index === 0) return
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises.slice(0, index - 1), prev.exercises[index], prev.exercises[index - 1], ...prev.exercises.slice(index + 1)]
    }))
  }

  const moveExerciseDown = (index: number) => {
    if (index === formData.exercises.length - 1) return
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises.slice(0, index), prev.exercises[index + 1], prev.exercises[index], ...prev.exercises.slice(index + 2)]
    }))
  }

  // Temporarily disabled drag-and-drop sensors
  // const sensors = useSensors(
  //   useSensor(PointerSensor),
  //   useSensor(KeyboardSensor, {
  //     coordinateGetter: sortableKeyboardCoordinates,
  //   })
  // )

  // Handle drag end
  // const handleDragEnd = (event: DragEndEvent) => {
  //   const { active, over } = event

  //   if (active.id !== over?.id) {
  //     const oldIndex = formData.exercises.findIndex((_, i) => `exercise-${i}` === active.id)
  //     const newIndex = formData.exercises.findIndex((_, i) => `exercise-${i}` === over?.id)

  //     if (oldIndex !== -1 && newIndex !== -1) {
  //       setFormData(prev => ({
  //         ...prev,
  //         exercises: arrayMove(prev.exercises, oldIndex, newIndex)
  //       }))
  //     }
  //   }
  // }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Workout Templates
            </h1>
            <p className="mt-2 text-gray-400">
              Create, manage, and monitor workout templates across all organizations.
            </p>
            {error && error.includes('Authentication') && (
              <p className="text-yellow-400 text-sm mt-1">
                ⚠️ Please log in as orchestrator@rythm.app to see all templates from all users and organizations
              </p>
            )}
            {!error && !isLoading && templates.length > 0 && (
              <p className="text-green-400 text-sm mt-1">
                ✅ Showing {templates.length} templates from all organizations and users
              </p>
            )}
          </div>
          {(['org_admin', 'tenant_admin', 'system_admin'].includes(user.role)) && (
            <button
              onClick={handleCreateTemplate}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              <PlusIcon className="w-4 h-4 mr-2 inline" />
              Create New Template
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Templates"
            value={templates?.length?.toString() || '0'}
            change="+8%"
            changeType="positive"
            gradient="from-blue-500 to-blue-600"
            icon={
              <ClipboardDocumentIcon className="w-6 h-6" />
            }
          />
          <StatsCard
            title="Active Templates"
            value={templates?.filter(t => t.scope !== 'user')?.length?.toString() || '0'}
            change="+12%"
            changeType="positive"
            gradient="from-green-500 to-emerald-600"
            icon={
              <CheckIcon className="w-6 h-6" />
            }
          />
          <StatsCard
            title="Exercise Count"
            value={templates?.reduce((sum, t) => sum + (t.exercise_count || 0), 0)?.toString() || '0'}
            change="+15%"
            changeType="positive"
            gradient="from-purple-500 to-pink-600"
            icon={
              <SparklesIcon className="w-6 h-6" />
            }
          />
          <StatsCard
            title="Avg. Exercises"
            value={Math.round(templates?.reduce((sum, t) => sum + (t.exercise_count || 0), 0) / Math.max(templates?.length || 1, 1))?.toString() || '0'}
            change="+2%"
            changeType="positive"
            gradient="from-orange-500 to-red-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-lg border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value as any)}
              className="block w-full rounded-lg border-gray-600 bg-gray-800 text-white focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="all">All Scopes</option>
              <option value="user">Personal Templates</option>
              <option value="tenant">Organization Templates</option>
              {(['org_admin', 'system_admin'].includes(user.role)) && <option value="system">System Templates</option>}
            </select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 mb-4">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400 mb-4" />
              <h3 className="text-lg font-medium text-red-400 mb-2">
                Unable to Load Templates
              </h3>
              <p className="text-red-400 mb-4">
                {error}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardDocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-white">
              No templates found
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Get started by creating your first workout template
            </p>
            {(['org_admin', 'tenant_admin', 'system_admin'].includes(user.role)) && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div key={template.template_id} className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6 hover:shadow-2xl transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg text-white">
                      {getTemplateIcon(template.scope)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {template.exercise_count || 0} exercises
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border capitalize ${SCOPE_COLORS[template.scope]}`}>
                    {SCOPE_LABELS[template.scope]}
                  </span>
                </div>

                {template.description && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Created by</span>
                    <span className="text-white text-sm">
                      {template.created_by_name} {template.created_by_lastname}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Created</span>
                    <span className="text-gray-300">
                      {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleViewTemplate(template)}
                      className="flex-1 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors duration-200 text-sm"
                    >
                      View Details
                    </button>
                    {(template.scope !== 'user' || ['org_admin', 'system_admin'].includes(user.role)) && (
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors duration-200 text-sm"
                      >
                        Edit
                      </button>
                    )}
                    {(['org_admin', 'tenant_admin', 'system_admin'].includes(user.role)) && (
                      <button
                        onClick={() => handleDeleteTemplate(template)}
                        className="px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors duration-200 text-sm"
                        title="Delete template"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Comprehensive Create/Edit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-4">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateModal(false)} />
              
              <div className="relative bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="bg-gray-800 px-6 py-4 border-b border-gray-700 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-white">
                      {editingTemplate ? 'Edit Template' : 'Create New Template'}
                    </h3>
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto bg-gray-800">
                  <div className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Template Name *
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter template name"
                          className="block w-full h-10 px-3 rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Scope
                        </label>
                        <select
                          value={formData.scope}
                          onChange={(e) => {
                            console.log('🔄 Scope changed:', e.target.value);
                            setFormData(prev => ({ ...prev, scope: e.target.value as 'user' | 'tenant' | 'system' }));
                          }}
                          className="block w-full h-10 px-3 rounded-lg border-gray-600 bg-gray-700 text-white focus:border-blue-500 focus:ring-blue-500"
                        >
                          <option value="user">User</option>
                          <option value="tenant">Organization</option>
                          {(['org_admin', 'system_admin'].includes(user.role)) && <option value="system">System</option>}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description (optional)
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe this template"
                        rows={3}
                        className="block w-full px-3 py-2 rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    {/* Exercises Section */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-medium text-white">
                          Exercises ({formData.exercises.length})
                        </h4>
                        <button
                          onClick={() => setShowExerciseModal(true)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors border border-blue-500/30"
                        >
                          <PlusIcon className="w-4 h-4 mr-1" />
                          Add Exercise
                        </button>
                      </div>
                      
                      {formData.exercises.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-600 rounded-lg">
                          <ClipboardDocumentIcon className="mx-auto h-12 w-12 text-gray-500" />
                          <h3 className="mt-2 text-sm font-medium text-white">No exercises</h3>
                          <p className="mt-1 text-sm text-gray-400">
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
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {/* Temporarily using simple list instead of drag-and-drop */}
                          {formData.exercises.map((exercise, index) => (
                            <SortableExerciseItem
                              key={index}
                              exercise={exercise}
                              index={index}
                              updateExercise={updateExercise}
                              removeExercise={removeExercise}
                              moveExerciseUp={moveExerciseUp}
                              moveExerciseDown={moveExerciseDown}
                              isFirst={index === 0}
                              isLast={index === formData.exercises.length - 1}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="bg-gray-700 px-6 py-4 flex flex-col sm:flex-row sm:justify-end gap-3 flex-shrink-0">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-3 min-h-[48px] border border-gray-600 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitTemplate}
                    disabled={!formData.name.trim()}
                    className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-3 min-h-[48px] border border-transparent text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <CheckIcon className="w-4 h-4 mr-2" />
                    {editingTemplate ? 'Update Template' : 'Create Template'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Simple View Modal */}
        {viewingTemplate && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-4">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setViewingTemplate(null)} />
              
              <div className="relative bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-2xl w-full">
                <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">
                      {viewingTemplate.name}
                    </h3>
                    <button
                      onClick={() => setViewingTemplate(null)}
                      className="text-gray-400 hover:text-gray-300"
                    >
                      <XMarkIcon className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    {viewingTemplate.description && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-300">Description</h4>
                        <p className="text-sm text-gray-400 mt-1">
                          {viewingTemplate.description}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">
                        Exercises ({viewingTemplate.exercises?.length || 0})
                      </h4>
                      {viewingTemplate.exercises && viewingTemplate.exercises.length > 0 ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {viewingTemplate.exercises.map((exercise, index) => (
                            <div key={index} className="border border-gray-600 rounded-md p-3">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium text-white">
                                  {exercise.name}
                                </h5>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${CATEGORY_COLORS[exercise.category]}`}>
                                  {exercise.category}
                                </span>
                              </div>
                              <div className="text-sm text-gray-400 mt-1">
                                {exercise.sets} sets
                                {exercise.value_1_type && exercise.value_1_default && (
                                  <span> • {exercise.value_1_default} {VALUE_TYPE_UNITS[exercise.value_1_type]}</span>
                                )}
                                {exercise.value_2_type && exercise.value_2_default && (
                                  <span> × {exercise.value_2_default} {VALUE_TYPE_UNITS[exercise.value_2_type]}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No exercises defined</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={() => setViewingTemplate(null)}
                    className="w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
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
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-4">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => !isDeleting && setShowDeleteModal(null)} />
              
              <div className="relative bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full">
                <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900 sm:mx-0 sm:h-10 sm:w-10">
                      <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-white">
                        Delete Template
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-400">
                          Are you sure you want to delete "{showDeleteModal.name}"? This action cannot be undone.
                        </p>
                        {deleteError && (
                          <p className="mt-2 text-sm text-red-400">
                            {deleteError}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteModal(null)
                      setDeleteError(null)
                    }}
                    disabled={isDeleting}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-gray-300 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
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
    </AdminLayout>
  )
}