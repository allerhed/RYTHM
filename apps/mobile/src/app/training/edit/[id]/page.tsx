'use client'
import React, { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/Form'
import { CustomExerciseModal } from '@/components/CustomExerciseModal'
import { ExerciseHistoryModal } from '@/components/ExerciseHistoryModal'
import { trpc } from '@/lib/trpc'

interface Exercise {
  id: string
  name: string
  notes: string
  sets: WorkoutSet[]
  // Database fields
  exercise_id?: string
  template_id?: string
  muscle_groups?: string[]
  equipment?: string
  equipment_id?: string
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
  equipment_id?: string
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
  value1Type: 'weight_kg' | 'distance_m' | 'duration_m' | 'calories' | 'reps' | null
  value1: number | null
  value2Type: 'weight_kg' | 'distance_m' | 'duration_m' | 'calories' | 'reps' | null
  value2: number | null
  notes: string
}

interface WorkoutSession {
  id: string
  session_id: string
  name?: string
  category: 'strength' | 'cardio' | 'hybrid'
  notes: string
  started_at: string
  completed_at: string | null
  created_at: string
  training_load: number | null
  perceived_exertion: number | null
  exercises: DbExercise[]
}

interface DbExercise {
  exercise_id: string
  name: string
  muscle_groups: string[]
  equipment: string
  exercise_category: string
  exercise_type: 'STRENGTH' | 'CARDIO' | null
  sets: DbWorkoutSet[]
}

interface DbWorkoutSet {
  set_id: string
  set_index: number
  value_1_type: string | null
  value_1_numeric: number | null
  value_2_type: string | null
  value_2_numeric: number | null
  notes: string
  created_at: string
}

const VALUE_TYPES = [
  { value: 'weight_kg', label: 'KGS', unit: 'KGS' },
  { value: 'duration_m', label: 'DURATION', unit: 'DURATION' },
  { value: 'distance_m', label: 'DISTANCE', unit: 'DISTANCE' },
  { value: 'calories', label: 'CALORIES', unit: 'CALORIES' },
  { value: 'reps', label: 'REPS', unit: 'REPS' }
]

const PERCEIVED_EXERTION_LABELS = [
  { value: 1, label: 'Very, Very Easy' },
  { value: 2, label: 'Very Easy' },
  { value: 3, label: 'Easy' },
  { value: 4, label: 'Somewhat Hard' },
  { value: 5, label: 'Hard' },
  { value: 6, label: 'Hard+' },
  { value: 7, label: 'Very Hard' },
  { value: 8, label: 'Very Hard+' },
  { value: 9, label: 'Very, Very Hard' },
  { value: 10, label: 'Max Effort' }
]

function EditWorkoutPage() {
  const router = useRouter()
  const params = useParams()
  const { user, token } = useAuth()
  const sessionId = params?.id as string

  // Loading states
  const [loading, setLoading] = useState(true)
  const [loadingSession, setLoadingSession] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form states
  const [workoutName, setWorkoutName] = useState('')
  const [notes, setNotes] = useState('')
  const [trainingLoad, setTrainingLoad] = useState<number | null>(1)
  const [perceivedExertion, setPerceivedExertion] = useState<number>(1)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [activityType, setActivityType] = useState<'strength' | 'cardio' | 'hybrid'>('strength')
  const [workoutDate, setWorkoutDate] = useState(new Date())
  const [duration, setDuration] = useState('1:00:00')

  // Exercise library states
  const [templates, setTemplates] = useState<ExerciseTemplate[]>([])
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [activeDropdown, setActiveDropdown] = useState<{exerciseId: string, setId: string, field: 'value1' | 'value2'} | null>(null)

  // Refs
  const dropdownRefs = useRef<{[key: string]: HTMLDivElement | null}>({})

  // Load existing workout session
  useEffect(() => {
    if (!user || !token || !sessionId) return

    const fetchSession = async () => {
      try {
        setLoadingSession(true)
        setError(null)

        const response = await fetch(`/api/sessions/${sessionId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          if (response.status === 404) {
            setError('Workout not found')
          } else {
            setError('Failed to load workout')
          }
          return
        }

        const data = await response.json()
        const session: WorkoutSession = data.session

        // Convert session data to form format
        setWorkoutName(session.name || 'Workout')
        setActivityType(session.category || 'strength')
        setNotes(session.notes || '')
        setTrainingLoad(session.training_load || 1)
        setPerceivedExertion(session.perceived_exertion || 1)
        
        // Set workout date from session
        if (session.started_at) {
          setWorkoutDate(new Date(session.started_at))
        }

        // Convert exercises and sets
        const convertedExercises: Exercise[] = session.exercises.map((dbEx: any) => ({
          id: dbEx.exercise_id,
          name: dbEx.name,
          notes: '',
          exercise_id: dbEx.exercise_id,
          // Try to find template_id by matching exercise name with templates
          template_id: templates.find((t: any) => t.name === dbEx.name)?.template_id,
          muscle_groups: dbEx.muscle_groups,
          equipment: dbEx.equipment,
          exercise_category: dbEx.exercise_category,
          exercise_type: dbEx.exercise_type || undefined,
          sets: dbEx.sets.map((dbSet: any) => ({
            id: dbSet.set_id,
            setNumber: dbSet.set_index,
            value1Type: dbSet.value_1_type as any,
            value1: dbSet.value_1_numeric,
            value2Type: dbSet.value_2_type as any,
            value2: dbSet.value_2_numeric,
            notes: dbSet.notes
          }))
        }))

        setExercises(convertedExercises)
        
        // Set activity type based on first exercise
        if (convertedExercises.length > 0) {
          const firstExerciseType = convertedExercises[0].exercise_type
          setActivityType(firstExerciseType === 'CARDIO' ? 'cardio' : 'strength')
        }

      } catch (error) {
        console.error('Error fetching session:', error)
        setError('Failed to load workout')
      } finally {
        setLoadingSession(false)
      }
    }

    fetchSession()
  }, [user, token, sessionId])

  // Fetch exercise templates using tRPC
  const { data: exerciseTemplatesData } = trpc.exerciseTemplates.list.useQuery({
    limit: 200
  })

  // Update local state when tRPC data changes
  useEffect(() => {
    if (exerciseTemplatesData) {
      setTemplates(exerciseTemplatesData)
    }
  }, [exerciseTemplatesData])

  // Update template_id on exercises when templates load
  useEffect(() => {
    if (templates.length > 0 && exercises.length > 0) {
      setExercises(prevExercises => 
        prevExercises.map(exercise => ({
          ...exercise,
          template_id: exercise.template_id || templates.find((t: any) => t.name === exercise.name)?.template_id
        }))
      )
    }
  }, [templates])

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      
      // Check if click is outside dropdown elements
      if (activeDropdown && 
          !target.closest('.dropdown-menu') && 
          !target.closest('.dropdown-trigger')) {
        setActiveDropdown(null)
      }
    }

    if (activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [activeDropdown])

  const createNewSetWithDefaults = (setNumber: number, defaultType1?: string, defaultType2?: string): WorkoutSet => ({
    id: Date.now().toString() + setNumber,
    setNumber,
    value1Type: (defaultType1 as any) || (activityType === 'strength' ? 'weight_kg' : 'distance_m'),
    value1: 0,
    value2Type: (defaultType2 as any) || (activityType === 'strength' ? 'reps' : 'duration_m'),
    value2: 0,
    notes: ''
  })

  const createNewSet = (setNumber: number): WorkoutSet => ({
    id: Date.now().toString() + setNumber,
    setNumber,
    value1Type: activityType === 'strength' ? 'weight_kg' : 'distance_m',
    value1: 0,
    value2Type: activityType === 'strength' ? 'reps' : 'duration_m',
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

  const onValueTypeChange = (exerciseId: string, setId: string, field: 'value1Type' | 'value2Type', type: string) => {
    setExercises(prevExercises => {
      const newExercises = [...prevExercises]
      const exerciseIndex = newExercises.findIndex(ex => ex.id === exerciseId)
      
      if (exerciseIndex === -1) {
        return prevExercises
      }

      const exercise = newExercises[exerciseIndex]
      const setIndex = exercise.sets.findIndex(set => set.id === setId)
      
      if (setIndex === -1) {
        return prevExercises
      }

      const newSets = [...exercise.sets]
      newSets[setIndex] = {
        ...newSets[setIndex],
        [field]: type
      }

      newExercises[exerciseIndex] = {
        ...exercise,
        sets: newSets
      }

      return newExercises
    })

    // Close the dropdown
    setActiveDropdown(null)
  }

  const updateSet = (exerciseId: string, setId: string, field: 'value1' | 'value2' | 'notes', value: number | string) => {
    // Simple update without auto-populate
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => 
            set.id === setId ? { ...set, [field]: value } : set
          )
        }
      }
      return ex
    }))
  }

  const updateSetBlur = (exerciseId: string, setId: string, field: 'value1' | 'value2', value: number) => {
    // Auto-populate KGS values across sets if this is the first set and it's a weight field
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const updatedSet = ex.sets.find(set => set.id === setId)
        const isFirstSet = updatedSet?.setNumber === 1
        const isWeightField = (field === 'value1' && updatedSet?.value1Type === 'weight_kg') || 
                             (field === 'value2' && updatedSet?.value2Type === 'weight_kg')
        
        if (isFirstSet && isWeightField && value && Number(value) > 0) {
          // Auto-populate the same weight value to all other sets with the same value type
          return {
            ...ex,
            sets: ex.sets.map(set => {
              if (set.setNumber > 1) {
                if (field === 'value1' && set.value1Type === 'weight_kg' && (!set.value1 || set.value1 === 0)) {
                  return { ...set, value1: Number(value) }
                } else if (field === 'value2' && set.value2Type === 'weight_kg' && (!set.value2 || set.value2 === 0)) {
                  return { ...set, value2: Number(value) }
                }
              }
              return set
            })
          }
        }
      }
      return ex
    }))
  }

  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId))
  }

  const moveExerciseUp = (index: number) => {
    if (index === 0) return // Can't move the first item up
    
    console.log('🔼 Moving exercise up from index', index, 'to', index - 1)
    
    setExercises(prevExercises => {
      const newExercises = [...prevExercises]
      const temp = newExercises[index]
      newExercises[index] = newExercises[index - 1]
      newExercises[index - 1] = temp
      console.log('📋 New exercise order:', newExercises.map((ex, i) => `${i}: ${ex.name}`))
      return newExercises
    })
  }

  const moveExerciseDown = (index: number) => {
    if (index === exercises.length - 1) return // Can't move the last item down
    
    console.log('🔽 Moving exercise down from index', index, 'to', index + 1)
    
    setExercises(prevExercises => {
      const newExercises = [...prevExercises]
      const temp = newExercises[index]
      newExercises[index] = newExercises[index + 1]
      newExercises[index + 1] = temp
      console.log('📋 New exercise order:', newExercises.map((ex, i) => `${i}: ${ex.name}`))
      return newExercises
    })
  }

  const handleUpdateWorkout = async () => {
    if (!user || !token) return

    setSaving(true)
    try {
      const workoutData = {
        name: workoutName,
        category: activityType, // Use the enum value (strength/cardio/hybrid)
        notes,
        started_at: workoutDate.toISOString(), // Include workout date
        exercises: exercises.map(ex => ({
          exercise_id: ex.exercise_id || ex.id,
          name: ex.name,
          muscle_groups: ex.muscle_groups || [],
          equipment: ex.equipment || '',
          exercise_category: ex.exercise_category || 'strength',
          notes: ex.notes || '',
          sets: ex.sets.map(set => ({
            set_id: set.id,
            set_index: set.setNumber,
            value_1_type: set.value1Type,
            value_1_numeric: set.value1 ? Number(set.value1) : null, // Ensure number type
            value_2_type: set.value2Type,
            value_2_numeric: set.value2 ? Number(set.value2) : null, // Ensure number type
            notes: set.notes
          }))
        })),
        training_load: trainingLoad,
        perceived_exertion: perceivedExertion,
      }

      console.log('🚀 Updating workout with data:', JSON.stringify(workoutData, null, 2))

      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutData),
      })

      console.log('📡 Response status:', response.status)
      console.log('📡 Response ok:', response.ok)

      if (response.ok) {
        const savedWorkout = await response.json()
        console.log('✅ Workout updated successfully:', savedWorkout)
        router.push('/dashboard')
      } else {
        const errorText = await response.text()
        console.error('❌ Update failed - Status:', response.status)
        console.error('❌ Update failed - Response:', errorText)
        
        let errorMessage
        try {
          const error = JSON.parse(errorText)
          errorMessage = error.message || error.error || 'Unknown error'
        } catch {
          errorMessage = errorText || `HTTP ${response.status} error`
        }
        
        alert(`Failed to update workout: ${errorMessage}`)
      }
    } catch (error) {
      console.error('Error updating workout:', error)
      alert('Failed to update workout. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addExerciseFromTemplate = (template: ExerciseTemplate) => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: template.name,
      notes: '',
      exercise_id: template.template_id,
      muscle_groups: template.muscle_groups,
      equipment: template.equipment,
      exercise_category: template.exercise_category,
      exercise_type: template.exercise_type,
      default_value_1_type: template.default_value_1_type,
      default_value_2_type: template.default_value_2_type,
      sets: [createNewSetWithDefaults(1, template.default_value_1_type, template.default_value_2_type)],
    }
    
    setExercises([...exercises, newExercise])
    setShowExerciseModal(false)
  }

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading workout...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const filteredTemplates = templates.filter(template => {
    if (!searchQuery) return true
    return template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           template.muscle_groups.some(group => group.toLowerCase().includes(searchQuery.toLowerCase())) ||
           template.equipment.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-dark-elevated2 border-b border-dark-border">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="text-text-secondary hover:text-gray-900 dark:hover:text-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-text-primary">Edit Workout</h1>
            <div className="w-6"></div>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">        
        {/* Workout Info */}
        <div className="bg-dark-elevated1 rounded-lg shadow-sm border border-dark-border p-4">
          <div className="space-y-4">
            {/* Workout Name */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-1">
                Workout Name
              </label>
              <input
                type="text"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="w-full px-3 py-2 border border-dark-border rounded-lg focus:ring-2 focus:ring-orange-primary focus:border-transparent bg-dark-card text-text-primary"
                placeholder="Enter workout name"
              />
            </div>

            {/* Activity Type Toggle */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Activity Type
              </label>
              <div className="flex gap-2">
                {['Strength', 'Cardio', 'Hybrid'].map((type) => (
                  <button
                    key={type}
                    onClick={() => setActivityType(type.toLowerCase() as 'strength' | 'cardio' | 'hybrid')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      activityType === type.toLowerCase()
                        ? 'bg-orange-primary text-white'
                        : 'bg-dark-elevated text-text-primary hover:bg-gray-200 dark:hover:bg-gray-600'
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
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={workoutDate.toISOString().split('T')[0]}
                  onChange={(e) => setWorkoutDate(new Date(e.target.value))}
                  className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-input text-text-primary focus:ring-2 focus:ring-orange-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Duration (Hours:Minutes)
                </label>
                <input
                  type="time"
                  value={duration.substring(0, 5)}
                  onChange={(e) => setDuration(e.target.value + ':00')}
                  min="01:00"
                  max="10:00"
                  step="60"
                  className="w-full px-3 py-2 border border-dark-border rounded-lg bg-dark-input text-text-primary focus:ring-2 focus:ring-orange-primary focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Training Load */}
        <div className="bg-dark-elevated1 rounded-lg shadow-sm border border-dark-border p-4">
          <label className="block text-sm font-medium text-text-primary mb-2">
            Training Load
          </label>
          <input
            type="number"
            value={trainingLoad || ''}
            onChange={(e) => setTrainingLoad(e.target.value ? parseInt(e.target.value) : null)}
            placeholder="Enter training load (optional)"
            className="w-full px-3 py-2 border border-dark-border rounded-lg focus:ring-2 focus:ring-orange-primary focus:border-transparent bg-dark-card text-text-primary"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Subjective measure of workout intensity (e.g., 1-100)
          </p>
        </div>

        {/* How was your workout - Perceived Exertion */}
        <div className="bg-dark-elevated1 rounded-lg shadow-sm border border-dark-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 dark:text-gray-300 text-lg">How was your workout?</span>
              <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-xs text-gray-600 dark:text-gray-300">i</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-orange-primary text-xs">
                {PERCEIVED_EXERTION_LABELS[perceivedExertion - 1]?.label}
              </div>
              <div className="text-orange-primary text-xs">{perceivedExertion}/10</div>
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
          {exercises.map((exercise, index) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              exerciseIndex={index}
              totalExercises={exercises.length}
              onAddSet={() => addSetToExercise(exercise.id)}
              onRemoveSet={(setId) => removeSetFromExercise(exercise.id, setId)}
              onUpdateSet={(setId, field, value) => updateSet(exercise.id, setId, field, value)}
              onUpdateSetBlur={(setId, field, value) => updateSetBlur(exercise.id, setId, field as 'value1' | 'value2', value as number)}
              onRemoveExercise={() => removeExercise(exercise.id)}
              onMoveUp={() => moveExerciseUp(index)}
              onMoveDown={() => moveExerciseDown(index)}
              onValueTypeChange={onValueTypeChange}
              activeDropdown={activeDropdown}
              setActiveDropdown={setActiveDropdown}
            />
          ))}
        </div>

        {/* Add Exercise Button */}
        <button
          onClick={() => setShowExerciseModal(true)}
          className="w-full py-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-orange-primary hover:text-orange-primary transition-colors"
        >
          + Add Exercise
        </button>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={() => router.push(`/training/view/${sessionId}`)}
            className="flex-1 py-3 px-4 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdateWorkout}
            disabled={exercises.length === 0 || saving}
            className="flex-1 py-3 px-4 bg-orange-primary text-white rounded-lg hover:bg-orange-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                Saving...
              </>
            ) : (
              'Update Workout'
            )}
          </button>
        </div>
      </div>

      {/* Exercise Selection Modal */}
      {showExerciseModal && (
        <ExerciseModal
          templates={templates}
          onAddExercise={addExerciseFromTemplate}
          onClose={() => setShowExerciseModal(false)}
          loading={loading}
        />
      )}
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
      <div className="bg-dark-elevated1 rounded-lg w-full max-w-sm border border-dark-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-text-primary">Select Date</h2>
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
            className="w-full px-3 py-2 border border-dark-border rounded-lg focus:ring-2 focus:ring-orange-primary focus:border-transparent bg-dark-card text-text-primary"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-dark-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-dark-border rounded-lg text-text-primary hover:bg-dark-elevated1"
          >
            Cancel
          </button>
          <button
            onClick={() => onDateSelect(currentDate)}
            className="flex-1 px-4 py-2 bg-orange-primary text-white rounded-lg hover:bg-orange-hover font-medium"
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
      <div className="bg-dark-elevated1 rounded-lg w-full max-w-sm border border-dark-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-text-primary">Set Duration</h2>
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
              <label className="block text-sm font-medium text-text-primary mb-2">
                Hours
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full text-center px-3 py-2 border border-dark-border rounded-lg focus:ring-2 focus:ring-orange-primary focus:border-transparent bg-dark-card text-text-primary"
              />
            </div>
            <div className="text-center">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Minutes
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full text-center px-3 py-2 border border-dark-border rounded-lg focus:ring-2 focus:ring-orange-primary focus:border-transparent bg-dark-card text-text-primary"
              />
            </div>
            <div className="text-center">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Seconds
              </label>
              <input
                type="number"
                min="0"
                max="59"
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                className="w-full text-center px-3 py-2 border border-dark-border rounded-lg focus:ring-2 focus:ring-orange-primary focus:border-transparent bg-dark-card text-text-primary"
              />
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className="text-2xl font-bold text-text-primary">
              {hours.padStart(2, '0')}:{minutes.padStart(2, '0')}:{seconds.padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 border-t border-dark-border">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-dark-border rounded-lg text-text-primary hover:bg-dark-elevated1"
          >
            Cancel
          </button>
          <button
            onClick={handleSelect}
            className="flex-1 px-4 py-2 bg-orange-primary text-white rounded-lg hover:bg-orange-hover font-medium"
          >
            Set Duration
          </button>
        </div>
      </div>
    </div>
  )
}

// Exercise Card Component
function ExerciseCard({ 
  exercise, 
  exerciseIndex,
  totalExercises,
  onAddSet, 
  onRemoveSet, 
  onUpdateSet, 
  onUpdateSetBlur,
  onRemoveExercise,
  onMoveUp,
  onMoveDown,
  onValueTypeChange,
  activeDropdown,
  setActiveDropdown
}: {
  exercise: Exercise
  exerciseIndex: number
  totalExercises: number
  onAddSet: () => void
  onRemoveSet: (setId: string) => void
  onUpdateSet: (setId: string, field: 'value1' | 'value2' | 'notes', value: number | string) => void
  onUpdateSetBlur: (setId: string, field: 'value1' | 'value2', value: number) => void
  onRemoveExercise: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  onValueTypeChange: (exerciseId: string, setId: string, field: 'value1Type' | 'value2Type', type: string) => void
  activeDropdown: {exerciseId: string, setId: string, field: 'value1' | 'value2'} | null
  setActiveDropdown: (dropdown: {exerciseId: string, setId: string, field: 'value1' | 'value2'} | null) => void
}) {
  const [showHistory, setShowHistory] = useState(false)
  return (
    <div className="bg-dark-elevated1 rounded-lg border border-dark-border p-4">
      {/* Exercise Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">{exercise.name}</h3>
            <button
              onClick={() => {
                console.log('History button clicked:', { name: exercise.name, template_id: exercise.template_id })
                if (!exercise.template_id) {
                  alert(`No template_id for ${exercise.name}`)
                  return
                }
                setShowHistory(true)
              }}
              className="p-1 text-gray-400 hover:text-orange-hover transition-colors"
              title="View exercise history"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          {exercise.muscle_groups && (
            <p className="text-sm text-gray-400">
              {exercise.muscle_groups.join(', ')}
              {exercise.equipment && ` • ${exercise.equipment}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Move buttons */}
          {totalExercises > 1 && (
            <div className="flex flex-col gap-1">
              <button
                onClick={onMoveUp}
                disabled={exerciseIndex === 0}
                className={`p-1 rounded ${
                  exerciseIndex === 0 
                    ? 'text-gray-600 cursor-not-allowed' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                onClick={onMoveDown}
                disabled={exerciseIndex === totalExercises - 1}
                className={`p-1 rounded ${
                  exerciseIndex === totalExercises - 1 
                    ? 'text-gray-600 cursor-not-allowed' 
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
          <button
            onClick={onRemoveExercise}
            className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {exercise.sets.map((set, index) => (
          <SetRow
            key={set.id}
            set={set}
            exerciseId={exercise.id}
            onUpdateSet={onUpdateSet}
            onUpdateSetBlur={onUpdateSetBlur}
            onRemoveSet={onRemoveSet}
            isOnlySet={exercise.sets.length === 1}
            onValueTypeChange={onValueTypeChange}
            activeDropdown={activeDropdown}
            setActiveDropdown={setActiveDropdown}
          />
        ))}
        
        <button
          onClick={onAddSet}
          className="w-full py-2 text-orange-primary hover:text-orange-light font-medium"
        >
          + Add Set
        </button>
      </div>

      {/* Exercise History Modal */}
      {showHistory && exercise.template_id && (
        <ExerciseHistoryModal
          exerciseTemplateId={exercise.template_id}
          exerciseName={exercise.name}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  )
}

// Set Row Component
function SetRow({ 
  set, 
  exerciseId,
  onUpdateSet, 
  onUpdateSetBlur,
  onRemoveSet, 
  isOnlySet,
  onValueTypeChange,
  activeDropdown,
  setActiveDropdown
}: {
  set: WorkoutSet
  exerciseId: string
  onUpdateSet: (setId: string, field: 'value1' | 'value2' | 'notes', value: number | string) => void
  onUpdateSetBlur: (setId: string, field: 'value1' | 'value2', value: number) => void
  onRemoveSet: (setId: string) => void
  isOnlySet: boolean
  onValueTypeChange: (exerciseId: string, setId: string, field: 'value1Type' | 'value2Type', type: string) => void
  activeDropdown: {exerciseId: string, setId: string, field: 'value1' | 'value2'} | null
  setActiveDropdown: (dropdown: {exerciseId: string, setId: string, field: 'value1' | 'value2'} | null) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-4 items-center relative px-2">
      <div className="text-center min-w-[40px]">
        <div className="text-xs text-gray-400 mb-1 font-medium">SET</div>
        <div className="text-lg font-bold text-white">
          {set.setNumber}
        </div>
      </div>

      {/* Value 1 */}
      <div className="relative">
        <button
          onClick={() => {
            setActiveDropdown(
              activeDropdown?.exerciseId === exerciseId && 
              activeDropdown?.setId === set.id && 
              activeDropdown?.field === 'value1' 
                ? null 
                : {exerciseId, setId: set.id, field: 'value1'}
            )
          }}
          className="dropdown-trigger w-full text-xs text-gray-400 mb-1 hover:text-gray-200 transition-colors"
        >
          {VALUE_TYPES.find(t => t.value === set.value1Type)?.unit || 'DISTANCE'} ▼
        </button>
        <input
          type="number"
          value={set.value1 ? Math.round(set.value1).toString() : ''}
          onChange={(e) => onUpdateSet(set.id, 'value1', parseInt(e.target.value) || 0)}
          onBlur={(e) => onUpdateSetBlur(set.id, 'value1', parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 text-center text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
          placeholder="0"
        />

        {/* Value 1 Dropdown */}
        {activeDropdown?.exerciseId === exerciseId && 
         activeDropdown?.setId === set.id && 
         activeDropdown?.field === 'value1' && (
          <div className="dropdown-menu absolute top-full left-0 right-0 mt-1 bg-dark-elevated1 border border-dark-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {VALUE_TYPES.map((type) => (
              <div
                key={type.value}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onValueTypeChange(exerciseId, set.id, 'value1Type', type.value)
                }}
                className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer ${
                  set.value1Type === type.value ? 'bg-gray-700 text-orange-primary' : 'text-gray-300'
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
            setActiveDropdown(
              activeDropdown?.exerciseId === exerciseId && 
              activeDropdown?.setId === set.id && 
              activeDropdown?.field === 'value2' 
                ? null 
                : {exerciseId, setId: set.id, field: 'value2'}
            )
          }}
          className="dropdown-trigger w-full text-xs text-gray-400 mb-1 hover:text-gray-200 transition-colors"
        >
          {VALUE_TYPES.find(t => t.value === set.value2Type)?.unit || 'CALORIES'} ▼
        </button>
        <input
          type="number"
          value={set.value2 ? Math.round(set.value2).toString() : ''}
          onChange={(e) => onUpdateSet(set.id, 'value2', parseInt(e.target.value) || 0)}
          onBlur={(e) => onUpdateSetBlur(set.id, 'value2', parseInt(e.target.value) || 0)}
          className="w-full px-3 py-2 text-center text-white bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400 focus:border-transparent"
          placeholder="0"
        />

        {/* Value 2 Dropdown */}
        {activeDropdown?.exerciseId === exerciseId && 
         activeDropdown?.setId === set.id && 
         activeDropdown?.field === 'value2' && (
          <div className="dropdown-menu absolute top-full left-0 right-0 mt-1 bg-dark-elevated1 border border-dark-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
            {VALUE_TYPES.map((type) => (
              <div
                key={type.value}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onValueTypeChange(exerciseId, set.id, 'value2Type', type.value)
                }}
                className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-gray-700 transition-colors cursor-pointer ${
                  set.value2Type === type.value ? 'bg-gray-700 text-orange-primary' : 'text-gray-300'
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

// Exercise Modal Component
function ExerciseModal({
  templates,
  onAddExercise,
  onClose,
  loading
}: {
  templates: ExerciseTemplate[]
  onAddExercise: (template: ExerciseTemplate) => void
  onClose: () => void
  loading: boolean
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [showCustomModal, setShowCustomModal] = useState(false)
  const [recentlyAddedExerciseId, setRecentlyAddedExerciseId] = useState<string | null>(null)
  const [isCreatingExercise, setIsCreatingExercise] = useState(false)

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

  // tRPC mutation for creating exercise templates
  const createExerciseTemplate = trpc.exerciseTemplates.create.useMutation()

  const handleAddExercise = (exerciseName: string) => {
    // Find the template by name
    const template = templates.find(t => t.name === exerciseName)
    if (template) {
      onAddExercise(template)
    } else {
      // Create a basic template for custom exercises
      const customTemplate: ExerciseTemplate = {
        template_id: Date.now().toString(),
        name: exerciseName,
        muscle_groups: [],
        equipment: '',
        exercise_category: 'custom',
        exercise_type: 'STRENGTH',
        default_value_1_type: 'weight_kg',
        default_value_2_type: 'reps',
        description: '',
        instructions: ''
      }
      onAddExercise(customTemplate)
    }
    onClose()
  }

  const handleCreateCustomExercise = async (exerciseData: any) => {
    setIsCreatingExercise(true)
    try {
      const newTemplate = await createExerciseTemplate.mutateAsync(exerciseData)
      setRecentlyAddedExerciseId(newTemplate.template_id)
      setShowCustomModal(false)
      // Add the new exercise to the workout
      onAddExercise(newTemplate)
      onClose()
    } catch (error) {
      console.error('Error creating custom exercise:', error)
      alert('Failed to create custom exercise. Please try again.')
    } finally {
      setIsCreatingExercise(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-elevated1 rounded-lg w-full max-w-md max-h-[80vh] flex flex-col border border-dark-border">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-text-primary">Add Exercise</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCustomModal(true)}
              className="text-teal-500 hover:text-teal-600 dark:text-teal-400 dark:hover:text-teal-300 font-medium text-sm"
            >
              Custom Exercise
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-dark-border">
          <input
            type="text"
            placeholder="Search exercises..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-dark-border rounded-lg focus:ring-2 focus:ring-orange-primary focus:border-transparent bg-dark-card text-text-primary"
          />
        </div>

        {/* Exercise Type Filter */}
        <div className="p-4 border-b border-dark-border">
          <h4 className="text-sm font-medium text-text-primary mb-2">Exercise Type</h4>
          <div className="flex gap-2">
            {types.map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === type
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-elevated text-text-primary hover:bg-gray-200 dark:hover:bg-gray-600'
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
        <div className="p-4 border-b border-dark-border">
          <h4 className="text-sm font-medium text-text-primary mb-2">Category</h4>
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm capitalize transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-elevated text-text-primary hover:bg-gray-200 dark:hover:bg-gray-600'
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
                  onClick={() => onAddExercise(template)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    template.template_id === recentlyAddedExerciseId
                      ? 'bg-teal-100 dark:bg-teal-900 border-2 border-teal-500'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-text-primary">{template.name}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      template.exercise_type === 'STRENGTH' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
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
                onClick={() => handleAddExercise(searchQuery)}
                className="mt-2 text-orange-primary hover:text-orange-hover dark:text-orange-primary dark:hover:text-orange-light"
              >
                Create "{searchQuery}" as custom exercise
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-primary mx-auto"></div>
            </div>
          )}
        </div>
      </div>
      
      {/* Custom Exercise Modal */}
      {showCustomModal && (
        <CustomExerciseModal
          onSave={handleCreateCustomExercise}
          onClose={() => setShowCustomModal(false)}
          loading={isCreatingExercise}
        />
      )}
    </div>
  )
}

export default withAuth(EditWorkoutPage)