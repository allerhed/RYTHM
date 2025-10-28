'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { trpc } from '../../lib/trpc'
import { PullToRefresh } from '../../components/PullToRefresh'

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

  // Add error boundary for storage issues
  React.useEffect(() => {
    const handleStorageError = (event: ErrorEvent) => {
      if (event.message?.includes('JSON.parse') || event.message?.includes('storage')) {
        console.warn('Storage error caught and ignored:', event.message)
        event.preventDefault()
        return false
      }
    }
    
    window.addEventListener('error', handleStorageError)
    return () => window.removeEventListener('error', handleStorageError)
  }, [])

  // Use tRPC queries to fetch data from server
  const trainingLoadQuery = trpc.statistics.getTrainingLoadChart.useQuery(undefined, {
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onSuccess: (data) => {
      console.log('✅ Training load data received:', data)
    },
    onError: (error) => {
      console.error('❌ Training load query error:', error)
    }
  })

  const summaryQuery = trpc.statistics.getAnalyticsSummary.useQuery(undefined, {
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      console.error('Summary query error:', error)
    }
  })

  const categoryBreakdownQuery = trpc.statistics.getCategoryBreakdown.useQuery(undefined, {
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    onError: (error) => {
      console.error('Category breakdown query error:', error)
    }
  })

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    await Promise.all([
      trainingLoadQuery.refetch(),
      summaryQuery.refetch(),
      categoryBreakdownQuery.refetch()
    ])
  }

  const loading = trainingLoadQuery.isLoading || summaryQuery.isLoading || categoryBreakdownQuery.isLoading
  const trainingLoadData = trainingLoadQuery.data
  const summaryData = summaryQuery.data
  const categoryData = categoryBreakdownQuery.data

  // Debug: Log activityTime values for the Activity Time chart
  if (trainingLoadData?.weeklyData) {
    const last12Weeks = trainingLoadData.weeklyData.slice(-12);
    console.log('🔍 Activity Time Chart Data (last 12 weeks):', last12Weeks.map(w => ({ 
      date: w.date, 
      activityTime: w.activityTime,
      trainingLoad: w.trainingLoad 
    })));
    
    // Log summary of activity time values
    const activityTimes = last12Weeks.map(w => w.activityTime || 0);
    console.log('📊 Activity Time Values:', activityTimes);
    console.log('📈 Min/Max Activity Time:', { min: Math.min(...activityTimes), max: Math.max(...activityTimes) });
    
    // Log the specific data we expect from API debug: [156, 0, 180] minutes
    const last3Weeks = last12Weeks.slice(-3);
    console.log('🎯 Last 3 Weeks Activity Time (should be ~[156, 0, 180]):', last3Weeks.map(w => w.activityTime));
  }

  // Defensive data checking
  const hasValidData = trainingLoadData?.weeklyData && Array.isArray(trainingLoadData.weeklyData) && 
                      summaryData?.currentPeriod && summaryData?.previousPeriod &&
                      categoryData?.currentPeriod && categoryData?.previousPeriod

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

  if (!user) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <div className="bg-dark-elevated2 shadow-sm border-b border-dark-border">
          <div className="px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analytics
            </h1>
          </div>
        </div>
        <div className="p-4 text-center text-gray-500">
          Please log in to view your analytics.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <div className="bg-dark-elevated2 shadow-sm border-b border-dark-border">
          <div className="px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analytics
            </h1>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-primary"></div>
        </div>
      </div>
    )
  }

  if (trainingLoadQuery.error || summaryQuery.error || categoryBreakdownQuery.error) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <div className="bg-dark-elevated2 shadow-sm border-b border-dark-border">
          <div className="px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analytics
            </h1>
          </div>
        </div>
        <div className="p-4 text-center text-red-500">
          <p>Error loading analytics data:</p>
          <p className="text-sm mt-2">{trainingLoadQuery.error?.message || summaryQuery.error?.message || categoryBreakdownQuery.error?.message}</p>
        </div>
      </div>
    )
  }

  if (!hasValidData) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <div className="bg-dark-elevated2 shadow-sm border-b border-dark-border">
          <div className="px-4 py-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Analytics
            </h1>
          </div>
        </div>
        <div className="p-4 text-center text-gray-500">
          {!trainingLoadData || !summaryData || !categoryData ? 'No data available' : 'Loading analytics data...'}
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
              Analytics
            </h1>
          </div>
        </div>
      </div>

      <PullToRefresh onRefresh={handleRefresh}>
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
                  const weeklyLoads = trainingLoadData.weeklyData.map((w: any) => w.trainingLoad || 0)
                  const maxLoad = Math.max(600, Math.max(...weeklyLoads) * 1.2) // Dynamic scale
                  const cardioHeight = Math.max(((week.cardioLoad || 0) / maxLoad) * 180, (week.cardioLoad || 0) > 0 ? 8 : 0)
                  const strengthHeight = Math.max(((week.strengthLoad || 0) / maxLoad) * 180, (week.strengthLoad || 0) > 0 ? 8 : 0)
                  const hybridHeight = Math.max(((week.hybridLoad || 0) / maxLoad) * 180, (week.hybridLoad || 0) > 0 ? 8 : 0)
                  
                  return (
                    <div key={index} className="flex flex-col items-center space-y-2 ml-1">
                      <div className="flex flex-col-reverse items-center">
                        <div
                          className="w-6 bg-orange-primary rounded-sm transition-all duration-500"
                          style={{ height: `${cardioHeight}px` }}
                        />
                        <div
                          className="w-6 bg-purple-500 rounded-sm transition-all duration-500"
                          style={{ height: `${strengthHeight}px` }}
                        />
                        <div
                          className="w-6 bg-orange-500 rounded-sm transition-all duration-500"
                          style={{ height: `${hybridHeight}px` }}
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
              <div className="w-4 h-4 bg-orange-primary rounded"></div>
              <span className="text-sm">Cardio</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-purple-500 rounded"></div>
              <span className="text-sm">Strength</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm">Hybrid</span>
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
              
              // Calculate cardio vs strength vs hybrid percentages from weekly data
              const totalCardio = trainingLoadData.weeklyData.reduce((sum: number, week: any) => sum + (week.cardioLoad || 0), 0)
              const totalStrength = trainingLoadData.weeklyData.reduce((sum: number, week: any) => sum + (week.strengthLoad || 0), 0)
              const totalHybrid = trainingLoadData.weeklyData.reduce((sum: number, week: any) => sum + (week.hybridLoad || 0), 0)
              const total = totalCardio + totalStrength + totalHybrid
              
              const cardioPercent = total > 0 ? Math.round((totalCardio / total) * 100) : 0
              const strengthPercent = total > 0 ? Math.round((totalStrength / total) * 100) : 0
              const hybridPercent = total > 0 ? Math.round((totalHybrid / total) * 100) : 0
              
              const currentWidth = totalCurrentLoad + totalPreviousLoad > 0 ? 
                Math.round((totalCurrentLoad / (totalCurrentLoad + totalPreviousLoad)) * 100) : 50
              const previousWidth = 100 - currentWidth

              return (
                <>
                  {/* Progress bars comparing current vs previous 3-month periods */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-orange-primary rounded"></div>
                      <span className="text-sm text-gray-300 flex-1">Last 3 months</span>
                      <span className="text-lg font-bold">{summaryData.currentPeriod.trainingLoad.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-primary rounded-full transition-all duration-500"
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
                  
                  {/* Show cardio vs strength vs hybrid breakdown for current period */}
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <div className="text-sm text-gray-400 mb-2">Training Type Breakdown (Last 3 months)</div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-primary rounded-full"></div>
                        <span className="text-sm text-gray-300">Cardio {cardioPercent}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm text-gray-300">Strength {strengthPercent}%</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm text-gray-300">Hybrid {hybridPercent}%</span>
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
          <h2 className="text-xl font-bold mb-2">Activity Time</h2>
          <p className="text-sm text-gray-400 mb-6">Weekly activity time for the past 3 months</p>
          
          {/* Y-axis labels */}
          <div className="flex mb-4">
            <div className="w-12 flex flex-col justify-between text-xs text-gray-400 h-48">
              <span>10h</span>
              <span>8h</span>
              <span>6h</span>
              <span>4h</span>
              <span>2h</span>
              <span>0h</span>
            </div>
            
            {/* Chart Area */}
            <div className="flex-1">
              <div className="flex items-end justify-between h-48 mb-4 border-l border-gray-700">
                {trainingLoadData.weeklyData.slice(-12).map((week: any, index: number) => {
                  const weeklyTimes = trainingLoadData.weeklyData.map((w: any) => w.activityTime || 0)
                  const maxTime = Math.max(600, Math.max(...weeklyTimes) * 1.2)
                  const timeHeight = Math.max(((week.activityTime || 0) / maxTime) * 180, (week.activityTime || 0) > 0 ? 8 : 0)
                  
                  return (
                    <div key={index} className="flex flex-col items-center space-y-2 ml-1">
                      <div className="flex flex-col-reverse items-center">
                        <div
                          className="w-6 bg-orange-primary rounded-sm transition-all duration-500"
                          style={{ height: `${timeHeight}px` }}
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
              <div className="w-4 h-4 bg-orange-primary rounded"></div>
              <span className="text-sm">Activity Time</span>
            </div>
          </div>

          {/* Summary */}
          <div className="border-t border-gray-700 pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">Last 3 Months ({formatChange(summaryData.currentPeriod.activityTime, summaryData.previousPeriod.activityTime)})</span>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{formatTime(summaryData.currentPeriod.activityTime)}</div>
              <div className="text-sm text-gray-400">vs. previous 6 months</div>
              <div className="text-lg text-gray-300">{formatTime(summaryData.previousPeriod.activityTime)}</div>
            </div>
          </div>
        </div>

        {/* Category Breakdown Widget */}
        <div className="bg-gray-800 rounded-2xl p-6 text-white">
          <h2 className="text-xl font-bold mb-2">Training by Category</h2>
          <p className="text-sm text-gray-400 mb-6">Training load breakdown by category (3-month comparison)</p>
          
          {/* Category bars */}
          <div className="space-y-6">
            {/* Strength */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium text-white">Strength</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {categoryData.currentPeriod.strength.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatChange(categoryData.currentPeriod.strength, categoryData.previousPeriod.strength)}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                {/* Current period bar */}
                <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.max(categoryData.currentPeriod.total > 0 ? (categoryData.currentPeriod.strength / Math.max(categoryData.currentPeriod.total, categoryData.previousPeriod.total)) * 100 : 0, 5)}%` 
                    }}
                  />
                </div>
                {/* Previous period bar */}
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-300 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.max(categoryData.previousPeriod.total > 0 ? (categoryData.previousPeriod.strength / Math.max(categoryData.currentPeriod.total, categoryData.previousPeriod.total)) * 100 : 0, 5)}%` 
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Last 3 months: {categoryData.currentPeriod.strength.toLocaleString()}</span>
                <span>Previous: {categoryData.previousPeriod.strength.toLocaleString()}</span>
              </div>
            </div>

            {/* Cardio */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-primary rounded-full"></div>
                  <span className="text-sm font-medium text-white">Cardio</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {categoryData.currentPeriod.cardio.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatChange(categoryData.currentPeriod.cardio, categoryData.previousPeriod.cardio)}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                {/* Current period bar */}
                <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-primary rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.max(categoryData.currentPeriod.total > 0 ? (categoryData.currentPeriod.cardio / Math.max(categoryData.currentPeriod.total, categoryData.previousPeriod.total)) * 100 : 0, 5)}%` 
                    }}
                  />
                </div>
                {/* Previous period bar */}
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-300 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.max(categoryData.previousPeriod.total > 0 ? (categoryData.previousPeriod.cardio / Math.max(categoryData.currentPeriod.total, categoryData.previousPeriod.total)) * 100 : 0, 5)}%` 
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Last 3 months: {categoryData.currentPeriod.cardio.toLocaleString()}</span>
                <span>Previous: {categoryData.previousPeriod.cardio.toLocaleString()}</span>
              </div>
            </div>

            {/* Hybrid */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-white">Hybrid</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">
                    {categoryData.currentPeriod.hybrid.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">
                    {formatChange(categoryData.currentPeriod.hybrid, categoryData.previousPeriod.hybrid)}
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                {/* Current period bar */}
                <div className="w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.max(categoryData.currentPeriod.total > 0 ? (categoryData.currentPeriod.hybrid / Math.max(categoryData.currentPeriod.total, categoryData.previousPeriod.total)) * 100 : 0, 5)}%` 
                    }}
                  />
                </div>
                {/* Previous period bar */}
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-300 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.max(categoryData.previousPeriod.total > 0 ? (categoryData.previousPeriod.hybrid / Math.max(categoryData.currentPeriod.total, categoryData.previousPeriod.total)) * 100 : 0, 5)}%` 
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Last 3 months: {categoryData.currentPeriod.hybrid.toLocaleString()}</span>
                <span>Previous: {categoryData.previousPeriod.hybrid.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="border-t border-gray-700 pt-4 mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-300">Total Load Comparison</span>
              <span className="text-lg font-semibold text-white">
                {formatChange(categoryData.currentPeriod.total, categoryData.previousPeriod.total)}
              </span>
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Last 3 months: {categoryData.currentPeriod.total.toLocaleString()}</span>
              <span>Previous 3 months: {categoryData.previousPeriod.total.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Total Distance Widget */}
        <div className="bg-dark-elevated1 rounded-2xl p-6 shadow-sm border border-dark-border">
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
              <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                {formatChange(summaryData.currentPeriod.totalDistance, summaryData.previousPeriod.totalDistance)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                vs. previous 3 months
              </div>
            </div>
          </div>

          <div className="bg-dark-elevated rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Previous Period</span>
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                {summaryData.previousPeriod.totalDistance.toFixed(1)} km
              </span>
            </div>
          </div>
        </div>

        {/* Total Weight Widget */}
        <div className="bg-dark-elevated1 rounded-2xl p-6 shadow-sm border border-dark-border">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Total Weight Lifted</h2>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {summaryData.currentPeriod.totalWeight.toLocaleString()} kgs
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last 3 months
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-orange-primary">
                {formatChange(summaryData.currentPeriod.totalWeight, summaryData.previousPeriod.totalWeight)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                vs. previous 3 months
              </div>
            </div>
          </div>

          <div className="bg-dark-elevated rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">Previous Period</span>
              <span className="text-lg font-medium text-gray-900 dark:text-white">
                {summaryData.previousPeriod.totalWeight.toLocaleString()} kgs
              </span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="bg-dark-elevated1 rounded-2xl p-6 shadow-sm border border-dark-border">
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
      </PullToRefresh>
    </div>
  )
}

export default AnalyticsPage
