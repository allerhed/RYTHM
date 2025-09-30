'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PullToRefresh } from '../../components/PullToRefresh'

interface WorkoutSession {
  id: string
  name: string | null
  category: 'strength' | 'cardio' | 'hybrid'
  started_at: string
  training_load: number | null
  perceived_exertion: number | null
  duration_seconds: number | null
  exercise_count: number
  total_sets: number
}

interface CalendarDay {
  date: Date
  workouts: WorkoutSession[]
  isCurrentMonth: boolean
  isToday: boolean
}

const CATEGORY_COLORS = {
  strength: 'bg-green-500',
  cardio: 'bg-blue-500', 
  hybrid: 'bg-red-500'
} as const

const CATEGORY_LABELS = {
  strength: 'STRENGTH',
  cardio: 'CONDITIONING', 
  hybrid: 'HYBRID'
} as const

function CalendarPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])

  const fetchWorkouts = async () => {
    if (!user || !token) return

    try {
      setLoading(true)
      
      // Fetch workouts for the entire month range
      const response = await fetch('/api/sessions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setWorkouts(data.sessions || [])
      } else {
        console.error('Failed to fetch workouts')
      }
    } catch (error) {
      console.error('Error fetching workouts:', error)
    } finally {
      setLoading(false)
    }
  }

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    await fetchWorkouts()
  }

  useEffect(() => {
    fetchWorkouts()
  }, [user, token, currentDate])

  useEffect(() => {
    // Get the first day of the current month
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    // Get the start of the calendar (might include days from previous month)
    const startOfCalendar = new Date(firstDayOfMonth)
    startOfCalendar.setDate(startOfCalendar.getDate() - firstDayOfMonth.getDay())
    
    // Get the end of the calendar (might include days from next month)
    const endOfCalendar = new Date(lastDayOfMonth)
    const daysToAdd = 6 - lastDayOfMonth.getDay()
    endOfCalendar.setDate(endOfCalendar.getDate() + daysToAdd)

    // Generate calendar days
    const days: CalendarDay[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const currentCalendarDate = new Date(startOfCalendar)
    
    while (currentCalendarDate <= endOfCalendar) {
      const dayWorkouts = workouts.filter(workout => {
        const workoutDate = new Date(workout.started_at)
        workoutDate.setHours(0, 0, 0, 0)
        const currentDay = new Date(currentCalendarDate)
        currentDay.setHours(0, 0, 0, 0)
        return workoutDate.getTime() === currentDay.getTime()
      })

      days.push({
        date: new Date(currentCalendarDate),
        workouts: dayWorkouts,
        isCurrentMonth: currentCalendarDate.getMonth() === currentDate.getMonth(),
        isToday: currentCalendarDate.getTime() === today.getTime()
      })
      
      currentCalendarDate.setDate(currentCalendarDate.getDate() + 1)
    }
    
    setCalendarDays(days)
  }, [workouts, currentDate])

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('sv-SE', { 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const getWorkoutsByCategory = (workouts: WorkoutSession[]) => {
    return workouts.reduce((acc, workout) => {
      if (!acc[workout.category]) {
        acc[workout.category] = []
      }
      acc[workout.category].push(workout)
      return acc
    }, {} as Record<string, WorkoutSession[]>)
  }

  const handleDayClick = (day: CalendarDay) => {
    console.log('Day clicked:', day.date)
    try {
      // Always navigate to day view to show all workouts for that day
      // Use local timezone-safe date formatting to avoid day shift
      const year = day.date.getFullYear()
      const month = String(day.date.getMonth() + 1).padStart(2, '0')
      const dayNum = String(day.date.getDate()).padStart(2, '0')
      const dateString = `${year}-${month}-${dayNum}` // Format: YYYY-MM-DD
      console.log('Navigating to:', `/training/history/day/${dateString}`)
      // Try window.location.href instead of router.push to force page refresh
      window.location.href = `/training/history/day/${dateString}`
    } catch (error) {
      console.error('Navigation error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Calendar
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4">
          <div className="flex items-center justify-center mb-4">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Calendar
            </h1>
          </div>

          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 capitalize">
              {formatMonthYear(currentDate)}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-px mb-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
              <div key={index} className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 p-2">
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
        {/* Calendar Grid */}
        <div className="p-4">
        <div className="bg-gray-800 rounded-lg p-1">
          <div className="grid grid-cols-7 gap-px">
            {calendarDays.map((day, index) => {
              const workoutsByCategory = getWorkoutsByCategory(day.workouts)
              const totalWorkouts = day.workouts.length
              
              return (
                <div
                  key={index}
                  className={`
                    relative aspect-square bg-gray-700 p-2 cursor-pointer transition-all duration-200
                    ${day.isCurrentMonth ? 'hover:bg-gray-600 hover:scale-105 active:scale-95' : 'opacity-50 hover:bg-gray-650'}
                    ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                  `}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDayClick(day)
                  }}
                >
                  {/* Day number */}
                  <div className={`text-sm font-medium mb-2 ${day.workouts.length > 0 ? 'text-white' : 'text-gray-400'}`}>
                    {day.date.getDate()}
                  </div>
                  
                  {/* Workout indicators */}
                  <div className="space-y-1 flex-1">
                    {Object.entries(workoutsByCategory).map(([category, categoryWorkouts]) => (
                      categoryWorkouts.map((_, workoutIndex) => (
                        <div
                          key={`${category}-${workoutIndex}`}
                          className={`h-2.5 ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]} rounded-md shadow-sm`}
                        />
                      ))
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4">
            {Object.entries(CATEGORY_COLORS).map(([category, colorClass]) => (
              <div key={category} className="flex items-center space-x-2">
                <div className={`w-3 h-3 ${colorClass} rounded-sm`} />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="px-4 pb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {formatMonthYear(currentDate)} Summary
          </h3>
          
          {/* Monthly Overview Cards */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {(() => {
              const monthlyWorkouts = workouts.filter(w => {
                const workoutDate = new Date(w.started_at)
                return workoutDate.getMonth() === currentDate.getMonth() &&
                       workoutDate.getFullYear() === currentDate.getFullYear()
              })
              
              const totalWorkload = monthlyWorkouts.reduce((sum, w) => sum + (w.training_load || 0), 0)
              const totalHours = monthlyWorkouts.reduce((sum, w) => sum + (w.duration_seconds || 0), 0) / 3600
              
              return (
                <>
                  <div className="bg-gradient-to-r from-lime-50 to-green-50 dark:from-lime-900/20 dark:to-green-900/20 rounded-lg p-4 border border-lime-200 dark:border-lime-800">
                    <div className="text-2xl font-bold text-lime-700 dark:text-lime-400">
                      {totalWorkload}
                    </div>
                    <div className="text-sm text-lime-600 dark:text-lime-300 font-medium">
                      Total Workload
                    </div>
                    <div className="text-xs text-lime-500 dark:text-lime-400 mt-1">
                      Training Load Points
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                      {totalHours.toFixed(1)}
                    </div>
                    <div className="text-sm text-blue-600 dark:text-blue-300 font-medium">
                      Hours Trained
                    </div>
                    <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                      Total Duration
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
          
          {/* Workout Type Breakdown */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
              Workout Breakdown
            </h4>
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(CATEGORY_LABELS).map(([category, label]) => {
                const categoryWorkouts = workouts.filter(w => {
                  const workoutDate = new Date(w.started_at)
                  return w.category === category && 
                         workoutDate.getMonth() === currentDate.getMonth() &&
                         workoutDate.getFullYear() === currentDate.getFullYear()
                })
                
                return (
                  <div key={category} className="text-center">
                    <div className={`w-4 h-4 ${CATEGORY_COLORS[category as keyof typeof CATEGORY_COLORS]} rounded-sm mx-auto mb-1`} />
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {categoryWorkouts.length}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {label}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
      </PullToRefresh>
    </div>
  )
}

export default CalendarPage