'use client'
import React, { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface CustomExerciseModalProps {
  onSave: (exerciseData: {
    name: string
    exercise_category: string
    muscle_groups: string[]
    exercise_type: 'STRENGTH' | 'CARDIO'
    equipment: string
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

const EQUIPMENT_OPTIONS = [
  'barbell', 'dumbbell', 'kettlebell', 'cable', 'machine',
  'bodyweight', 'resistance band', 'medicine ball', 'suspension trainer',
  'cardio equipment', 'other'
]

const EXERCISE_CATEGORIES = [
  'strength', 'cardio', 'flexibility', 'sports'
]

const EXERCISE_TYPES = [
  { value: 'STRENGTH', label: 'Strength' },
  { value: 'CARDIO', label: 'Cardio' }
]

const VALUE_TYPES = [
  'weight_kg', 'distance_m', 'duration_s', 'calories', 'reps'
]

export function CustomExerciseModal({ onSave, onClose, loading = false }: CustomExerciseModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    exercise_type: 'STRENGTH' as 'STRENGTH' | 'CARDIO',
    exercise_category: 'strength',
    muscle_groups: [] as string[],
    equipment: '',
    default_value_1_type: 'weight_kg',
    default_value_2_type: 'reps',
    description: '',
    instructions: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

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
      default_value_1_type: formData.default_value_1_type,
      default_value_2_type: formData.default_value_2_type,
      description: formData.description.trim(),
      instructions: formData.instructions.trim(),
    }

    onSave(exerciseData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">New Exercise</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-300 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
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
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 border-gray-600 text-gray-100 ${
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
              Exercise Type
            </label>
            <select
              value={formData.exercise_type}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                exercise_type: e.target.value as 'STRENGTH' | 'CARDIO' 
              }))}
              className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
              disabled={loading}
            >
              {EXERCISE_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={formData.exercise_category}
              onChange={(e) => setFormData(prev => ({ ...prev, exercise_category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
              disabled={loading}
            >
              {EXERCISE_CATEGORIES.map(category => (
                <option key={category} value={category}>
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
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-600 rounded-md p-3 bg-gray-750">
              {MUSCLE_GROUPS.map(muscleGroup => (
                <label key={muscleGroup} className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.muscle_groups.includes(muscleGroup)}
                    onChange={() => handleMuscleGroupToggle(muscleGroup)}
                    className="rounded border-gray-500 text-blue-600 focus:ring-blue-500 bg-gray-700"
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
              value={formData.equipment}
              onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
              disabled={loading}
            >
              <option value="">Select equipment</option>
              {EQUIPMENT_OPTIONS.map(equipment => (
                <option key={equipment} value={equipment}>
                  {equipment.charAt(0).toUpperCase() + equipment.slice(1)}
                </option>
              ))}
            </select>
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
                className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
                disabled={loading}
              >
                {VALUE_TYPES.map(type => (
                  <option key={type} value={type}>
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
                className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
                disabled={loading}
              >
                {VALUE_TYPES.map(type => (
                  <option key={type} value={type}>
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
              className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
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
              className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
              placeholder="Detailed instructions on how to perform the exercise"
              disabled={loading}
            />
          </div>
        </form>
      </div>
    </div>
  )
}