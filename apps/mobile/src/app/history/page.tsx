'use client'
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { trpc } from '../../lib/trpc'
import { CalendarIcon, ClockIcon, PlayIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'

export default function HistoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'strength' | 'cardio'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Calculate offset for pagination
  const offset = (currentPage - 1) * pageSize

  // Fetch user's recent sessions with pagination
  const { data: recentSessions = [], isLoading, error } = trpc.sessions.list.useQuery({
    category: selectedFilter === 'all' ? undefined : selectedFilter,
    offset,
    limit: pageSize
  }, {
    enabled: !!user,
    retry: 2
  })

  // For now, use approximate count based on returned data
  const totalCount = recentSessions.length === pageSize ? (currentPage * pageSize) + 1 : (currentPage - 1) * pageSize + recentSessions.length

  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 0

  // Reset to page 1 when filter changes
  const handleFilterChange = (filter: 'all' | 'strength' | 'cardio') => {
    setSelectedFilter(filter)
    setCurrentPage(1)
  }

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page)
  }

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatDuration = (startedAt: string, completedAt: string | null) => {
    if (!completedAt) return null // Don't show duration for incomplete workouts
    
    const start = new Date(startedAt)
    const end = new Date(completedAt)
    const durationMs = end.getTime() - start.getTime()
    const minutes = Math.floor(durationMs / (1000 * 60))
    
    if (minutes < 60) {
      return `${minutes} min`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMinutes = minutes % 60
      return `${hours}h ${remainingMinutes}m`
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'cardio':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'hybrid':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Please log in to view your workout history
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  Workout History
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Track your fitness journey and progress over time
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="mt-6">
              <nav className="flex space-x-8">
                {[
                  { key: 'all', label: 'All Workouts' },
                  { key: 'strength', label: 'Strength' },
                  { key: 'cardio', label: 'Cardio' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleFilterChange(tab.key as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      selectedFilter === tab.key
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">
              Error loading workout history. Please try again.
            </p>
          </div>
        ) : !recentSessions || recentSessions.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              No workouts yet
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Start your fitness journey by logging your first workout!
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {recentSessions.map((session: any) => (
                <div
                  key={session.session_id}
                  onClick={() => router.push(`/training/view/${session.session_id}`)}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Workout Name */}
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {session.name || `${session.category.charAt(0).toUpperCase() + session.category.slice(1)} Workout`}
                      </h3>
                      
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(session.category)}`}>
                          {session.category.charAt(0).toUpperCase() + session.category.slice(1)}
                        </span>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {formatDate(session.started_at)}
                        </div>
                        {formatDuration(session.started_at, session.completed_at) && (
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <ClockIcon className="w-4 h-4 mr-1" />
                            {formatDuration(session.started_at, session.completed_at)}
                          </div>
                        )}
                      </div>

                      {session.notes && (
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {session.notes}
                        </p>
                      )}

                      <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        {session.training_load && (
                          <span>Training Load: {session.training_load}</span>
                        )}
                        {session.perceived_exertion && (
                          <span>RPE: {session.perceived_exertion}/10</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center">
                      {/* Click indicator */}
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPrevPage}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  
                  <div className="flex items-center space-x-1">
                    {/* Show page numbers */}
                    {(() => {
                      const pages = []
                      const showPages = 5 // Show max 5 page numbers
                      let startPage = Math.max(1, currentPage - Math.floor(showPages / 2))
                      let endPage = Math.min(totalPages, startPage + showPages - 1)
                      
                      // Adjust start page if we're near the end
                      if (endPage - startPage + 1 < showPages) {
                        startPage = Math.max(1, endPage - showPages + 1)
                      }
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <button
                            key={i}
                            onClick={() => goToPage(i)}
                            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                              i === currentPage
                                ? 'bg-blue-600 text-white border border-blue-600'
                                : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {i}
                          </button>
                        )
                      }
                      return pages
                    })()}
                  </div>
                  
                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}