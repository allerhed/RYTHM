'use client'
import React from 'react'
import { trpc } from '../lib/trpc'

interface WeeklyKgWidgetProps {
  selectedWeekStart?: Date
}

export function WeeklyKgWidget({ selectedWeekStart }: WeeklyKgWidgetProps) {
  // Helper function to get Monday of a week
  const getMondayOfWeek = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }
  
  // Prepare the week parameter for the API
  const weekParam = selectedWeekStart ? selectedWeekStart.toISOString().split('T')[0] : undefined
  
  const weeklyKgQuery = trpc.statistics.getWeeklyKg.useQuery(
    weekParam ? { weekStart: weekParam } : undefined,
    {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  )

  if (weeklyKgQuery.isLoading) {
    return (
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-slate-600 rounded w-24 mb-4"></div>
          <div className="h-10 bg-slate-600 rounded w-32 mb-2"></div>
          <div className="h-3 bg-slate-600 rounded w-20"></div>
        </div>
      </div>
    )
  }

  if (weeklyKgQuery.isError || !weeklyKgQuery.data) {
    return (
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg p-6">
        <div className="text-center text-slate-300">
          <svg className="w-6 h-6 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs">Failed to load</p>
        </div>
      </div>
    )
  }

  const data = weeklyKgQuery.data
  const percentageChange = data.previousWeek > 0 
    ? ((data.selectedWeek - data.previousWeek) / data.previousWeek) * 100 
    : data.selectedWeek > 0 ? 100 : 0

  const formatChange = (change: number) => {
    const sign = change > 0 ? '+' : ''
    return `${sign}${change.toFixed(1)}%`
  }

  return (
    <div className="bg-gradient-to-br from-slate-700 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-xl shadow-lg p-6 border border-slate-600 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <span className="text-sm font-medium text-slate-300">Selected Week</span>
      </div>

      {/* Main Value */}
      <div className="mb-2">
        <div className="flex items-baseline space-x-2">
          <span className="text-4xl font-bold text-white">
            {Math.round(data.selectedWeek)}
          </span>
          <span className="text-lg text-slate-300">Kg</span>
        </div>
        <div className="text-xs text-slate-400 mt-1">Selected week</div>
      </div>

      {/* Comparison */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-600">
        <div>
          <div className="text-sm font-medium text-slate-400">Previous Week</div>
          <div className="text-lg font-semibold text-slate-200">
            {Math.round(data.previousWeek)} Kg
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          percentageChange > 0
            ? 'text-green-300 bg-green-900/30' 
            : percentageChange === 0
            ? 'text-slate-300 bg-slate-700/30'
            : 'text-red-300 bg-red-900/30'
        }`}>
          {formatChange(percentageChange)}
        </div>
      </div>
    </div>
  )
}
