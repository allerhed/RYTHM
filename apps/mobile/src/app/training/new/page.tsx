'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/Form'

interface Exercise {
  id: string
  name: string
  notes: string
  sets: WorkoutSet[]
  // Database fields
  exercise_id?: string
  muscle_groups?: string[]
  equipment?: string
  exercise_category?: string
  exercise_type?: 'STRENGTH' | 'CARDIO'
  default_value_1_type?: string
  default_value_2_type?: string
}

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

interface WorkoutSet {
  id: string
  setNumber: number
  value1Type: 'weight_kg' | 'distance_m' | 'duration_s' | 'calories' | 'reps' | null
  value1: number | null
  value2Type: 'weight_kg' | 'distance_m' | 'duration_s' | 'calories' | 'reps' | null
  value2: number | null
  notes: string
}

const VALUE_TYPES = [
  { value: 'weight_kg', label: 'KGS', unit: 'kg' },
  { value: 'duration_s', label: 'DURATION', unit: 's' },
  { value: 'distance_m', label: 'DISTANCE', unit: 'm' },
  { value: 'calories', label: 'CALORIES', unit: 'cal' },
  { value: 'reps', label: 'REPS', unit: 'reps' }
]

export default function NewWorkoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [workoutName, setWorkoutName] = useState('Hybrid')
  const [activityType, setActivityType] = useState<'strength' | 'cardio' | 'hybrid'>('strength')
  const [workoutDate, setWorkoutDate] = useState(new Date())
  const [duration, setDuration] = useState('1:42:40')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [exerciseTemplates, setExerciseTemplates] = useState<ExerciseTemplate[]>([])
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<{exerciseId: string, setId: string, field: 'value1' | 'value2'} | null>(null)

  // Fetch exercise templates on component mount
  useEffect(() => {
    fetchExerciseTemplates()
  }, [])

  const fetchExerciseTemplates = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/exercises/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      })
      if (response.ok) {
        const templates = await response.json()
        setExerciseTemplates(templates)
      }
    } catch (error) {
      console.error('Error fetching exercise templates:', error)
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown) {
        setActiveDropdown(null)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [activeDropdown])

  const addExercise = async (exerciseName: string) => {
    // First try to find the exercise in templates
    const template = exerciseTemplates.find(t => t.name === exerciseName)
    
    let exerciseData: Exercise
    
    if (template) {
      // Create exercise from template in database
      try {
        const response = await fetch(`/api/exercises/from-template/${template.template_id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ customizations: {} })
        })
        
        if (response.ok) {
          const dbExercise = await response.json()
          exerciseData = {
            id: Date.now().toString(),
            name: dbExercise.name,
            notes: '',
            sets: [createNewSetWithDefaults(1, dbExercise.default_value_1_type, dbExercise.default_value_2_type)],
            exercise_id: dbExercise.exercise_id,
            muscle_groups: dbExercise.muscle_groups,
            equipment: dbExercise.equipment,
            exercise_category: dbExercise.exercise_category,
            default_value_1_type: dbExercise.default_value_1_type,
            default_value_2_type: dbExercise.default_value_2_type
          }
        } else {
          // Fallback to template data without creating in DB
          exerciseData = {
            id: Date.now().toString(),
            name: template.name,
            notes: '',
            sets: [createNewSetWithDefaults(1, template.default_value_1_type, template.default_value_2_type)],
            muscle_groups: template.muscle_groups,
            equipment: template.equipment,
            exercise_category: template.exercise_category,
            default_value_1_type: template.default_value_1_type,
            default_value_2_type: template.default_value_2_type
          }
        }
      } catch (error) {
        console.error('Error creating exercise from template:', error)
        // Fallback to template data
        exerciseData = {
          id: Date.now().toString(),
          name: template.name,
          notes: '',
          sets: [createNewSetWithDefaults(1, template.default_value_1_type, template.default_value_2_type)],
          muscle_groups: template.muscle_groups,
          equipment: template.equipment,
          exercise_category: template.exercise_category,
          default_value_1_type: template.default_value_1_type,
          default_value_2_type: template.default_value_2_type
        }
      }
    } else {
      // Create custom exercise
      exerciseData = {
        id: Date.now().toString(),
        name: exerciseName,
        notes: '',
        sets: [createNewSet(1)]
      }
    }
    
    setExercises([...exercises, exerciseData])
    setShowExerciseModal(false)
  }

  const createNewSetWithDefaults = (setNumber: number, defaultType1?: string, defaultType2?: string): WorkoutSet => ({
    id: Date.now().toString() + setNumber,
    setNumber,
    value1Type: (defaultType1 as any) || (activityType === 'strength' ? 'weight_kg' : 'distance_m'),
    value1: 0,
    value2Type: (defaultType2 as any) || (activityType === 'strength' ? 'reps' : 'duration_s'),
    value2: 0,
    notes: ''
  })

  const createNewSet = (setNumber: number): WorkoutSet => ({
    id: Date.now().toString() + setNumber,
    setNumber,
    value1Type: activityType === 'strength' ? 'weight_kg' : 'distance_m',
    value1: 0,
    value2Type: activityType === 'strength' ? 'reps' : 'duration_s',
    value2: 0,
    notes: ''
  })

  const addSetToExercise = (exerciseId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newSetNumber = ex.sets.length + 1
        const newSet = ex.default_value_1_type && ex.default_value_2_type
          ? createNewSetWithDefaults(newSetNumber, ex.default_value_1_type, ex.default_value_2_type)
          : createNewSet(newSetNumber)
        
        return {
          ...ex,
          sets: [...ex.sets, newSet]
        }
      }
      return ex
    }))
  }

  const removeSetFromExercise = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const filteredSets = ex.sets.filter(set => set.id !== setId)
        // If this would remove the last set, don't allow it
        if (filteredSets.length === 0) {
          return ex
        }
        // Renumber the remaining sets
        const renumberedSets = filteredSets.map((set, index) => ({
          ...set,
          setNumber: index + 1
        }))
        return {
          ...ex,
          sets: renumberedSets
        }
      }
      return ex
    }))
  }

  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId))
  }

  const onValueChange = (exerciseId: string, setId: string, field: 'value1' | 'value2', value: number) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => {
            if (set.id === setId) {
              return { ...set, [field]: value }
            }
            return set
          })
        }
      }
      return ex
    }))
  }

  const onValueTypeChange = (exerciseId: string, setId: string, field: 'value1Type' | 'value2Type', type: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => {
            if (set.id === setId) {
              return { ...set, [field]: type }
            }
            return set
          })
        }
      }
      return ex
    }))
    setActiveDropdown(null)
  }

  const handleSaveWorkout = async () => {
    try {
      if (!user) {
        console.error('User not authenticated')
        return
      }

      // Convert duration string (HH:MM:SS) to seconds
      const durationParts = duration.split(':').map(part => parseInt(part))
      const durationSeconds = durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]

      // Prepare workout data for API (matching the actual database schema)
      const workoutData = {
        category: activityType,
        notes: notes,
        exercises: exercises.map(exercise => ({
          name: exercise.name,
          notes: exercise.notes,
          sets: exercise.sets.map(set => ({
            setNumber: set.setNumber,
            value1Type: set.value1Type,
            value1: set.value1?.toString() || "0",
            value2Type: set.value2Type,
            value2: set.value2?.toString() || "0",
            notes: set.notes
          }))
        }))
      }

      console.log('Saving workout:', workoutData)

      const response = await fetch('http://localhost:3001/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify(workoutData)
      })

      if (response.ok) {
        const savedWorkout = await response.json()
        console.log('Workout saved successfully:', savedWorkout)
        router.push('/dashboard')
      } else {
        const error = await response.json()
        console.error('Failed to save workout:', error)
        alert('Failed to save workout. Please try again.')
      }
    } catch (error) {
      console.error('Error saving workout:', error)
      alert('Error saving workout. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">New Workout</h1>
            <button
              onClick={handleSaveWorkout}
              className="bg-lime-400 text-black px-4 py-2 rounded-lg hover:bg-lime-500 transition-colors font-medium"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Workout Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="space-y-4">
            {/* Workout Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Workout Name
              </label>
              <input
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Activity Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Activity Type
              </label>
              <div className="flex gap-2">
                {['Strength', 'Cardio', 'Hybrid'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setActivityType(type.toLowerCase() as any)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      activityType === type.toLowerCase()
                        ? 'bg-lime-400 text-black'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Date and Duration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <button
                  onClick={() => setShowDatePicker(true)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-left bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {workoutDate.toLocaleDateString()}
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration
                </label>
                <button
                  onClick={() => setShowTimePicker(true)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-left bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  {duration}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div className="space-y-4">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onAddSet={() => addSetToExercise(exercise.id)}
              onRemoveSet={(setId) => removeSetFromExercise(exercise.id, setId)}
              onRemoveExercise={() => removeExercise(exercise.id)}
              onValueChange={(setId, field, value) => onValueChange(exercise.id, setId, field, value)}
              onValueTypeChange={(setId, field, type) => onValueTypeChange(exercise.id, setId, field, type)}
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
            />
          ))}

          {/* Add Exercise Button */}
          <button
            onClick={() => setShowExerciseModal(true)}
            className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-lime-400 hover:text-lime-600 dark:hover:text-lime-400 transition-colors"
          >
            + Add Exercise
          </button>
        </div>

        {/* Notes */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Workout Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about your workout..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
            rows={3}
          />
        </div>
      </div>

      {/* Add Exercise Modal */}
      {showExerciseModal && (
        <AddExerciseModal
          onClose={() => setShowExerciseModal(false)}
          onAddExercise={addExercise}
          templates={exerciseTemplates}
        />
      )}
    </div>
  )
}

function ExerciseCard({ 
  exercise, 
  onAddSet, 
  onRemoveSet, 
  onRemoveExercise, 
  onValueChange, 
  onValueTypeChange,
  activeDropdown,
  setActiveDropdown
}: {
  exercise: Exercise
  onAddSet: () => void
  onRemoveSet: (setId: string) => void
  onRemoveExercise: () => void
  onValueChange: (setId: string, field: 'value1' | 'value2', value: number) => void
  onValueTypeChange: (setId: string, field: 'value1Type' | 'value2Type', type: string) => void
  activeDropdown: {exerciseId: string, setId: string, field: 'value1' | 'value2'} | null
  setActiveDropdown: (dropdown: {exerciseId: string, setId: string, field: 'value1' | 'value2'} | null) => void
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{exercise.name}</h3>
          {exercise.muscle_groups && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {exercise.muscle_groups.join(', ')}
              {exercise.equipment && ` • ${exercise.equipment}`}
            </p>
          )}
        </div>
        <button
          onClick={onRemoveExercise}
          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {exercise.sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            exerciseId={exercise.id}
            onValueChange={onValueChange}
            onValueTypeChange={onValueTypeChange}
            onRemoveSet={onRemoveSet}
            isOnlySet={exercise.sets.length === 1}
            activeDropdown={activeDropdown}
            setActiveDropdown={setActiveDropdown}
          />
        ))}
        
        <button
          onClick={onAddSet}
          className="w-full py-2 text-lime-600 dark:text-lime-400 hover:text-lime-700 dark:hover:text-lime-300 font-medium"
        >
          + Add Set
        </button>
      </div>
    </div>
  )
}

function SetRow({ 
  set, 
  exerciseId,
  onValueChange, 
  onValueTypeChange, 
  onRemoveSet, 
  isOnlySet,
  activeDropdown,
  setActiveDropdown
}: {
  set: WorkoutSet
  exerciseId: string
  onValueChange: (setId: string, field: 'value1' | 'value2', value: number) => void
  onValueTypeChange: (setId: string, field: 'value1Type' | 'value2Type', type: string) => void
  onRemoveSet: (setId: string) => void
  isOnlySet: boolean
  activeDropdown: {exerciseId: string, setId: string, field: 'value1' | 'value2'} | null
  setActiveDropdown: (dropdown: {exerciseId: string, setId: string, field: 'value1' | 'value2'} | null) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-4 items-center relative px-2">
      <div className="text-center min-w-[40px]">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">SET</div>
        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {set.setNumber}
        </div>
      </div>

      {/* Value 1 */}
      <div className="relative">
        <button
          onClick={() => setActiveDropdown({exerciseId, setId: set.id, field: 'value1'})}
          className="w-full text-xs text-gray-500 dark:text-gray-400 mb-1 text-center hover:text-gray-700 dark:hover:text-gray-300"
        >
          {VALUE_TYPES.find(t => t.value === set.value1Type)?.label || 'TYPE'} ▼
        </button>
        <input
          type="number"
          value={set.value1 || ''}
          onChange={(e) => onValueChange(set.id, 'value1', Number(e.target.value))}
          className="w-full text-center py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-lime-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          placeholder="0"
        />
        
        {activeDropdown?.exerciseId === exerciseId && activeDropdown?.setId === set.id && activeDropdown?.field === 'value1' && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
            {VALUE_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => onValueTypeChange(set.id, 'value1Type', type.value)}
                className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  set.value1Type === type.value ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Value 2 */}
      <div className="relative">
        <button
          onClick={() => setActiveDropdown({exerciseId, setId: set.id, field: 'value2'})}
          className="w-full text-xs text-gray-500 dark:text-gray-400 mb-1 text-center hover:text-gray-700 dark:hover:text-gray-300"
        >
          {VALUE_TYPES.find(t => t.value === set.value2Type)?.label || 'TYPE'} ▼
        </button>
        <input
          type="number"
          value={set.value2 || ''}
          onChange={(e) => onValueChange(set.id, 'value2', Number(e.target.value))}
          className="w-full text-center py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-lime-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          placeholder="0"
        />
        
        {activeDropdown?.exerciseId === exerciseId && activeDropdown?.setId === set.id && activeDropdown?.field === 'value2' && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10">
            {VALUE_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => onValueTypeChange(set.id, 'value2Type', type.value)}
                className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  set.value2Type === type.value ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete Button */}
      <div className="text-center">
        {!isOnlySet && (
          <button
            onClick={() => onRemoveSet(set.id)}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 p-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

function AddExerciseModal({
  onClose,
  onAddExercise,
  templates
}: {
  onClose: () => void
  onAddExercise: (exerciseName: string) => void
  templates: ExerciseTemplate[]
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
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                    ? 'bg-primary-500 text-white'
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
                    ? 'bg-primary-500 text-white'
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
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
                className="mt-2 text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
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