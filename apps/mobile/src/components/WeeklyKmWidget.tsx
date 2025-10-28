'use client'
import React from 'react'
import { trpc } from '../lib/trpc'

interface WeeklyKmWidgetProps {
  selectedWeekStart?: Date
}

export function WeeklyKmWidget({ selectedWeekStart }: WeeklyKmWidgetProps) {
  // Helper function to get Monday of a week
  const getMondayOfWeek = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }
  
  // Prepare the week parameter for the API
  const weekParam = selectedWeekStart ? selectedWeekStart.toISOString().split('T')[0] : undefined
  
  const weeklyKmQuery = trpc.statistics.getWeeklyKm.useQuery(
    weekParam ? { weekStart: weekParam } : undefined,
    {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  if (weeklyKmQuery.isLoading) {
    return (
      <div className="bg-gradient-to-br from-teal-600 to-cyan-700 dark:from-teal-700 dark:to-cyan-800 rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-orange-primary rounded w-24 mb-4"></div>
          <div className="h-10 bg-orange-primary rounded w-32 mb-2"></div>
          <div className="h-3 bg-orange-primary rounded w-20"></div>
        </div>
      </div>
    )
  }

  if (weeklyKmQuery.isError || !weeklyKmQuery.data) {
    return (
      <div className="bg-gradient-to-br from-teal-600 to-cyan-700 dark:from-teal-700 dark:to-cyan-800 rounded-xl shadow-lg p-6">
        <div className="text-center text-teal-100">
          <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs">Failed to load</p>
        </div>
      </div>
    )
  }

  const data = weeklyKmQuery.data
  const percentageChange = data.previousWeek > 0 
    ? ((data.selectedWeek - data.previousWeek) / data.previousWeek) * 100 
    : data.selectedWeek > 0 ? 100 : 0

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  return (
    <div className="bg-gradient-to-br from-teal-600 to-cyan-700 dark:from-teal-700 dark:to-cyan-800 rounded-xl shadow-lg p-6 border border-teal-500 dark:border-teal-600">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <svg className="w-5 h-5 text-teal-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-sm font-medium text-teal-100">Selected Week</span>
      </div>

      {/* Main Value */}
      <div className="mb-2">
        <div className="flex items-baseline space-x-2">
          <span className="text-4xl font-bold text-white">
            {(data.selectedWeek / 1000).toFixed(1)}
          </span>
          <span className="text-lg text-teal-100">Km</span>
        </div>
        <div className="text-xs text-teal-200 mt-1">Selected week</div>
      </div>

      {/* Comparison */}
      <div className="flex items-center justify-between pt-4 border-t border-teal-500">
        <div>
          <div className="text-sm font-medium text-teal-200">Previous Week</div>
          <div className="text-lg font-semibold text-white">
            {(data.previousWeek / 1000).toFixed(1)} Km
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          percentageChange > 0
            ? 'text-green-200 bg-green-800/40' 
            : percentageChange === 0
            ? 'text-teal-100 bg-teal-700/40'
            : 'text-red-200 bg-red-800/40'
        }`}>
          {formatChange(percentageChange)}
        </div>
      </div>
    </div>
  )
}
