'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '../../components/Navigation'
import { Button } from '../../components/Form'
import { Avatar } from '../../components/Avatar'
import { useAuth, withAuth } from '../../contexts/AuthContext'
import { PencilIcon, EyeIcon } from '@heroicons/react/24/outline'

// Simple Card component for the dashboard
interface CardProps {
  children: React.ReactNode
  className?: string
}

function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  )
}

function DashboardPage() {
  const router = useRouter()
  const { user, logout, fetchProfile } = useAuth()
  const [todaysWorkouts, setTodaysWorkouts] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  // Fetch fresh profile data when component mounts
  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        await fetchProfile()
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      }
    }
    
    if (user) {
      loadProfile()
    }
  }, [])

  // Fetch today's workouts
  const fetchTodaysWorkouts = React.useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const response = await fetch(`http://localhost:3001/api/sessions?date=${today}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Today\'s workouts:', data)
        setTodaysWorkouts(data.sessions || [])
      } else {
        console.error('Failed to fetch workouts:', response.status, response.statusText)
        setTodaysWorkouts([])
      }
    } catch (error) {
      console.error('Error fetching workouts:', error)
      setTodaysWorkouts([])
    } finally {
      setLoading(false)
    }
  }, [user])

  React.useEffect(() => {
    fetchTodaysWorkouts()
  }, [fetchTodaysWorkouts])

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  const handleDeleteWorkout = async (workoutId: string) => {
    if (!user) return

    setDeleting(true)
    try {
      const response = await fetch(`http://localhost:3001/api/sessions/${workoutId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        }
      })

      if (response.ok) {
        // Remove workout from local state
        setTodaysWorkouts(prev => prev.filter((w: any) => w.id !== workoutId))
        setShowDeleteConfirm(null)
      } else {
        console.error('Failed to delete workout')
      }
    } catch (error) {
      console.error('Error deleting workout:', error)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => router.push('/training/history')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Workout History"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Dashboard
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {user && (
              <div className="flex items-center space-x-2">
                <Avatar user={user} size="sm" />
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome section */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar user={user || undefined} size="md" />
              <div>
                <h1 className="text-display font-bold text-gray-900 dark:text-gray-100">
                  Welcome back, {user?.firstName || user?.email}!
                </h1>
                <p className="text-body text-gray-600 dark:text-gray-400">
                  Ready to continue your training journey?
                </p>
              </div>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 mx-2">4</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">SEP 8 - SEP 14, 25</span>
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Week Days */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-8">
              {[
                { day: 'M', label: 'Monday', active: true },
                { day: 'T', label: 'Tuesday' },
                { day: 'W', label: 'Wednesday' },
                { day: 'T', label: 'Thursday' },
                { day: 'F', label: 'Friday' },
                { day: 'S', label: 'Saturday' },
                { day: 'S', label: 'Sunday' }
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    item.active 
                      ? 'bg-teal-500 text-white border-2 border-teal-600' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {item.day}
                  </div>
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    item.active ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Training Dashboard - full width */}
          <Card className="p-6 mb-8">
              {/* Training Score Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Training Score:</span>
                  <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">Grinding</span>
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Score Display */}
              <div className="mb-6">
                <div className="flex items-baseline space-x-3 mb-2">
                  <span className="text-6xl font-bold text-gray-900 dark:text-gray-100">55</span>
                  <span className="text-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    +0 pts this week
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
                  <div className="h-full flex">
                    <div className="w-1/6 bg-teal-500"></div>
                    <div className="w-1/6 bg-yellow-600"></div>
                    <div className="w-1/6 bg-green-500"></div>
                    <div className="w-1/6 bg-blue-500"></div>
                    <div className="w-1/6 bg-purple-500"></div>
                    <div className="w-1/6 bg-green-600"></div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Hours Trained</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">0h 27m</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">-1h 36m</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">2h 3m last week</div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Training Load</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">18</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">-84</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">102 last week</div>
                  </div>
                </div>
              </div>

              {/* Today's Workouts Section */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
                  {new Date().toLocaleDateString('sv-SE', { weekday: 'long', month: 'short', day: 'numeric' })}
                </h3>
                
                {loading ? (
                  <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                    <div className="text-center text-gray-500 dark:text-gray-400">Loading workouts...</div>
                  </div>
                ) : todaysWorkouts.length > 0 ? (
                  <div className="space-y-3">
                    {todaysWorkouts.map((workout: any) => (
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
                                {workout.category} • {workout.exercises?.length || 0} exercises
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">
                              {workout.training_load ? `Load ${workout.training_load}` : `Load ${Math.min(workout.total_sets * 2 + workout.exercise_count * 3, 30)}`}
                            </div>
                            {workout.perceived_exertion && (
                              <div className="text-white/80 text-sm">RPE {workout.perceived_exertion}/10</div>
                            )}
                          </div>
                        </div>
                        
                        {/* Exercise List */}
                        <div className="space-y-2 mb-4">
                          {workout.exercises?.slice(0, 3).map((exercise: any, idx: number) => (
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
                          {workout.exercises?.length > 3 && (
                            <div className="text-center text-white/60 text-sm">
                              +{workout.exercises.length - 3} more exercises
                            </div>
                          )}
                        </div>

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
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700 p-8 rounded-xl text-center border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      No workouts planned for today
                    </h4>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Start your training journey by creating your first workout
                    </p>
                    <Button 
                      onClick={() => router.push('/training/new')}
                      className="bg-teal-500 hover:bg-teal-600 text-white font-medium px-6 py-2 rounded-lg transition-colors"
                    >
                      Create New Workout
                    </Button>
                  </div>
                )}
              </div>
            </Card>

          {/* Recent activity */}
          <Card className="p-6 mb-8">
            <h2 className="text-subtitle font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {[
                { action: 'Completed strength training session', time: '2 hours ago' },
                { action: 'Updated profile information', time: '1 day ago' },
                { action: 'Joined RYTHM community', time: '3 days ago' },
              ].map((activity, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <span className="text-body text-gray-900 dark:text-gray-100">
                    {activity.action}
                  </span>
                  <span className="text-caption text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Profile Information */}
          <Card className="p-6 mb-8">
            <h2 className="text-subtitle font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Profile Information
            </h2>
            
            {/* Profile Picture and Basic Info */}
            <div className="flex items-center space-x-4 mb-6">
              <Avatar user={user || undefined} size="lg" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {user?.firstName} {user?.lastName}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {user?.about && (
                <div>
                  <span className="text-caption font-medium text-gray-500 dark:text-gray-400">
                    About
                  </span>
                  <p className="text-body text-gray-900 dark:text-gray-100">
                    {user.about}
                  </p>
                </div>
              )}
              <div>
                <span className="text-caption font-medium text-gray-500 dark:text-gray-400">
                  Role
                </span>
                <p className="text-body text-gray-900 dark:text-gray-100 capitalize">
                  {user?.role || 'User'}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push('/training/new')}
                >
                  Log workout
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push('/profile')}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push('/analytics')}
                >
                  View Analytics
                </Button>
              </div>
            </div>
          </Card>

          {/* Development notice */}
          <Card className="p-6 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <span className="text-primary-600 dark:text-primary-400 text-lg">🚧</span>
              </div>
              <div>
                <h3 className="text-subtitle font-semibold text-primary-900 dark:text-primary-100 mb-1">
                  Development Mode
                </h3>
                <p className="text-body text-primary-700 dark:text-primary-300">
                  This dashboard is currently in development. Some features may not be fully functional yet.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Delete Workout
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this workout? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteWorkout(showDeleteConfirm)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Export the component wrapped with authentication protection
export default withAuth(DashboardPage)