'use client'
import React, { useState, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { apiClient } from '@/lib/api'

interface Equipment {
  equipment_id: string
  name: string
  category: string
  description?: string
  is_active: boolean
}

interface CustomExerciseModalProps {
  onSave: (exerciseData: {
    name: string
    exercise_category: string
    muscle_groups: string[]
    exercise_type: 'STRENGTH' | 'CARDIO'
    equipment: string
    equipment_id?: string
    default_value_1_type: string
    default_value_2_type: string
    description: string
    instructions: string
  }) => void
  onClose: () => void
  loading?: boolean
}

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
  'abs', 'core', 'quads', 'hamstrings', 'glutes', 'calves',
  'legs', 'full body', 'cardio'
]

const EXERCISE_CATEGORIES = [
  'strength', 'cardio', 'flexibility', 'sports'
]

const EXERCISE_TYPES = [
  { value: 'STRENGTH', label: 'Strength' },
  { value: 'CARDIO', label: 'Cardio' }
]

const VALUE_TYPES = [
  'weight_kg', 'distance_m', 'duration_m', 'calories', 'reps'
]

export function CustomExerciseModal({ onSave, onClose, loading = false }: CustomExerciseModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    exercise_type: 'STRENGTH' as 'STRENGTH' | 'CARDIO',
    exercise_category: 'strength',
    muscle_groups: [] as string[],
    equipment: '',
    equipment_id: '',
    default_value_1_type: 'weight_kg',
    default_value_2_type: 'reps',
    description: '',
    instructions: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [equipmentOptions, setEquipmentOptions] = useState<Equipment[]>([])
  const [loadingEquipment, setLoadingEquipment] = useState(true)

  // Load equipment options on component mount
  useEffect(() => {
    const loadEquipment = async () => {
      try {
        setLoadingEquipment(true)
        const response = await apiClient.admin.getEquipment()
        setEquipmentOptions(response.equipment || [])
      } catch (error) {
        console.error('Failed to load equipment:', error)
      } finally {
        setLoadingEquipment(false)
      }
    }

    loadEquipment()
  }, [])

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

  const handleMuscleGroupToggle = (muscleGroup: string) => {
    setFormData(prev => ({
      ...prev,
      muscle_groups: prev.muscle_groups.includes(muscleGroup)
        ? prev.muscle_groups.filter(mg => mg !== muscleGroup)
        : [...prev.muscle_groups, muscleGroup]
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Prepare exercise data for creation
    const exerciseData = {
      name: formData.name.trim(),
      exercise_category: formData.exercise_category,
      muscle_groups: formData.muscle_groups,
      exercise_type: formData.exercise_type,
      equipment: formData.equipment,
      equipment_id: formData.equipment_id,
      default_value_1_type: formData.default_value_1_type,
      default_value_2_type: formData.default_value_2_type,
      description: formData.description.trim(),
      instructions: formData.instructions.trim(),
    }

    onSave(exerciseData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-elevated1 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="icon-accent h-10 w-10 rounded-lg flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">New Exercise Template</h2>
              <p className="text-sm text-gray-400">Create a new exercise template for the library</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-300 disabled:opacity-50 p-2 hover:bg-gray-700 rounded-lg transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Exercise Template Name */}
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
              placeholder="Enter exercise name"
              disabled={loading}
            />
            {errors.name && <p className="text-sm text-red-400 mt-1">{errors.name}</p>}
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
                      ? 'bg-primary text-white border-primary shadow-lg'
                      : 'border-gray-600 text-gray-300 hover:text-white hover:bg-gray-700 hover:border-gray-500'
                  }`}
                  disabled={loading}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={formData.exercise_category}
              onChange={(e) => setFormData(prev => ({ ...prev, exercise_category: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-gray-700 text-gray-100 transition-colors duration-200"
              disabled={loading}
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
                    disabled={loading}
                  />
                  <span className="text-gray-300 capitalize">
                    {muscleGroup}
                  </span>
                </label>
              ))}
            </div>
            {errors.muscle_groups && <p className="text-sm text-red-400 mt-1">{errors.muscle_groups}</p>}
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
              disabled={loading || loadingEquipment}
            >
              <option value="" className="bg-gray-700 text-gray-100">Select equipment (optional)</option>
              {equipmentOptions.map((equipment: Equipment) => (
                <option key={equipment.equipment_id} value={equipment.equipment_id} className="bg-gray-700 text-gray-100">
                  {equipment.name} ({equipment.category})
                </option>
              ))}
            </select>
            {loadingEquipment && (
              <p className="text-sm text-gray-400 mt-1 flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading equipment options...
              </p>
            )}
          </div>

          {/* Value Types */}
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
                disabled={loading}
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
                disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:text-white hover:bg-gray-700 hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 btn-primary rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-lg transition-all duration-200 flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Exercise
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}