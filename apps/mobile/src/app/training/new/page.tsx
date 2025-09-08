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
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<{exerciseId: string, setId: string, field: 'value1' | 'value2'} | null>(null)

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown) {
        setActiveDropdown(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [activeDropdown])

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const addExercise = (exerciseName: string) => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: exerciseName,
      notes: '',
      sets: [createNewSet(1)]
    }
    setExercises([...exercises, newExercise])
    setShowExerciseModal(false)
  }

  const createNewSet = (setNumber: number): WorkoutSet => ({
    id: Date.now().toString() + setNumber,
    setNumber,
    value1Type: activityType === 'strength' ? 'weight_kg' : 'distance_m',
    value1: 0,
    value2Type: activityType === 'strength' ? 'duration_s' : 'duration_s',
    value2: 0,
    notes: ''
  })

  const addSetToExercise = (exerciseId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        const newSetNumber = ex.sets.length + 1
        return {
          ...ex,
          sets: [...ex.sets, createNewSet(newSetNumber)]
        }
      }
      return ex
    }))
  }

  const removeSetFromExercise = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        // Don't allow removing the last set
        if (ex.sets.length <= 1) {
          return ex
        }
        
        const updatedSets = ex.sets.filter(set => set.id !== setId)
        // Re-number the remaining sets
        const renumberedSets = updatedSets.map((set, index) => ({
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

  const updateSet = (exerciseId: string, setId: string, field: keyof WorkoutSet, value: any) => {
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

  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId))
  }

  const formatDurationDisplay = (value: number | null, type: string) => {
    if (value === null) return ''
    if (type === 'duration_s') {
      const hours = Math.floor(value / 3600)
      const minutes = Math.floor((value % 3600) / 60)
      const seconds = value % 60
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return value.toString()
  }

  const parseDurationInput = (input: string): number => {
    const parts = input.split(':')
    if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0
      const minutes = parseInt(parts[1]) || 0
      const seconds = parseInt(parts[2]) || 0
      return hours * 3600 + minutes * 60 + seconds
    }
    return parseInt(input) || 0
  }

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const handleDateTimeChange = (dateTimeString: string) => {
    const newDate = new Date(dateTimeString)
    setWorkoutDate(newDate)
  }

  const handleDurationChange = (hours: number, minutes: number, seconds: number) => {
    const formattedDuration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    setDuration(formattedDuration)
  }

  const handleValueTypeChange = (exerciseId: string, setId: string, field: 'value1Type' | 'value2Type', newType: string) => {
    setExercises(exercises.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => {
            if (set.id === setId) {
              const updatedSet = { ...set, [field]: newType }
              // Reset the corresponding value when type changes
              if (field === 'value1Type') {
                updatedSet.value1 = null
              } else {
                updatedSet.value2 = null
              }
              return updatedSet
            }
            return set
          })
        }
      }
      return ex
    }))
    setActiveDropdown(null)
  }

  const handleDropdownToggle = (exerciseId: string, setId: string, field: 'value1' | 'value2') => {
    if (activeDropdown?.exerciseId === exerciseId && 
        activeDropdown?.setId === setId && 
        activeDropdown?.field === field) {
      setActiveDropdown(null)
    } else {
      setActiveDropdown({ exerciseId, setId, field })
    }
  }

  const saveWorkout = async () => {
    try {
      // Parse duration to seconds
      const durationParts = duration.split(':');
      const durationSeconds = parseInt(durationParts[0]) * 3600 + parseInt(durationParts[1]) * 60 + parseInt(durationParts[2]);

      const workoutData = {
        name: workoutName,
        category: activityType,
        planned_date: workoutDate.toISOString(),
        duration_seconds: durationSeconds,
        notes,
        exercises: exercises.map(ex => ({
          name: ex.name,
          notes: ex.notes,
          sets: ex.sets.map(set => ({
            setNumber: set.setNumber,
            value1Type: set.value1Type,
            value1: set.value1,
            value2Type: set.value2Type,
            value2: set.value2,
            notes: set.notes
          }))
        }))
      };

      console.log('Saving workout:', workoutData);

      const token = localStorage.getItem('authToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(workoutData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save workout');
      }

      const result = await response.json();
      console.log('Workout saved:', result);
      
      // Redirect back to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to save workout:', error);
      alert('Failed to save workout. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => router.back()}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Workout</h1>
          <button className="p-2 text-gray-600 dark:text-gray-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <Button
            onClick={saveWorkout}
            variant="primary"
            size="sm"
            className="bg-lime-400 hover:bg-lime-500 text-black font-semibold"
          >
            Save
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Workout Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Workout Name
          </label>
          <input
            type="text"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 text-gray-900 dark:text-gray-100"
            placeholder="Workout name"
          />
        </div>

        {/* Activity Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Activity Type
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['Strength', 'Cardio', 'Hybrid'].map((type) => (
              <button
                key={type}
                onClick={() => setActivityType(type.toLowerCase() as any)}
                className={`p-3 rounded-lg text-sm font-medium transition-colors ${
                  activityType === type.toLowerCase()
                    ? 'bg-gray-400 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Date & Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date & Time
          </label>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="w-full flex items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-900 dark:text-gray-100 flex-1 text-left">
              {formatDate(workoutDate)}
            </span>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showDatePicker && (
            <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
              <input
                type="datetime-local"
                value={formatDateForInput(workoutDate)}
                onChange={(e) => handleDateTimeChange(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
          )}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Duration
          </label>
          <button
            onClick={() => setShowTimePicker(!showTimePicker)}
            className="w-full flex items-center p-4 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-900 dark:text-gray-100 flex-1 text-left">
              {duration}
            </span>
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform ${showTimePicker ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showTimePicker && (
            <DurationPicker
              duration={duration}
              onDurationChange={handleDurationChange}
              onClose={() => setShowTimePicker(false)}
            />
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 text-gray-900 dark:text-gray-100 resize-none"
            placeholder="Add template description or info here..."
          />
        </div>

        {/* Exercises */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Exercises</h3>
          </div>

          {exercises.length === 0 ? (
            <button
              onClick={() => setShowExerciseModal(true)}
              className="w-full p-6 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
            >
              <div className="flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span className="text-gray-600 dark:text-gray-400">Add Exercise</span>
              </div>
            </button>
          ) : (
            <div className="space-y-6">
              {exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onAddSet={() => addSetToExercise(exercise.id)}
                  onUpdateSet={updateSet}
                  onDeleteSet={removeSetFromExercise}
                  onRemove={() => removeExercise(exercise.id)}
                  activeDropdown={activeDropdown}
                  onDropdownToggle={handleDropdownToggle}
                  onValueTypeChange={handleValueTypeChange}
                />
              ))}

              <button
                onClick={() => setShowExerciseModal(true)}
                className="w-full p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                + Add Exercises
              </button>
            </div>
          )}
        </div>

        <div className="h-20" /> {/* Bottom spacing */}
      </div>

      {/* Add Exercise Modal */}
      {showExerciseModal && (
        <AddExerciseModal
          onClose={() => setShowExerciseModal(false)}
          onAddExercise={addExercise}
        />
      )}
    </div>
  )
}

// Exercise Card Component
function ExerciseCard({
  exercise,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onRemove,
  activeDropdown,
  onDropdownToggle,
  onValueTypeChange
}: {
  exercise: Exercise
  onAddSet: () => void
  onUpdateSet: (exerciseId: string, setId: string, field: keyof WorkoutSet, value: any) => void
  onDeleteSet: (exerciseId: string, setId: string) => void
  onRemove: () => void
  activeDropdown: {exerciseId: string, setId: string, field: 'value1' | 'value2'} | null
  onDropdownToggle: (exerciseId: string, setId: string, field: 'value1' | 'value2') => void
  onValueTypeChange: (exerciseId: string, setId: string, field: 'value1Type' | 'value2Type', newType: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center space-x-2 flex-1"
          >
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {exercise.name}
            </h4>
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${collapsed ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            onClick={onRemove}
            className="p-2 text-red-500 hover:text-red-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {!collapsed && (
          <>
            <textarea
              value={exercise.notes}
              onChange={(e) => {/* TODO: Update exercise notes */}}
              className="w-full p-3 mb-4 bg-gray-50 dark:bg-gray-700 rounded border-0 text-sm text-gray-600 dark:text-gray-400 resize-none"
              placeholder="Add notes for this exercise..."
              rows={2}
            />

            <div className="space-y-3">
              {exercise.sets.map((set, index) => (
                <SetRow
                  key={set.id}
                  set={set}
                  exerciseId={exercise.id}
                  onUpdate={onUpdateSet}
                  onDeleteSet={onDeleteSet}
                  isFirstSet={index === 0}
                  isOnlySet={exercise.sets.length === 1}
                  activeDropdown={activeDropdown}
                  onDropdownToggle={onDropdownToggle}
                  onValueTypeChange={onValueTypeChange}
                />
              ))}

              <button
                onClick={onAddSet}
                className="w-full p-3 bg-lime-400 hover:bg-lime-500 text-black rounded-lg font-medium transition-colors"
              >
                Add Set
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Set Row Component
function SetRow({
  set,
  exerciseId,
  onUpdate,
  onDeleteSet,
  isFirstSet,
  isOnlySet,
  activeDropdown,
  onDropdownToggle,
  onValueTypeChange
}: {
  set: WorkoutSet
  exerciseId: string
  onUpdate: (exerciseId: string, setId: string, field: keyof WorkoutSet, value: any) => void
  onDeleteSet: (exerciseId: string, setId: string) => void
  isFirstSet: boolean
  isOnlySet: boolean
  activeDropdown: {exerciseId: string, setId: string, field: 'value1' | 'value2'} | null
  onDropdownToggle: (exerciseId: string, setId: string, field: 'value1' | 'value2') => void
  onValueTypeChange: (exerciseId: string, setId: string, field: 'value1Type' | 'value2Type', newType: string) => void
}) {
  const getValue1Label = () => {
    const type = VALUE_TYPES.find(t => t.value === set.value1Type)
    return type?.label || 'KGS'
  }

  const getValue2Label = () => {
    const type = VALUE_TYPES.find(t => t.value === set.value2Type)
    return type?.label || 'DURATION'
  }

  const formatValue = (value: number | null, type: string | null) => {
    if (value === null || value === undefined) return '0'
    if (type === 'duration_s' && value === 0) return '00:00:00'
    if (type === 'duration_s') {
      const hours = Math.floor(value / 3600)
      const minutes = Math.floor((value % 3600) / 60)
      const seconds = value % 60
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
    return value.toString()
  }

  const isDropdownActive = (field: 'value1' | 'value2') => {
    return activeDropdown?.exerciseId === exerciseId && 
           activeDropdown?.setId === set.id && 
           activeDropdown?.field === field
  }

  return (
    <div className="grid grid-cols-4 gap-4 items-center relative px-2">
      <div className="text-center min-w-[40px]">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 font-medium">SET</div>
        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
          {set.setNumber}
        </div>
      </div>

      <div className="text-center relative">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-center">
          {getValue1Label()}
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onDropdownToggle(exerciseId, set.id, 'value1')
            }}
            className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className={`w-3 h-3 transition-transform ${isDropdownActive('value1') ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <input
          type="text"
          value={formatValue(set.value1, set.value1Type)}
          onChange={(e) => {
            const value = set.value1Type === 'duration_s' 
              ? parseDurationInput(e.target.value)
              : parseFloat(e.target.value) || 0
            onUpdate(exerciseId, set.id, 'value1', value)
          }}
          className="w-full text-center bg-transparent text-lg font-medium text-gray-900 dark:text-gray-100 border-0 outline-none"
          placeholder="0"
        />
        
        {isDropdownActive('value1') && (
          <div 
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {VALUE_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => onValueTypeChange(exerciseId, set.id, 'value1Type', type.value)}
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

      <div className="text-center relative">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 flex items-center justify-center">
          {getValue2Label()}
          <button 
            onClick={(e) => {
              e.stopPropagation()
              onDropdownToggle(exerciseId, set.id, 'value2')
            }}
            className="ml-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className={`w-3 h-3 transition-transform ${isDropdownActive('value2') ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        <input
          type="text"
          value={formatValue(set.value2, set.value2Type)}
          onChange={(e) => {
            const value = set.value2Type === 'duration_s' 
              ? parseDurationInput(e.target.value)
              : parseFloat(e.target.value) || 0
            onUpdate(exerciseId, set.id, 'value2', value)
          }}
          className="w-full text-center bg-transparent text-lg font-medium text-gray-900 dark:text-gray-100 border-0 outline-none"
          placeholder="0"
        />
        
        {isDropdownActive('value2') && (
          <div 
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {VALUE_TYPES.map((type) => (
              <button
                key={type.value}
                onClick={() => onValueTypeChange(exerciseId, set.id, 'value2Type', type.value)}
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

      <div className="flex justify-center">
        <button 
          onClick={() => !isOnlySet && onDeleteSet(exerciseId, set.id)}
          disabled={isOnlySet}
          className={`p-2 transition-colors ${
            isOnlySet 
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
              : 'text-red-500 hover:text-red-700'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Add Exercise Modal Component
function AddExerciseModal({
  onClose,
  onAddExercise
}: {
  onClose: () => void
  onAddExercise: (exerciseName: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [exercises, setExercises] = useState<{id: string, name: string}[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch exercises from API
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/exercises`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          setExercises(data.map((ex: any) => ({ id: ex.exercise_id, name: ex.name })))
        } else {
          console.error('Failed to fetch exercises')
        }
      } catch (error) {
        console.error('Error fetching exercises:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchExercises()
  }, [])

  const recentExercises = [
    'Shoulder Fly',
    'Landmine Chest Press',
    'Landmine Shoulder',
    'Overhead Press (Barbell, Seated)'
  ]

  const strengthExercises = [
    'Ab Scissors',
    'Ab Wheel',
    'Arnold Press (Dumbbell)',
    'Around The World',
    'Back Extension (Bodyweight)',
    'Back Extension (Machine)',
    'Back Extension (Weighted)',
    'Barbell Row',
    'Bench Press',
    'Deadlift',
    'Squat',
    'Pull-up',
    'Push-up',
    'Plank',
    'Burpees'
  ]

  // Combine API exercises with default ones
  const allExercises = [
    ...exercises.map(ex => ex.name),
    ...strengthExercises
  ]

  // Remove duplicates
  const uniqueExercises = Array.from(new Set(allExercises))

  const filteredExercises = searchQuery === '' 
    ? uniqueExercises
    : uniqueExercises.filter(exercise =>
        exercise.toLowerCase().includes(searchQuery.toLowerCase())
      )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="w-full bg-white dark:bg-gray-900 rounded-t-xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Cancel
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Add Exercises
          </h2>
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            Create
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search exercises"
            className="w-full p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border-0 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Exercise List */}
        <div className="overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500 dark:text-gray-400">Loading exercises...</div>
            </div>
          ) : (
            <>
              {searchQuery === '' && (
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    RECENT
                  </h3>
                  <div className="space-y-2">
                    {recentExercises.map((exercise) => (
                      <button
                        key={exercise}
                        onClick={() => onAddExercise(exercise)}
                        className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <span className="text-gray-900 dark:text-gray-100">{exercise}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  ALL EXERCISES
                </h3>
                <div className="space-y-2">
                  {filteredExercises.map((exercise) => (
                    <button
                      key={exercise}
                      onClick={() => onAddExercise(exercise)}
                      className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-gray-900 dark:text-gray-100">{exercise}</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Duration Picker Component
function DurationPicker({
  duration,
  onDurationChange,
  onClose
}: {
  duration: string
  onDurationChange: (hours: number, minutes: number, seconds: number) => void
  onClose: () => void
}) {
  const [hours, setHours] = useState(0)
  const [minutes, setMinutes] = useState(0)
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const parts = duration.split(':')
    if (parts.length === 3) {
      setHours(parseInt(parts[0]) || 0)
      setMinutes(parseInt(parts[1]) || 0)
      setSeconds(parseInt(parts[2]) || 0)
    }
  }, [duration])

  const handleApply = () => {
    onDurationChange(hours, minutes, seconds)
    onClose()
  }

  return (
    <div className="mt-2 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Set Duration
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex items-center justify-center space-x-4 mb-6">
        {/* Hours */}
        <div className="text-center">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Hours
          </label>
          <div className="flex flex-col items-center">
            <button
              onClick={() => setHours(Math.min(23, hours + 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <input
              type="number"
              min="0"
              max="23"
              value={hours}
              onChange={(e) => setHours(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-16 text-center text-2xl font-bold bg-transparent border-0 text-gray-900 dark:text-gray-100 outline-none"
            />
            <button
              onClick={() => setHours(Math.max(0, hours - 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">:</div>

        {/* Minutes */}
        <div className="text-center">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Minutes
          </label>
          <div className="flex flex-col items-center">
            <button
              onClick={() => setMinutes(Math.min(59, minutes + 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <input
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => setMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-16 text-center text-2xl font-bold bg-transparent border-0 text-gray-900 dark:text-gray-100 outline-none"
            />
            <button
              onClick={() => setMinutes(Math.max(0, minutes - 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">:</div>

        {/* Seconds */}
        <div className="text-center">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            Seconds
          </label>
          <div className="flex flex-col items-center">
            <button
              onClick={() => setSeconds(Math.min(59, seconds + 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <input
              type="number"
              min="0"
              max="59"
              value={seconds}
              onChange={(e) => setSeconds(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
              className="w-16 text-center text-2xl font-bold bg-transparent border-0 text-gray-900 dark:text-gray-100 outline-none"
            />
            <button
              onClick={() => setSeconds(Math.max(0, seconds - 1))}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={onClose}
          className="flex-1 py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleApply}
          className="flex-1 py-2 px-4 bg-lime-400 text-black rounded-lg hover:bg-lime-500 transition-colors font-medium"
        >
          Apply
        </button>
      </div>
    </div>
  )
}

// Helper function to parse duration input
function parseDurationInput(input: string): number {
  const parts = input.split(':')
  if (parts.length === 3) {
    const hours = parseInt(parts[0]) || 0
    const minutes = parseInt(parts[1]) || 0
    const seconds = parseInt(parts[2]) || 0
    return hours * 3600 + minutes * 60 + seconds
  }
  return parseInt(input) || 0
}