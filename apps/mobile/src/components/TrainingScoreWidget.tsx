'use client'
import React, { useState } from 'react'
import { trpc } from '../lib/trpc'

interface TrainingScoreData {
  selectedWeek: {
    load: number
    score: {
      category: string
      min: number
      max: number | null
      color: string
    }
    sessions: number
    weekStart: string
  }
  previousWeek: {
    load: number
    score: {
      category: string
      min: number
      max: number | null
      color: string
    }
    sessions: number
    weekStart: string
  }
  change: {
    absolute: number
    percentage: number
  }
}

const categoryInfo = {
  'Aspiring': {
    range: '0-200 pts',
    description: 'Just starting your training journey. Every session counts!',
    color: 'text-text-secondary',
    bgColor: 'bg-dark-elevated',
    progressColor: 'bg-gray-400'
  },
  'Active': {
    range: '201-300 pts',
    description: 'Building consistency with regular training sessions.',
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-100 dark:bg-teal-900/20',
    progressColor: 'bg-orange-primary'
  },
  'Consistent': {
    range: '301-400 pts',
    description: 'Maintaining steady progress with dedicated training.',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    progressColor: 'bg-yellow-500'
  },
  'Grinding': {
    range: '401-500 pts',
    description: 'Pushing hard with intense and frequent sessions.',
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    progressColor: 'bg-orange-primary'
  },
  'Locked In': {
    range: '501-600 pts',
    description: 'Maximum dedication with exceptional training volume.',
    color: 'text-orange-primary',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    progressColor: 'bg-orange-primary'
  },
  'Maniacal': {
    range: '601+ pts',
    description: 'Elite level training intensity and commitment.',
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    progressColor: 'bg-purple-500'
  }
}

interface TrainingScoreWidgetProps {
  onViewAnalytics?: () => void
  selectedWeekStart?: Date
}

