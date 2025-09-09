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
  { value: 'weight_kg', label: 'KGS', unit: 'KGS' },
  { value: 'duration_s', label: 'DURATION', unit: 'DURATION' },
  { value: 'distance_m', label: 'DISTANCE', unit: 'DISTANCE' },
  { value: 'calories', label: 'CALORIES', unit: 'CALORIES' },
  { value: 'reps', label: 'REPS', unit: 'REPS' }
]

const PERCEIVED_EXERTION_LABELS = [
  { value: 1, label: 'Very, Very Easy' },
  { value: 2, label: 'Easy' },
  { value: 3, label: 'Moderate' },
  { value: 4, label: 'Somewhat Hard' },
  { value: 5, label: 'Hard' },
  { value: 6, label: 'Harder' },
  { value: 7, label: 'Very Hard' },
  { value: 8, label: 'Extremely Hard' },
  { value: 9, label: 'Close to Max Effort' },
  { value: 10, label: 'Max Effort' }
]

export default function NewWorkoutPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [workoutName, setWorkoutName] = useState('Hybrid')
  const [activityType, setActivityType] = useState<'strength' | 'cardio' | 'hybrid'>('strength')
  const [workoutDate, setWorkoutDate] = useState(new Date())
  const [duration, setDuration] = useState('1:00:00')
  const [notes, setNotes] = useState('')
  const [trainingLoad, setTrainingLoad] = useState<number | null>(1)
  const [perceivedExertion, setPerceivedExertion] = useState<number>(1)
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
      const response = await fetch('/api/exercises/templates')
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
        const target = event.target as Element
        // Don't close if clicking inside a dropdown menu
        if (!target.closest('.dropdown-menu') && !target.closest('.dropdown-trigger')) {
          setActiveDropdown(null)
        }
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
            'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
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
        
        // If there are existing sets, copy values and types from the last set
        if (ex.sets.length > 0) {
          const lastSet = ex.sets[ex.sets.length - 1]
          const newSet: WorkoutSet = {
            id: Date.now().toString() + newSetNumber,
            setNumber: newSetNumber,
            value1Type: lastSet.value1Type,
            value1: lastSet.value1,
            value2Type: lastSet.value2Type,
            value2: lastSet.value2,
            notes: ''
          }
          
          return {
            ...ex,
            sets: [...ex.sets, newSet]
          }
        } else {
          // If no existing sets, use defaults
          const newSet = ex.default_value_1_type && ex.default_value_2_type
            ? createNewSetWithDefaults(newSetNumber, ex.default_value_1_type, ex.default_value_2_type)
            : createNewSet(newSetNumber)
          
          return {
            ...ex,
            sets: [...ex.sets, newSet]
          }
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
    console.log('🔄 onValueTypeChange called:', { exerciseId, setId, field, type })
    
    // Close dropdown first
    setActiveDropdown(null)
    
    // Update exercises state
    setExercises(prevExercises => {
      console.log('📥 Previous exercises state:', prevExercises)
      
      // Create completely new array and objects
      const newExercises = [...prevExercises]
      
      const exerciseIndex = newExercises.findIndex(ex => ex.id === exerciseId)
      if (exerciseIndex === -1) {
        console.log('❌ Exercise not found:', exerciseId)
        return prevExercises
      }
      
      console.log('🎯 Found exercise at index:', exerciseIndex, newExercises[exerciseIndex].name)
      
      const exercise = newExercises[exerciseIndex]
      const setIndex = exercise.sets.findIndex(set => set.id === setId)
      
      if (setIndex === -1) {
        console.log('❌ Set not found:', setId)
        return prevExercises
      }
      
      console.log('🎯 Found set at index:', setIndex, 'setNumber:', exercise.sets[setIndex].setNumber)
      
      // Create new exercise object with updated sets
      const newSets = [...exercise.sets]
      const oldSet = newSets[setIndex]
      
      console.log('✅ Updating set:', { 
        setId: oldSet.id, 
        setNumber: oldSet.setNumber,
        field,
        oldValue: oldSet[field], 
        newValue: type 
      })
      
      // Create completely new set object
      newSets[setIndex] = {
        ...oldSet,
        [field]: type as any
      }
      
      console.log('🔄 New set object:', newSets[setIndex])
      
      // Create new exercise object
      newExercises[exerciseIndex] = {
        ...exercise,
        sets: newSets
      }
      
      console.log('📊 Final updated exercises state:', newExercises)
      return newExercises
    })
    
    console.log('✅ onValueTypeChange completed')
  }

  const handleSaveWorkout = async () => {
    try {
      if (!user || !token) {
        console.error('User not authenticated')
        alert('Please log in again to save workouts')
        return
      }

      // Convert duration string (HH:MM:SS) to seconds
      const durationParts = duration.split(':').map(part => parseInt(part))
      const durationSeconds = durationParts[0] * 3600 + durationParts[1] * 60 + durationParts[2]

      // Prepare workout data for API (matching the actual database schema)
      const workoutData = {
        name: workoutName,
        category: activityType,
        notes: notes,
        training_load: trainingLoad,
        perceived_exertion: perceivedExertion,
        duration: duration,
        exercises: exercises.map(exercise => ({
          name: exercise.name,
          muscle_groups: exercise.muscle_groups || [],
          equipment: exercise.equipment || '',
          exercise_category: exercise.exercise_category || 'strength',
          notes: exercise.notes,
          sets: exercise.sets.map(set => ({
            set_index: set.setNumber,
            value_1_type: set.value1Type,
            value_1_numeric: set.value1?.toString() || "0",
            value_2_type: set.value2Type,
            value_2_numeric: set.value2?.toString() || "0",
            notes: set.notes
          }))
        }))
      }

      console.log('Saving workout:', workoutData)

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('auth-token')}`
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
                  {workoutDate.toLocaleDateString('sv-SE')}
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

        {/* Training Load */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Training Load
          </label>
          <input
            type="number"
            value={trainingLoad || ''}
            onChange={(e) => setTrainingLoad(e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Enter training load (optional)"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Subjective measure of workout intensity (e.g., 1-100)
          </p>
        </div>

        {/* How was your workout - Perceived Exertion */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-300 text-lg">How was your workout?</span>
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-600 dark:text-gray-300">i</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lime-400 text-xs">
                {PERCEIVED_EXERTION_LABELS[perceivedExertion - 1]?.label}
              </div>
              <div className="text-lime-400 text-xs">{perceivedExertion}/10</div>
            </div>
          </div>

          {/* Slider */}
          <div className="relative">
            <input
              type="range"
              min="1"
              max="10"
              value={perceivedExertion}
              onChange={(e) => setPerceivedExertion(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer slider-lime"
              style={{
                backgroundImage: `linear-gradient(to right, #84cc16 0%, #84cc16 ${(perceivedExertion - 1) * 11.11}%, #d1d5db ${(perceivedExertion - 1) * 11.11}%, #d1d5db 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
              <span>Resting</span>
              <span>Max Effort</span>
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
              onValueTypeChange={(exerciseId, setId, field, type) => onValueTypeChange(exerciseId, setId, field, type)}
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

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DatePickerModal
          selectedDate={workoutDate}
          onClose={() => setShowDatePicker(false)}
          onDateSelect={(date: Date) => {
            setWorkoutDate(date)
            setShowDatePicker(false)
          }}
        />
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <TimePickerModal
          duration={duration}
          onClose={() => setShowTimePicker(false)}
          onDurationSelect={(newDuration: string) => {
            setDuration(newDuration)
            setShowTimePicker(false)
          }}
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
  onValueTypeChange: (exerciseId: string, setId: string, field: 'value1Type' | 'value2Type', type: string) => void
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
        {exercise.sets.map((set, index) => (
          <SetRow
            key={`${exercise.id}-${set.id}-${set.value1Type}-${set.value2Type}-${index}`}
            set={set}
            exerciseId={exercise.id}
            onValueChange={onValueChange}
            onValueTypeChange={(exerciseId, setId, field, type) => onValueTypeChange(exerciseId, setId, field, type)}
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
  onValueTypeChange: (exerciseId: string, setId: string, field: 'value1Type' | 'value2Type', type: string) => void
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
          onClick={() => {
            console.log('🔽 Value1 dropdown clicked:', { exerciseId, setId: set.id, currentType: set.value1Type })
            setActiveDropdown({exerciseId, setId: set.id, field: 'value1'})
          }}
          className="dropdown-trigger w-full text-xs text-gray-500 dark:text-gray-400 mb-1 text-center hover:text-gray-700 dark:hover:text-gray-300 font-medium"
        >
          {VALUE_TYPES.find(t => t.value === set.value1Type)?.unit || 'KGS'} ▼
        </button>
        <input
          type="number"
          value={set.value1 || ''}
          onChange={(e) => onValueChange(set.id, 'value1', Number(e.target.value))}
          className="w-full text-center py-2 border border-gray-600 rounded-lg bg-gray-700 text-white text-lg font-medium focus:ring-1 focus:ring-lime-500 focus:border-lime-500"
          placeholder="0"
        />
        
        {activeDropdown?.exerciseId === exerciseId && activeDropdown?.setId === set.id && activeDropdown?.field === 'value1' && (
          <div className="dropdown-menu absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
            {VALUE_TYPES.map((type) => (
              <div
                key={type.value}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onValueTypeChange(exerciseId, set.id, 'value1Type', type.value)
                }}
                className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                  set.value1Type === type.value ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {type.label}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Value 2 */}
      <div className="relative">
        <button
          onClick={() => {
            console.log('🔽 Value2 dropdown clicked:', { exerciseId, setId: set.id, currentType: set.value2Type })
            setActiveDropdown({exerciseId, setId: set.id, field: 'value2'})
          }}
          className="dropdown-trigger w-full text-xs text-gray-500 dark:text-gray-400 mb-1 text-center hover:text-gray-700 dark:hover:text-gray-300 font-medium"
        >
          {VALUE_TYPES.find(t => t.value === set.value2Type)?.unit || 'REPS'} ▼
        </button>
        <input
          type="number"
          value={set.value2 || ''}
          onChange={(e) => onValueChange(set.id, 'value2', Number(e.target.value))}
          className="w-full text-center py-2 border border-gray-600 rounded-lg bg-gray-700 text-white text-lg font-medium focus:ring-1 focus:ring-lime-500 focus:border-lime-500"
          placeholder="0"
        />
        
        {activeDropdown?.exerciseId === exerciseId && activeDropdown?.setId === set.id && activeDropdown?.field === 'value2' && (
          <div className="dropdown-menu absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
            {VALUE_TYPES.map((type) => (
              <div
                key={type.value}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onValueTypeChange(exerciseId, set.id, 'value2Type', type.value)
                }}
                className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer ${
                  set.value2Type === type.value ? 'bg-gray-100 dark:bg-gray-700 text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {type.label}
              </div>
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

function DatePickerModal({
  selectedDate,
  onClose,
  onDateSelect
}: {
  selectedDate: Date
  onClose: () => void
  onDateSelect: (date: Date) => void
}) {
  const [currentDate, setCurrentDate] = useState(selectedDate)

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const handleDateChange = (dateString: string) => {
    const newDate = new Date(dateString)
    setCurrentDate(newDate)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Select Date</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Date Input */}
        <div className="p-4">
          <input
            type="date"
            value={formatDateForInput(currentDate)}
            onChange={(e) => handleDateChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={() => onDateSelect(currentDate)}
            className="flex-1 px-4 py-2 bg-lime-400 text-black rounded-lg hover:bg-lime-500 font-medium"
          >
            Select
          </button>
        </div>
      </div>
    </div>
  )
}

function TimePickerModal({
  duration,
  onClose,
  onDurationSelect
}: {
  duration: string
  onClose: () => void
  onDurationSelect: (duration: string) => void
}) {
  const [hours, setHours] = useState('1')
  const [minutes, setMinutes] = useState('42')
  const [seconds, setSeconds] = useState('40')

  // Parse initial duration
  React.useEffect(() => {
    const parts = duration.split(':')
    if (parts.length === 3) {
      setHours(parts[0])
      setMinutes(parts[1])
      setSeconds(parts[2])
    }
  }, [duration])

  const handleSelect = () => {
    const formattedDuration = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
    onDurationSelect(formattedDuration)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Set Duration</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Time Inputs */}
        <div className="p-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Hours
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full text-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minutes
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full text-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seconds
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className="w-full text-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-lime-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {hours.padStart(2, '0')}:{minutes.padStart(2, '0')}:{seconds.padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            className="flex-1 px-4 py-2 bg-lime-400 text-black rounded-lg hover:bg-lime-500 font-medium"
          >
            Set Duration
          </button>
        </div>
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