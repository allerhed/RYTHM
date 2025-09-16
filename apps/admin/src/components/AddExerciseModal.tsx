'use client'
import React, { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

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

interface AddExerciseModalProps {
  onClose: () => void
  onAddExercise: (exerciseName: string) => void
  templates: ExerciseTemplate[]
  onShowCustomModal: () => void
}

export function AddExerciseModal({
  onClose,
  onAddExercise,
  templates,
  onShowCustomModal
}: AddExerciseModalProps) {
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
      <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Add Exercise</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onShowCustomModal}
              className="text-teal-400 hover:text-teal-300 font-medium text-sm"
            >
              Custom Exercise
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-700 text-gray-100 placeholder-gray-400"
          />
        </div>

        {/* Exercise Type Filter */}
        <div className="p-4 border-b border-gray-700">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Exercise Type</h4>
          <div className="flex gap-2">
            {types.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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
        <div className="p-4 border-b border-gray-700">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Category</h4>
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">No exercises found matching your filters.</p>
              <button
                onClick={onShowCustomModal}
                className="text-teal-400 hover:text-teal-300 font-medium"
              >
                Create a custom exercise instead
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTemplates.map((template) => (
                <div
                  key={template.template_id}
                  onClick={() => onAddExercise(template.name)}
                  className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg cursor-pointer transition-colors border border-gray-600 hover:border-gray-500"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-white font-medium">{template.name}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      template.exercise_type === 'STRENGTH' 
                        ? 'bg-blue-900 text-blue-200' 
                        : 'bg-green-900 text-green-200'
                    }`}>
                      {template.exercise_type === 'STRENGTH' ? '💪 STR' : '🏃 CAR'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {template.muscle_groups.join(', ')} • {template.exercise_category}
                  </div>
                  {template.description && (
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {template.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-750">
          <div className="text-xs text-gray-400 text-center">
            {filteredTemplates.length} exercise{filteredTemplates.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>
    </div>
  )
}