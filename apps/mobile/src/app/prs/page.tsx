'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { trpc } from '../../lib/trpc'
import { TrophyIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '@heroicons/react/24/outline'
import { PullToRefresh } from '../../components/PullToRefresh'
import Link from 'next/link'

function PersonalRecordsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'strength' | 'cardio'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // Calculate offset for pagination
  const offset = (currentPage - 1) * pageSize

  // Fetch user's PRs with pagination
  const { data: prs = [], isLoading, error, refetch } = trpc.personalRecords.list.useQuery({
    category: selectedFilter === 'all' ? undefined : selectedFilter,
    offset,
    limit: pageSize
  }, {
    enabled: !!user,
    retry: 2
  })

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    await refetch()
  }

  // For now, use approximate count based on returned data
  const totalCount = prs.length === pageSize ? (currentPage * pageSize) + 1 : (currentPage - 1) * pageSize + prs.length
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 0

  // Reset to page 1 when filter changes
  const handleFilterChange = (filter: 'all' | 'strength' | 'cardio') => {
    setSelectedFilter(filter)
    setCurrentPage(1)
  }

  // Pagination handlers
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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'cardio':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Please log in to view your personal records
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Personal Records - PR's
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Track your personal bests and achievements
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="mt-6">
              <nav className="flex space-x-8">
                {[
                  { key: 'all', label: 'All Records' },
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

      {/* Main Content */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Error loading personal records
                  </h3>
                  <p className="mt-2 text-sm text-red-700 dark:text-red-300">
                    {error.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && prs.length === 0 && (
            <div className="text-center py-12">
              <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No personal records
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by adding your first PR
              </p>
              <div className="mt-6">
                <Link href="/prs/new">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    <PlusIcon className="h-5 w-5 mr-2" />
                    Add Personal Record
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* PR List */}
          {!isLoading && !error && prs.length > 0 && (
            <div className="space-y-4">
              {prs.map((pr) => (
                <Link key={pr.prId} href={`/prs/${pr.prId}`}>
                  <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                              {pr.exerciseName}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(pr.category)}`}>
                              {pr.category}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {pr.metricName}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            {pr.currentValue} {pr.currentUnit}
                          </div>
                          <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span>{formatDate(pr.currentDate)}</span>
                            {pr.recordCount > 1 && (
                              <span className="ml-4">
                                {pr.recordCount} records
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {pr.notes && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {pr.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !error && prs.length > 0 && (
            <div className="mt-8 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={prs.length < pageSize}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Page <span className="font-medium">{currentPage}</span>
                    {totalPages > 0 && (
                      <>
                        {' '}of <span className="font-medium">{totalPages}</span>
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={goToNextPage}
                      disabled={prs.length < pageSize}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* Add PR Button - Fixed at bottom */}
          <div className="mt-8">
            <Link href="/prs/new">
              <button className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Personal Record
              </button>
            </Link>
          </div>
        </div>
      </PullToRefresh>
    </div>
  )
}

export default withAuth(PersonalRecordsPage)