export function TrainingScoreWidget({ onViewAnalytics, selectedWeekStart }: TrainingScoreWidgetProps) {
  const [showInfoModal, setShowInfoModal] = useState(false)
  
  // Helper function to get Monday of a week
  const getMondayOfWeek = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }
  
  // Prepare the week parameter for the API
  const weekParam = selectedWeekStart ? selectedWeekStart.toISOString().split('T')[0] : undefined
  
  const trainingScoreQuery = trpc.statistics.getTrainingScore.useQuery(
    weekParam ? { weekStart: weekParam } : undefined,
    {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )
  
  const weeklyKgQuery = trpc.statistics.getWeeklyKg.useQuery(
    weekParam ? { weekStart: weekParam } : undefined,
    {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    }
  )
  
  const weeklyKmQuery = trpc.statistics.getWeeklyKm.useQuery(
    weekParam ? { weekStart: weekParam } : undefined,
    {
      retry: 2,
      staleTime: 5 * 60 * 1000,
    }
  )

  if (trainingScoreQuery.isLoading) {
    return (
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-lg shadow-sm border border-dark-border p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-6"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (trainingScoreQuery.isError) {
    return (
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-lg shadow-sm border border-dark-border p-6">
        <div className="text-center text-red-600 dark:text-red-400">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm">Failed to load training score</p>
        </div>
      </div>
    )
  }

  const data = trainingScoreQuery.data
  if (!data) return null

  const categoryDetails = categoryInfo[data.selectedWeek.score.category as keyof typeof categoryInfo] || categoryInfo['Aspiring']
  
  // Calculate progress within the category range
  const getProgressPercentage = () => {
    const selectedScore = data.selectedWeek.score
    const rangeSize = selectedScore.max ? (selectedScore.max - selectedScore.min) : 200 // Default range for open-ended categories
    const progress = Math.min(100, Math.max(0, ((data.selectedWeek.load - selectedScore.min) / rangeSize) * 100))
    return progress
  }

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <>
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-lg shadow-sm border border-dark-border p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-semibold text-text-primary">Training Score:</span>
            <span className={`text-lg font-semibold ${categoryDetails.color}`}>
              {data.selectedWeek.score.category}
            </span>
            <button
              onClick={() => setShowInfoModal(true)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Training Score Info"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          {onViewAnalytics && (
            <button 
              onClick={onViewAnalytics}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="View Analytics"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Score Display */}
        <div className="mb-6">
          <div className="flex items-baseline space-x-3 mb-2">
            <span className="text-6xl font-bold text-text-primary">
              {data.selectedWeek.load}
            </span>
            <span className={`text-lg px-3 py-1 rounded-full ${
              data.change.percentage > 0
                ? 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/20' 
                : data.change.percentage === 0
                ? 'text-text-secondary bg-dark-elevated'
                : 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20'
            }`}>
              {formatChange(data.change.percentage)} this week
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
            <div 
              className={`h-full transition-all duration-300 ${categoryDetails.progressColor}`}
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Selected Week</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-text-primary">
                {data.selectedWeek.load} pts
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">Selected week load</div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Previous Week</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-text-primary">
                {data.previousWeek.load} pts
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500">Previous week load</div>
            </div>
          </div>
        </div>

        {/* Weekly KG and KM Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Weekly KG Widget */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Selected Week</span>
            </div>
            {weeklyKgQuery.isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-1"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
              </div>
            ) : weeklyKgQuery.isError ? (
              <div className="text-sm text-red-600 dark:text-red-400">Error loading</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-text-primary">
                  {Math.round(weeklyKgQuery.data?.selectedWeek || 0)} Kg
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">Selected week</div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Previous Week</span>
                    {(() => {
                      const current = weeklyKgQuery.data?.selectedWeek || 0
                      const previous = weeklyKgQuery.data?.previousWeek || 0
                      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0
                      return (
                        <span className={`font-medium ${
                          change > 0 ? 'text-orange-600 dark:text-orange-400' : 
                          change < 0 ? 'text-red-600 dark:text-red-400' : 
                          'text-text-secondary'
                        }`}>
                          {change > 0 ? '+' : ''}{change.toFixed(1)}%
                        </span>
                      )
                    })()}
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                    {Math.round(weeklyKgQuery.data?.previousWeek || 0)} Kg
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Weekly KM Widget */}
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Selected Week</span>
            </div>
            {weeklyKmQuery.isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-1"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
              </div>
            ) : weeklyKmQuery.isError ? (
              <div className="text-sm text-red-600 dark:text-red-400">Error loading</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-text-primary">
                  {((weeklyKmQuery.data?.selectedWeek || 0) / 1000).toFixed(1)} Km
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">Selected week</div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Previous Week</span>
                    {(() => {
                      const current = weeklyKmQuery.data?.selectedWeek || 0
                      const previous = weeklyKmQuery.data?.previousWeek || 0
                      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0
                      return (
                        <span className={`font-medium ${
                          change > 0 ? 'text-orange-600 dark:text-orange-400' : 
                          change < 0 ? 'text-red-600 dark:text-red-400' : 
                          'text-text-secondary'
                        }`}>
                          {change > 0 ? '+' : ''}{change.toFixed(1)}%
                        </span>
                      )
                    })()}
                  </div>
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                    {((weeklyKmQuery.data?.previousWeek || 0) / 1000).toFixed(1)} Km
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-text-primary">
                  Training Score Categories
                </h3>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {Object.entries(categoryInfo).map(([category, info]) => (
                  <div 
                    key={category}
                    className={`p-4 rounded-lg border-2 ${
                      data.selectedWeek.score.category === category 
                        ? `${info.bgColor} border-current ${info.color}` 
                        : 'border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className={`font-semibold ${data.selectedWeek.score.category === category ? info.color : 'text-text-primary'}`}>
                        {category}
                      </h4>
                      <span className={`text-sm ${data.selectedWeek.score.category === category ? info.color : 'text-gray-500 dark:text-gray-400'}`}>
                        {info.range}
                      </span>
                    </div>
                    <p className={`text-sm ${data.selectedWeek.score.category === category ? info.color : 'text-text-secondary'}`}>
                      {info.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-dark-border">
                <p className="text-sm text-text-secondary">
                  Your training score is calculated based on weekly training load, which combines workout duration, 
                  intensity, and frequency to give you a comprehensive view of your training commitment.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}