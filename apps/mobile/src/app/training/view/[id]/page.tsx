'use client'
import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'


interface WorkoutSet {
  set_id: string
  set_index: number
  value_1_type: string | null
  value_1_numeric: number | null
  value_2_type: string | null
  value_2_numeric: number | null
  notes: string
  created_at: string
}

interface Exercise {
  exercise_id: string
  name: string
  muscle_groups: string[]
  equipment: string
  exercise_category: string
  exercise_type: 'STRENGTH' | 'CARDIO' | null
  sets: WorkoutSet[]
}

interface WorkoutSession {
  id: string
  session_id: string
  name: string | null
  category: string
  notes: string
  started_at: string
  completed_at: string | null
  created_at: string
  training_load: number | null
  perceived_exertion: number | null
  exercises: Exercise[]
}

const VALUE_TYPES = {
  'weight_kg': { label: 'KGS', unit: 'KGS' },
  'reps': { label: 'REPS', unit: 'REPS' },
  'distance_m': { label: 'DISTANCE', unit: 'DISTANCE' },
  'calories': { label: 'CALORIES', unit: 'CALORIES' },
  'duration_s': { label: 'DURATION', unit: 'DURATION' }
} as const

function ViewWorkoutPage() {
  const router = useRouter()
  const params = useParams()
  const { user, token } = useAuth()
  const [session, setSession] = useState<WorkoutSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const sessionId = params?.id as string

  useEffect(() => {
    if (!user || !token || !sessionId) return

    const fetchSession = async () => {
      try {
        setLoading(true)
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
        setSession(data.session)
      } catch (error) {
        console.error('Error fetching session:', error)
        setError('Failed to load workout')
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [user, token, sessionId])

  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString)
    return {
      date: date.toLocaleDateString('sv-SE', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('sv-SE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return 'In progress'
    
    const start = new Date(startTime)
    const end = new Date(endTime)
    const durationMs = end.getTime() - start.getTime()
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60))
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatSetValue = (type: string | null, value: number | null, exerciseType?: string | null, isValue1?: boolean) => {
    if (value === null) return '-'
    
    return `${value}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="px-4 py-3 flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Loading...
            </h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="px-4 py-3 flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Workout
            </h1>
          </div>
        </div>
        <div className="p-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">
              {error || 'Workout not found'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { date, time } = formatDateTime(session.started_at)

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
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {session.name || `${session.category.charAt(0).toUpperCase() + session.category.slice(1)} Workout`}
            </h1>
            <button
              onClick={() => router.push(`/training/edit/${session.id}`)}
              className="bg-lime-400 text-black px-4 py-2 rounded-lg hover:bg-lime-500 transition-colors font-medium"
            >
              Edit
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
              <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                {session.name || `${session.category.charAt(0).toUpperCase() + session.category.slice(1)} Workout`}
              </div>
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
                    disabled
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium ${
                      session.category.toLowerCase() === type.toLowerCase()
                        ? 'bg-lime-400 text-black'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
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
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  {new Date(session.started_at).toLocaleDateString('sv-SE')}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                  {formatDuration(session.started_at, session.completed_at || undefined)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Training Load */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Training Load
          </label>
          <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
            {session.training_load || 'Not recorded'}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Subjective measure of workout intensity (e.g., 1-100)
          </p>
        </div>

        {/* Perceived Exertion */}
        {session.perceived_exertion !== null && (
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
                  {session.perceived_exertion <= 2 ? 'Easy' : 
                   session.perceived_exertion <= 4 ? 'Moderate' :
                   session.perceived_exertion <= 6 ? 'Hard' :
                   session.perceived_exertion <= 8 ? 'Very Hard' : 'Max Effort'}
                </div>
                <div className="text-lime-400 text-xs">{session.perceived_exertion}/10</div>
              </div>
            </div>

            {/* Visual representation of the rating */}
            <div className="relative">
              <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-lg">
                <div 
                  className="h-2 bg-lime-400 rounded-lg"
                  style={{ width: `${(session.perceived_exertion - 1) * 11.11}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
                <span>Resting</span>
                <span>Max Effort</span>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {session.notes && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Workout Notes
            </label>
            <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100">
              {session.notes}
            </div>
          </div>
        )}

        {/* Exercises */}
        <div className="space-y-4">
          {session.exercises.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400">No exercises recorded</p>
            </div>
          ) : (
            session.exercises.map((exercise, index) => (
              <div
                key={exercise.exercise_id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {index + 1}. {exercise.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      {exercise.exercise_type && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-lime-100 text-lime-800 dark:bg-lime-900/20 dark:text-lime-400">
                          {exercise.exercise_type.toLowerCase()}
                        </span>
                      )}
                      {exercise.muscle_groups && exercise.muscle_groups.length > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {exercise.muscle_groups.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {exercise.sets.length} set{exercise.sets.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Sets Table */}
                {exercise.sets.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Set</th>
                          {exercise.sets.some(set => set.value_1_numeric !== null) && (
                            <th className="text-left py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                              {exercise.sets[0]?.value_1_type && VALUE_TYPES[exercise.sets[0].value_1_type as keyof typeof VALUE_TYPES]?.label || 'Value 1'}
                            </th>
                          )}
                          {exercise.sets.some(set => set.value_2_numeric !== null) && (
                            <th className="text-left py-2 text-xs font-medium text-gray-500 dark:text-gray-400">
                              {exercise.sets[0]?.value_2_type && VALUE_TYPES[exercise.sets[0].value_2_type as keyof typeof VALUE_TYPES]?.label || 'Value 2'}
                            </th>
                          )}
                          <th className="text-left py-2 text-xs font-medium text-gray-500 dark:text-gray-400">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {exercise.sets.map((set, setIndex) => (
                          <tr key={set.set_id} className="border-b border-gray-100 dark:border-gray-800">
                            <td className="py-2 text-gray-900 dark:text-white font-medium">
                              {set.set_index}
                            </td>
                            {exercise.sets.some(s => s.value_1_numeric !== null) && (
                              <td className="py-2 text-gray-700 dark:text-gray-300">
                                {formatSetValue(set.value_1_type, set.value_1_numeric, exercise.exercise_type, true)}
                              </td>
                            )}
                            {exercise.sets.some(s => s.value_2_numeric !== null) && (
                              <td className="py-2 text-gray-700 dark:text-gray-300">
                                {formatSetValue(set.value_2_type, set.value_2_numeric, exercise.exercise_type, false)}
                              </td>
                            )}
                            <td className="py-2 text-gray-500 dark:text-gray-400 text-xs">
                              {set.notes || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ViewWorkoutPage