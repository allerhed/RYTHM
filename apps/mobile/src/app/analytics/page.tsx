'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { trpc } from '../providers'

interface WorkoutSession {
  id: string
  session_id: string
  name: string | null
  category: 'strength' | 'cardio' | 'hybrid'
  started_at: string
  training_load: number | null
  perceived_exertion: number | null
  duration_seconds: number | null
  exercise_count: number
  total_sets: number
  exercises?: Array<{
    exercise_id: string
    name: string
    set_count: number
    sets?: Array<{
      set_id: string
      value_1_type: string | null
      value_1_numeric: number | null
      value_2_type: string | null
      value_2_numeric: number | null
      notes: string | null
    }>
  }>
}

interface AnalyticsData {
  currentPeriod: {
    trainingLoad: number
    activityTime: number // in minutes
    totalDistance: number // in km
    totalWeight: number // in kg
    workoutCount: number
  }
  previousPeriod: {
    trainingLoad: number
    activityTime: number
    totalDistance: number
    totalWeight: number
    workoutCount: number
  }
  weeklyData: Array<{
    date: string
    trainingLoad: number
    activityTime: number
    cardioLoad: number
    strengthLoad: number
  }>
}

function AnalyticsPage() {
  const router = useRouter()
  const { user } = useAuth()

  // Test tRPC connection first
  const testQuery = trpc.analytics.test.useQuery(undefined, {
    enabled: !!user,
    onSuccess: (data) => {
      console.log('tRPC test successful:', data)
    },
    onError: (error) => {
      console.error('tRPC test error:', error)
    }
  })

  // Use tRPC queries to fetch data from server
  const trainingLoadQuery = trpc.analytics.trainingLoadChart.useQuery(undefined, {
    enabled: !!user && testQuery.isSuccess, // Only enable if test passes
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      console.error('Training load query error:', error)
    }
  })

  const summaryQuery = trpc.analytics.analyticsSummary.useQuery(undefined, {
    enabled: !!user && testQuery.isSuccess, // Only enable if test passes
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      console.error('Summary query error:', error)
    }
  })

  const loading = testQuery.isLoading || trainingLoadQuery.isLoading || summaryQuery.isLoading
  const trainingLoadData = trainingLoadQuery.data
  const summaryData = summaryQuery.data

  console.log('Analytics Page Debug:', {
    user: !!user,
    loading,
    testStatus: testQuery.status,
    testError: testQuery.error,
    testData: testQuery.data,
    trainingLoadStatus: trainingLoadQuery.status,
    trainingLoadError: trainingLoadQuery.error,
    summaryStatus: summaryQuery.status,
    summaryError: summaryQuery.error,
    hasTrainingLoadData: !!trainingLoadData,
    hasSummaryData: !!summaryData
  })

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  const formatChange = (current: number, previous: number) => {
    if (previous === 0) return '+0%'
    const change = ((current - previous) / previous) * 100
    return `${change >= 0 ? '+' : ''}${change.toFixed(0)}%`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })
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
              Analytics
            </h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lime-500"></div>
        </div>
      </div>
    )
  }

  if (testQuery.error || trainingLoadQuery.error || summaryQuery.error) {
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
              Analytics
            </h1>
          </div>
        </div>
        <div className="p-4 text-center text-red-500">
          <p>Error loading analytics data:</p>
          <p className="text-sm mt-2">{testQuery.error?.message || trainingLoadQuery.error?.message || summaryQuery.error?.message}</p>
        </div>
      </div>
    )
  }

  if (!trainingLoadData || !summaryData) {
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
              Analytics
            </h1>
          </div>
        </div>
        <div className="p-4 text-center text-gray-500">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Analytics
            </h1>
            <div className="p-2">
              {/* Placeholder for menu */}
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Training Load Widget */}
        <div className="bg-gray-800 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-2">Training Load</h2>
          <p className="text-sm text-gray-400 mb-6">Weekly training load for the past 3 months</p>
          
          {/* Y-axis labels */}
          <div className="flex mb-4">
            <div className="w-12 flex flex-col justify-between text-xs text-gray-400 h-48">
              <span>600</span>
              <span>500</span>
              <span>400</span>
              <span>300</span>
              <span>200</span>
              <span>100</span>
              <span>0</span>
            </div>
            
            {/* Chart Area */}
            <div className="flex-1">
              <div className="flex items-end justify-between h-48 mb-4 border-l border-gray-700">
                {trainingLoadData.weeklyData.slice(-12).map((week: any, index: number) => {
                  const maxLoad = Math.max(600, Math.max(...trainingLoadData.weeklyData.map((w: any) => w.trainingLoad)) * 1.2) // Dynamic scale
                  const cardioHeight = Math.max((week.cardioLoad / maxLoad) * 180, week.cardioLoad > 0 ? 8 : 0)
                  const strengthHeight = Math.max((week.strengthLoad / maxLoad) * 180, week.strengthLoad > 0 ? 8 : 0)
                  
                  return (
                    <div key={index} className="flex flex-col items-center space-y-2 ml-1">
                      <div className="flex flex-col-reverse items-center">
                        <div
                          className="w-6 bg-teal-500 rounded-sm transition-all duration-500"
                          style={{ height: `${cardioHeight}px` }}
                        />
                        <div
                          className="w-6 bg-purple-500 rounded-sm transition-all duration-500"
                          style={{ height: `${strengthHeight}px` }}
                        />
                      </div>
                      <span className="text-xs text-gray-300 transform rotate-45 origin-bottom-left mt-2">
                        {formatDate(week.date)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-teal-500 rounded"></div>
              <span className="text-sm">Cardio</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm">Strength</span>
            </div>
          </div>

          {/* Summary */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">Last 3 Months ({formatChange(summaryData.currentPeriod.trainingLoad, summaryData.previousPeriod.trainingLoad)})</span>
              <span className="text-2xl font-bold">{summaryData.currentPeriod.trainingLoad.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-400">vs. previous 3 months</span>
              <span className="text-lg text-gray-300">{summaryData.previousPeriod.trainingLoad.toLocaleString()}</span>
            </div>
            
            {/* Calculate actual percentages from data */}
            {(() => {
              const totalCurrentLoad = summaryData.currentPeriod.trainingLoad
              const totalPreviousLoad = summaryData.previousPeriod.trainingLoad
              
              // Calculate cardio vs strength percentages from weekly data
              const totalCardio = trainingLoadData.weeklyData.reduce((sum: number, week: any) => sum + week.cardioLoad, 0)
              const totalStrength = trainingLoadData.weeklyData.reduce((sum: number, week: any) => sum + week.strengthLoad, 0)
              const total = totalCardio + totalStrength
              
              const cardioPercent = total > 0 ? Math.round((totalCardio / total) * 100) : 0
              const strengthPercent = total > 0 ? Math.round((totalStrength / total) * 100) : 0
              
              const currentWidth = totalCurrentLoad + totalPreviousLoad > 0 ? 
                Math.round((totalCurrentLoad / (totalCurrentLoad + totalPreviousLoad)) * 100) : 50
              const previousWidth = 100 - currentWidth

              return (
                <>
                  {/* Progress bars comparing current vs previous 3-month periods */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gradient-to-r from-teal-400 to-purple-500 rounded"></div>
                      <span className="text-sm text-gray-300 flex-1">Last 3 months</span>
                      <span className="text-lg font-bold">{summaryData.currentPeriod.trainingLoad.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-teal-400 to-purple-500 rounded-full transition-all duration-500"
                        style={{ width: `${currentWidth}%` }}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gray-500 rounded"></div>
                      <span className="text-sm text-gray-400 flex-1">Previous 3 months</span>
                      <span className="text-lg text-gray-300">{summaryData.previousPeriod.trainingLoad.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gray-500 rounded-full transition-all duration-500"
                        style={{ width: `${previousWidth}%` }}
                      />
                    </div>
                  </div>
                  
                  {/* Show cardio vs strength breakdown for current period */}
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <div className="text-sm text-gray-400 mb-2">Training Type Breakdown (Last 3 months)</div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                        <span className="text-sm text-gray-300">Cardio {cardioPercent}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-300">Strength {strengthPercent}%</span>
                      </div>
                    </div>
                  </div>
                </>
              )
            })()}
          </div>
        </div>

        {/* Activity Time Widget */}
        <div className="bg-gray-800 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-6">Activity Time</h2>
          
          {/* Y-axis labels */}
          <div className="flex mb-4">
            <div className="w-12 flex flex-col justify-between text-xs text-gray-400 h-48">
              <span>12h 30m</span>
              <span>10h</span>
              <span>7h 30m</span>
              <span>5h</span>
              <span>2h 30m</span>
              <span>0h</span>
            </div>
            
            {/* Chart Area with Line Graph */}
            <div className="flex-1 relative">
              <div className="h-48 mb-4 border-l border-gray-700 relative">
                {/* Grid lines */}
                {[0, 1, 2, 3, 4, 5].map((line) => (
                  <div
                    key={line}
                    className="absolute w-full border-t border-gray-700 opacity-30"
                    style={{ top: `${line * 36}px` }}
                  />
                ))}
                
                {/* Current period line (lime) */}
                <svg className="absolute inset-0 w-full h-full">
                  <defs>
                    <linearGradient id="currentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#84cc16', stopOpacity: 0.3 }} />
                      <stop offset="100%" style={{ stopColor: '#84cc16', stopOpacity: 0 }} />
                    </linearGradient>
                  </defs>
                  
                  {/* Current period area fill */}
                  <path
                    d={`M20,180 L80,120 L140,150 L200,60 L260,120 L320,180 L320,192 L20,192 Z`}
                    fill="url(#currentGradient)"
                  />
                  
                  {/* Current period line */}
                  <path
                    d={`M20,180 L80,120 L140,150 L200,60 L260,120 L320,180`}
                    stroke="#84cc16"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Previous period line (blue) */}
                  <path
                    d={`M20,170 L80,140 L140,100 L200,80 L260,160 L320,90`}
                    stroke="#3b82f6"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Data points for current */}
                  {[{x: 20, y: 180}, {x: 80, y: 120}, {x: 140, y: 150}, {x: 200, y: 60}, {x: 260, y: 120}, {x: 320, y: 180}].map((point, idx) => (
                    <circle
                      key={`current-${idx}`}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#84cc16"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  ))}
                  
                  {/* Data points for previous */}
                  {[{x: 20, y: 170}, {x: 80, y: 140}, {x: 140, y: 100}, {x: 200, y: 80}, {x: 260, y: 160}, {x: 320, y: 90}].map((point, idx) => (
                    <circle
                      key={`previous-${idx}`}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="#3b82f6"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  ))}
                </svg>
              </div>
              
              {/* X-axis labels */}
              <div className="flex justify-between text-xs text-gray-300 ml-4">
                {trainingLoadData.weeklyData.slice(-6).map((week: any, index: number) => (
                  <span key={index}>{formatDate(week.date)}</span>
                ))}
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-lime-500 rounded"></div>
              <span className="text-sm">Current</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-sm">Previous</span>
            </div>
          </div>

          {/* Summary */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">Last 3 Months ({formatChange(summaryData.currentPeriod.activityTime, summaryData.previousPeriod.activityTime)})</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{formatTime(summaryData.currentPeriod.activityTime)}</div>
              <div className="text-lg text-gray-300">{formatTime(summaryData.previousPeriod.activityTime)}</div>
            </div>
          </div>
        </div>

        {/* Total Distance Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Total Distance</h2>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {summaryData.currentPeriod.totalDistance.toFixed(1)} km
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last 3 months
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                {formatChange(summaryData.currentPeriod.totalDistance, summaryData.previousPeriod.totalDistance)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                vs. previous 3 months
              </div>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Previous Period</span>
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                {summaryData.previousPeriod.totalDistance.toFixed(1)} km
              </span>
            </div>
          </div>
        </div>

        {/* Total Weight Widget */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Total Weight Lifted</h2>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {(summaryData.currentPeriod.totalWeight / 1000).toFixed(1)} tonnes
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last 3 months ({summaryData.currentPeriod.totalWeight.toLocaleString()} kg)
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {formatChange(summaryData.currentPeriod.totalWeight, summaryData.previousPeriod.totalWeight)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                vs. previous 3 months
              </div>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Previous Period</span>
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                {(summaryData.previousPeriod.totalWeight / 1000).toFixed(1)} tonnes
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              ({summaryData.previousPeriod.totalWeight.toLocaleString()} kg)
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">3-Month Summary</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {summaryData.currentPeriod.workoutCount}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Total Workouts
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {summaryData.currentPeriod.workoutCount > 0 ? 
                  Math.round(summaryData.currentPeriod.trainingLoad / summaryData.currentPeriod.workoutCount) : 0}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Avg Load/Workout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsPage