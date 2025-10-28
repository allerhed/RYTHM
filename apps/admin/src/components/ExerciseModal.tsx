'use client'

import { useState, useEffect } from 'react'
import { apiClient, type ExerciseTemplate, type Equipment } from '@/lib/api'
import { toast } from 'react-hot-toast'

interface ExerciseModalProps {
  exerciseTemplate?: ExerciseTemplate | null
  onSave: () => void
  onClose: () => void
}

interface EquipmentOption {
  equipment_id: string
  name: string
  category: string
}

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'abs', 'core', 'quads', 'hamstrings', 'glutes', 'calves',
  'legs', 'full body', 'cardio'
]

const EXERCISE_CATEGORIES = [
  'strength', 'cardio', 'flexibility', 'mobility', 'sports', 'other'
]

const EXERCISE_TYPES = [
  { value: 'STRENGTH', label: 'Strength' },
  { value: 'CARDIO', label: 'Cardio' }
]

const VALUE_TYPES = [
  'weight_kg', 'distance_m', 'duration_m', 'calories', 'reps'
]

export function ExerciseModal({ exerciseTemplate, onSave, onClose }: ExerciseModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    muscle_groups: [] as string[],
    equipment: '',
    equipment_id: '',
    exercise_category: 'strength',
    exercise_type: 'STRENGTH' as 'STRENGTH' | 'CARDIO',
    default_value_1_type: 'weight_kg',
    default_value_2_type: 'reps',
    description: '',
    instructions: ''
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [equipmentOptions, setEquipmentOptions] = useState<Equipment[]>([])
  const [loadingEquipment, setLoadingEquipment] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load equipment options on component mount
  useEffect(() => {
    const loadEquipment = async () => {
      try {
        setLoadingEquipment(true)
        const response = await apiClient.admin.getEquipment()
        setEquipmentOptions(response.equipment || [])
      } catch (error) {
        console.error('Failed to load equipment:', error)
        toast.error('Failed to load equipment options')
      } finally {
        setLoadingEquipment(false)
      }
    }

    loadEquipment()
  }, [])

  useEffect(() => {
    if (exerciseTemplate) {
      setFormData({
        name: exerciseTemplate.name,
        muscle_groups: exerciseTemplate.muscle_groups,
        equipment: exerciseTemplate.equipment || '',
        equipment_id: exerciseTemplate.equipment_id || '',
        exercise_category: exerciseTemplate.exercise_category,
        exercise_type: exerciseTemplate.exercise_type,
        default_value_1_type: exerciseTemplate.default_value_1_type,
        default_value_2_type: exerciseTemplate.default_value_2_type || '',
        description: exerciseTemplate.description || '',
        instructions: exerciseTemplate.instructions || ''
      })
    }
  }, [exerciseTemplate])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Exercise name is required'
    }

    if (formData.muscle_groups.length === 0) {
      newErrors.muscle_groups = 'At least one muscle group is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    
    try {
      if (exerciseTemplate) {
        // Update existing exercise template
        await apiClient.admin.updateExerciseTemplate({
          template_id: exerciseTemplate.template_id,
          ...formData
        })
        toast.success('Exercise template updated successfully')
      } else {
        // Create new exercise template
        await apiClient.admin.createExerciseTemplate(formData)
        toast.success('Exercise template created successfully')
      }
      
      onSave()
    } catch (error: any) {
      console.error('Error saving exercise template:', error)
      toast.error(error.message || 'Failed to save exercise template')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMuscleGroupToggle = (muscleGroup: string) => {
    setFormData(prev => ({
      ...prev,
      muscle_groups: prev.muscle_groups.includes(muscleGroup)
        ? prev.muscle_groups.filter(mg => mg !== muscleGroup)
        : [...prev.muscle_groups, muscleGroup]
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-xl shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto border border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">
                {exerciseTemplate ? 'Edit Exercise Template' : 'New Exercise Template'}
              </h2>
              <p className="text-sm text-gray-400">
                {exerciseTemplate ? 'Update the exercise template details' : 'Create a new exercise template for the library'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form p-6 space-y-6">
          {/* Exercise Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Exercise Template Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-gray-100 placeholder-gray-400 transition-colors duration-200 ${
                errors.name ? 'border-red-500' : 'border-gray-600'
              }`}
              placeholder="Enter exercise template name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
          </div>

          {/* Exercise Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Exercise Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              {EXERCISE_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, exercise_type: type.value as 'STRENGTH' | 'CARDIO' }))}
                  className={`px-4 py-3 border rounded-lg font-medium transition-all duration-200 ${
                    formData.exercise_type === type.value
                      ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-orange-500 shadow-lg'
                      : 'border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-gray-500'
                  }`}
                  disabled={isLoading}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Exercise Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={formData.exercise_category}
              onChange={(e) => setFormData(prev => ({ ...prev, exercise_category: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-gray-100 transition-colors duration-200"
            >
              {EXERCISE_CATEGORIES.map(category => (
                <option key={category} value={category} className="bg-gray-700 text-gray-100">
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Muscle Groups */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Muscle Groups *
            </label>
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-600 rounded-lg p-4 bg-gray-750">
              {MUSCLE_GROUPS.map(muscleGroup => (
                <label key={muscleGroup} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.muscle_groups.includes(muscleGroup)}
                    onChange={() => handleMuscleGroupToggle(muscleGroup)}
                    className="rounded border-gray-500 text-orange-600 focus:ring-orange-500 focus:ring-2 bg-gray-700"
                    disabled={isLoading}
                  />
                  <span className="text-gray-300 capitalize">
                    {muscleGroup}
                  </span>
                </label>
              ))}
            </div>
            {errors.muscle_groups && (
              <p className="mt-1 text-sm text-red-400">{errors.muscle_groups}</p>
            )}
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Equipment
            </label>
            <select
              value={formData.equipment_id}
              onChange={(e) => {
                const selectedEquipment = equipmentOptions.find(eq => eq.equipment_id === e.target.value)
                setFormData(prev => ({ 
                  ...prev, 
                  equipment_id: e.target.value,
                  equipment: selectedEquipment?.name || ''
                }))
              }}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-gray-100 transition-colors duration-200"
              disabled={loadingEquipment || isLoading}
            >
              <option value="" className="bg-gray-700 text-gray-100">Select equipment (optional)</option>
              {equipmentOptions.map((equipment: Equipment) => (
                <option key={equipment.equipment_id} value={equipment.equipment_id} className="bg-gray-700 text-gray-100">
                  {equipment.name} ({equipment.category})
                </option>
              ))}
            </select>
            {loadingEquipment && (
              <p className="mt-1 text-sm text-gray-400 flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading equipment options...
              </p>
            )}
          </div>

          {/* Default Value Types */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Primary Value Type
              </label>
              <select
                value={formData.default_value_1_type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  default_value_1_type: e.target.value 
                }))}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-gray-100 transition-colors duration-200"
                disabled={isLoading}
              >
                {VALUE_TYPES.map(type => (
                  <option key={type} value={type} className="bg-gray-700 text-gray-100">
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Secondary Value Type
              </label>
              <select
                value={formData.default_value_2_type}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  default_value_2_type: e.target.value 
                }))}
                className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-gray-100 transition-colors duration-200"
                disabled={isLoading}
              >
                {VALUE_TYPES.map(type => (
                  <option key={type} value={type} className="bg-gray-700 text-gray-100">
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-gray-100 placeholder-gray-400 resize-none transition-colors duration-200"
              placeholder="Brief description of the exercise"
              disabled={isLoading}
            />
          </div>

          {/* Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Instructions
            </label>
            <textarea
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              rows={4}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-gray-100 placeholder-gray-400 resize-none transition-colors duration-200"
              placeholder="Detailed instructions on how to perform the exercise"
              disabled={isLoading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:text-white hover:bg-gray-700 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={exerciseTemplate ? "M5 13l4 4L19 7" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
                  </svg>
                  {exerciseTemplate ? 'Update Template' : 'Create Template'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}