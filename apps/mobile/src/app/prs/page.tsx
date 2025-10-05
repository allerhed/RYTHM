'use client';

/**
 * Personal Records List Page
 * 
 * Features:
 * - List view of all personal records
 * - Filter by category (all, strength, cardio)
 * - Display exercise name, metric, current value/unit, date
 * - Category badge for visual identification
 * - Navigation to detail page
 * - Pull to refresh
 * - Pagination support
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '../../lib/trpc';
import Link from 'next/link';
import { PullToRefresh } from '../../components/PullToRefresh';
import { Header } from '../../components/Navigation';

type CategoryFilter = 'all' | 'strength' | 'cardio';

export default function PersonalRecordsPage() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<CategoryFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Calculate offset based on current page
  const offset = (currentPage - 1) * pageSize;

  // Fetch PRs with filtering
  const { data: prs, isLoading, error, refetch } = trpc.personalRecords.list.useQuery({
    category: selectedFilter === 'all' ? undefined : selectedFilter,
    offset,
    limit: pageSize,
  });

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedFilter]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'strength':
        return 'bg-blue-500 text-white';
      case 'cardio':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleRefresh = async () => {
    await refetch();
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => prev + 1);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Personal Records - PR's" />

      <div className="pt-16 pb-20">
        <PullToRefresh onRefresh={handleRefresh}>
          {/* Filter buttons */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-16 z-10">
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedFilter('strength')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedFilter === 'strength'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Strength
              </button>
              <button
                onClick={() => setSelectedFilter('cardio')}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedFilter === 'cardio'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cardio
              </button>
            </div>
          </div>

          {/* Add PR button */}
          <div className="px-4 py-3 bg-white border-b border-gray-200">
            <Link href="/prs/new">
              <button className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                + Add Personal Record
              </button>
            </Link>
          </div>

          {/* Loading state */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error loading personal records</p>
              <p className="text-red-600 text-sm mt-1">{error.message}</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && prs && prs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-gray-600 font-medium mb-1">No personal records yet</p>
              <p className="text-gray-500 text-sm text-center mb-4">
                Start tracking your progress by adding your first PR
              </p>
              <Link href="/prs/new">
                <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                  Add Your First PR
                </button>
              </Link>
            </div>
          )}

          {/* PR list */}
          {!isLoading && !error && prs && prs.length > 0 && (
            <div className="divide-y divide-gray-200">
              {prs.map((pr) => (
                <Link key={pr.prId} href={`/prs/${pr.prId}`}>
                  <div className="bg-white px-4 py-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{pr.exerciseName}</h3>
                        <p className="text-sm text-gray-600 mt-0.5">{pr.metricName}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getCategoryBadgeClass(
                          pr.category
                        )}`}
                      >
                        {pr.category}
                      </span>
                    </div>

                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-2xl font-bold text-indigo-600">
                          {pr.currentValue} {pr.currentUnit}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(pr.currentDate)}
                        </p>
                      </div>

                      {pr.recordCount > 1 && (
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            {pr.recordCount} records
                          </p>
                        </div>
                      )}
                    </div>

                    {pr.notes && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                        {pr.notes}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination controls */}
          {!isLoading && !error && prs && prs.length > 0 && (
            <div className="bg-white border-t border-gray-200 px-4 py-4 flex items-center justify-between">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Previous
              </button>

              <span className="text-sm text-gray-600">
                Page {currentPage}
              </span>

              <button
                onClick={handleNextPage}
                disabled={prs.length < pageSize}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  prs.length < pageSize
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Next
              </button>
            </div>
          )}
        </PullToRefresh>
      </div>
    </div>
  );
}
