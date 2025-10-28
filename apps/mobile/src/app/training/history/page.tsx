'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

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
  strength: 'bg-orange-primary',
  cardio: 'bg-orange-primary', 
  hybrid: 'bg-red-500'
} as const

const CATEGORY_LABELS = {
  strength: 'STRENGTH',
  cardio: 'CONDITIONING', 
  hybrid: 'HYBRID'
} as const

function WorkoutHistoryPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [workouts, setWorkouts] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])

  useEffect(() => {
    if (!user || !token) return

    const fetchWorkouts = async () => {
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

    fetchWorkouts()
  }, [user, token, currentDate])

  useEffect(() => {
    // Calculate calendar dates inside the effect to avoid dependency issues
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    
    // Get the start of the calendar (might include days from previous month)
    // Adjust for Monday start: getDay() returns 0=Sunday, 1=Monday, etc.
    // We want: Monday=0, Tuesday=1, ..., Sunday=6
    const startOfCalendar = new Date(firstDayOfMonth)
    const firstDayWeekday = (firstDayOfMonth.getDay() + 6) % 7 // Convert to Monday=0 system
    startOfCalendar.setDate(startOfCalendar.getDate() - firstDayWeekday)
    
    // Get the end of the calendar (might include days from next month)
    const endOfCalendar = new Date(lastDayOfMonth)
    const lastDayWeekday = (lastDayOfMonth.getDay() + 6) % 7 // Convert to Monday=0 system
    const daysToAdd = 6 - lastDayWeekday
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
      <div className="min-h-screen bg-dark-primary">
        <div className="bg-dark-elevated2 shadow-sm border-b border-dark-border">
          <div className="px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Workout History
            </h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header */}
      <div className="bg-dark-elevated2 shadow-sm border-b border-dark-border">
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
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="bg-dark-elevated1 rounded-lg p-4 shadow-sm border border-dark-border">
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
        <div className="bg-dark-elevated1 rounded-lg p-4 shadow-sm border border-dark-border">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {formatMonthYear(currentDate)} Summary
          </h3>
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
  )
}

export default WorkoutHistoryPage