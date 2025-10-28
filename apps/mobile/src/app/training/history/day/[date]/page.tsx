'use client'
import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { EyeIcon, PencilIcon } from '@heroicons/react/24/outline'

interface WorkoutSession {
  id: string
  name: string | null
  category: 'strength' | 'cardio' | 'hybrid'
  started_at: string
  ended_at: string | null
  training_load: number | null
  perceived_exertion: number | null
  duration_seconds: number | null
  exercise_count: number
  total_sets: number
  exercises?: Array<{
    exercise_id: string
    name: string
    set_count: number
  }>
  notes?: string
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('sv-SE', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function formatDuration(seconds: number | null) {
  if (!seconds) return 'N/A'
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

function DayViewPage() {
  const router = useRouter()
  const params = useParams()
  const { user, token } = useAuth()
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  
  // Parse date from URL parameter (format: YYYY-MM-DD)
  const dateParam = params.date as string
  console.log('DayViewPage rendering with dateParam:', dateParam)
  
  if (!dateParam) {
    return <div>Invalid date parameter</div>
  }
  
  const selectedDate = new Date(dateParam + 'T00:00:00')

  useEffect(() => {
    if (!user || !token || !dateParam) return

    const fetchWorkouts = async () => {
      try {
        setLoading(true)
        
        const response = await fetch('/api/sessions', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          const data = await response.json()
          
          // Filter workouts for the specific date
          const dayWorkouts = (data.sessions || []).filter((workout: WorkoutSession) => {
            const workoutDate = new Date(workout.started_at)
            workoutDate.setHours(0, 0, 0, 0)
            const targetDate = new Date(dateParam + 'T00:00:00')
            targetDate.setHours(0, 0, 0, 0)
            return workoutDate.getTime() === targetDate.getTime()
          })
          
          setWorkouts(dayWorkouts)
        } else {
          console.error('Failed to fetch workouts')
        }
      } catch (error) {
        console.error('Error fetching workouts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkouts()
  }, [user, token, dateParam])

  const formatDateTitle = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    today.setHours(0, 0, 0, 0)
    yesterday.setHours(0, 0, 0, 0)
    tomorrow.setHours(0, 0, 0, 0)
    date.setHours(0, 0, 0, 0)
    
    if (date.getTime() === today.getTime()) {
      return 'Today'
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday'
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('sv-SE', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
  }

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!token) return

    try {
      const response = await fetch(`/api/sessions/${workoutId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        // Remove the workout from the local state
        setWorkouts(prev => prev.filter(w => w.id !== workoutId))
        setShowDeleteConfirm(null)
      } else {
        console.error('Failed to delete workout')
      }
    } catch (error) {
      console.error('Error deleting workout:', error)
    }
  }

  const handleNewWorkout = () => {
    router.push('/training/log')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <div className="bg-dark-card shadow-sm">
          <div className="px-4 py-3 flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-3 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Day View
            </h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header */}
      <div className="bg-dark-card shadow-sm border-b border-dark-border">
        <div className="px-4 py-4">
          <div className="flex items-center mb-2">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
              {formatDateTitle(selectedDate)}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {selectedDate.toLocaleDateString('sv-SE', { 
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            {workouts.length > 0 && (
              <p className="text-sm text-lime-600 dark:text-lime-400 mt-1">
                {workouts.length} workout{workouts.length !== 1 ? 's' : ''} completed
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {workouts.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 p-8 rounded-xl text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No workouts logged
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              You didn't log any workouts on this day.
            </p>
            <button
              onClick={handleNewWorkout}
              className="px-6 py-3 bg-lime-500 text-white rounded-lg hover:bg-lime-600 transition-colors font-medium"
            >
              Log a Workout
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {workouts.map((workout) => (
              <div key={workout.id} className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl p-4 text-white shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      {workout.category === 'strength' ? (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                        </svg>
                      ) : workout.category === 'cardio' ? (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {workout.name || 
                         (workout.category === 'strength' ? 'Strength Training' : 
                          workout.category === 'cardio' ? 'Cardio Workout' : 'Training Session')}
                      </h4>
                      <p className="text-white/80 text-sm capitalize">
                        {workout.category} • {formatTime(workout.started_at)}
                        {workout.ended_at && ` - ${formatTime(workout.ended_at)}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-white">
                      {workout.duration_seconds ? formatDuration(workout.duration_seconds) : 'N/A'}
                    </div>
                    {workout.perceived_exertion && (
                      <div className="text-white/80 text-sm">RPE {workout.perceived_exertion}/10</div>
                    )}
                  </div>
                </div>
                
                {/* Exercise List */}
                {workout.exercises && workout.exercises.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {workout.exercises.slice(0, 3).map((exercise, idx) => (
                      <div key={exercise.exercise_id} className="flex items-center justify-between bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-white">{idx + 1}</span>
                          </div>
                          <span className="text-white font-medium">{exercise.name}</span>
                        </div>
                        <span className="text-white/80 text-sm">{exercise.set_count} sets</span>
                      </div>
                    ))}
                    {workout.exercises.length > 3 && (
                      <div className="text-center text-white/60 text-sm">
                        +{workout.exercises.length - 3} more exercises
                      </div>
                    )}
                  </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-3 text-center bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <div>
                    <div className="text-xs font-medium text-white/80 mb-1">EXERCISES</div>
                    <div className="text-lg font-bold text-white">{workout.exercise_count}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white/80 mb-1">SETS</div>
                    <div className="text-lg font-bold text-white">{workout.total_sets}</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white/80 mb-1">LOAD</div>
                    <div className="text-lg font-bold text-white">
                      {workout.training_load || Math.min(workout.total_sets * 2 + workout.exercise_count * 3, 30)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white/80 mb-1">RPE</div>
                    <div className="text-lg font-bold text-white">
                      {workout.perceived_exertion ? `${workout.perceived_exertion}/10` : 'N/A'}
                    </div>
                  </div>
                </div>
                
                {workout.notes && (
                  <div className="mt-3 text-sm text-white/90 italic bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                    "{workout.notes}"
                  </div>
                )}
                
                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-2 mt-3">
                  <button 
                    onClick={() => router.push(`/training/view/${workout.id}`)}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="View workout"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => router.push(`/training/edit/${workout.id}`)}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Edit workout"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setShowDeleteConfirm(workout.id)}
                    className="p-2 text-white/80 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Delete workout"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-dark-card rounded-lg p-6 max-w-sm w-full">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete Workout
            </h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete this workout? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-dark-elevated rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteWorkout(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default withAuth(DayViewPage)