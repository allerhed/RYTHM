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
        return 'badge-strength'
      case 'cardio':
        return 'badge-cardio'
      case 'hybrid':
        return 'badge-hybrid'
      default:
        return 'badge-secondary'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            Please log in to view your personal records
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary pb-20">
      {/* Header (Migration: gradient removed) */}
      <div className="bg-dark-elevated1 shadow-sm border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div>
              <h1 className="text-3xl font-bold text-text-primary">
                Personal Records - PR's
              </h1>
              <p className="mt-2 text-sm text-text-secondary">
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
                        ? 'border-orange-primary text-orange-primary'
                        : 'border-transparent text-text-secondary hover:text-text-primary'
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-primary"></div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="rounded-md bg-error-soft p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-error" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-error">
                    Error loading personal records
                  </h3>
                  <p className="mt-2 text-sm text-error">
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
              <h3 className="mt-2 text-sm font-medium text-text-primary">
                No personal records
              </h3>
              <p className="mt-1 text-sm text-text-secondary">
                Get started by adding your first PR
              </p>
              <div className="mt-6">
                <Link href="/prs/new">
                  <button className="btn btn-primary inline-flex items-center">
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
                  <div className="bg-dark-elevated1 shadow-sm rounded-lg border border-dark-border hover:border-orange-primary/50 transition-colors cursor-pointer">
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-lg font-semibold text-text-primary truncate">
                              {pr.exerciseName}
                            </h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(pr.category)}`}>
                              {pr.category}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-text-secondary">
                            {pr.metricName}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-end justify-between">
                        <div>
                          <div className="text-3xl font-bold text-orange-primary">
                            {pr.currentValue} {pr.currentUnit}
                          </div>
                          <div className="mt-1 flex items-center text-sm text-text-secondary">
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
                        <p className="mt-3 text-sm text-text-secondary line-clamp-2">
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
            <div className="mt-8 flex items-center justify-between border-t border-dark-border pt-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-dark-border text-sm font-medium rounded-md text-text-primary bg-dark-elevated1 hover:border-orange-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={goToNextPage}
                  disabled={prs.length < pageSize}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-dark-border text-sm font-medium rounded-md text-text-primary bg-dark-elevated1 hover:border-orange-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-text-primary">
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
                      className="btn btn-secondary rounded-r-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={goToNextPage}
                      disabled={prs.length < pageSize}
                      className="btn btn-secondary rounded-l-none text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
              <button className="btn btn-primary w-full inline-flex items-center justify-center">
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
