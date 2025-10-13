'use client'

/**
 * Hyrox Exercise Detail Page
 * 
 * Shows detailed history and statistics for a specific Hyrox exercise.
 * Features:
 * - Current best time
 * - Full history of all attempts
 * - Progress chart
 * - Delete individual records
 */

import React, { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { trpc } from '../../../lib/trpc'
import { Header } from '../../../components/Navigation'
import { ArrowLeftIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline'
import { TrophyIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

// Map URL-friendly names to enum values
const EXERCISE_MAP: Record<string, string> = {
  'run': '1KM_RUN',
  'ski': '1KM_SKI',
  'sled-push': '50M_SLED_PUSH',
  'sled-pull': '50M_SLED_PULL',
  'burpee': '80M_BURPEE_BROAD_JUMP',
  'row': '1KM_ROW',
  'farmers-carry': '200M_FARMERS_CARRY',
  'lunges': '100M_SANDBAG_LUNGES',
  'wall-balls': '100_WALL_BALLS'
}

// Format seconds to mm:ss
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Format date
const formatDate = (date: Date | string): string => {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

function ExerciseDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Get exercise type from URL parameter
  const exerciseSlug = params.exercise as string
  const exerciseType = EXERCISE_MAP[exerciseSlug]

  const utils = trpc.useUtils()
  
  // Fetch exercise data
  const { data: exerciseData, isLoading, error } = trpc.hyrox.getByExercise.useQuery(
    { exerciseType: exerciseType as any },
    { enabled: !!user && !!exerciseType }
  )

  // Delete mutation
  const deleteMutation = trpc.hyrox.deleteHistory.useMutation({
    onSuccess: () => {
      utils.hyrox.getByExercise.invalidate()
      utils.hyrox.list.invalidate()
      utils.hyrox.getStats.invalidate()
      setDeletingId(null)
    },
    onError: (error) => {
      alert('Failed to delete record: ' + error.message)
      setDeletingId(null)
    }
  })

  const handleDelete = async (historyId: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      setDeletingId(historyId)
      await deleteMutation.mutateAsync({ historyId })
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Please log in to view exercise details
          </h1>
        </div>
      </div>
    )
  }

  if (!exerciseType) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header title="Exercise Details" />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-red-600 dark:text-red-400">Invalid exercise</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header title="Loading..." />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading exercise data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header title="Error" />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <p className="text-red-600 dark:text-red-400">Error: {error.message}</p>
        </div>
      </div>
    )
  }

  if (!exerciseData) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <Header title="No Records" />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link 
            href="/hyrox"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Hyrox Tracker
          </Link>

          <div className="text-center py-12">
            <TrophyIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No records yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Add your first record for this exercise
            </p>
            <Link
              href="/hyrox/add-record"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Record
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header title={exerciseData.exerciseName} />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Link 
          href="/hyrox"
          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Hyrox Tracker
        </Link>

        {/* Exercise Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {exerciseData.exerciseName}
            </h1>
            <Link
              href="/hyrox/add-record"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Record
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{exerciseData.distance}</p>
        </div>

        {/* Current Best */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Current Best</p>
              <p className="text-5xl font-bold">{formatTime(exerciseData.currentTimeSeconds)}</p>
              <p className="text-blue-100 text-sm mt-2">
                Achieved on {formatDate(exerciseData.currentAchievedDate)}
              </p>
            </div>
            <TrophyIcon className="h-20 w-20 text-blue-200" />
          </div>
          {exerciseData.notes && (
            <div className="mt-4 pt-4 border-t border-blue-400">
              <p className="text-blue-100 text-sm">{exerciseData.notes}</p>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Attempts</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {exerciseData.history.length}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Avg Time</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {formatTime(
                exerciseData.history.reduce((sum, h) => sum + h.timeSeconds, 0) / 
                exerciseData.history.length
              )}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Multiplier</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {exerciseData.multiplier}x
            </p>
          </div>
        </div>

        {/* History */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              History ({exerciseData.history.length} attempts)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Heart Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {exerciseData.history.map((record, index) => (
                  <tr 
                    key={record.historyId}
                    className={index === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {formatDate(record.achievedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-lg font-semibold ${
                        index === 0 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {formatTime(record.timeSeconds)}
                      </span>
                      {index === 0 && (
                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                          Current Best
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {record.heartRate ? `${record.heartRate} bpm` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                      {record.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleDelete(record.historyId)}
                        disabled={deletingId === record.historyId}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50"
                        title="Delete record"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Note:</strong> Your current best is automatically calculated from all your attempts. 
            Deleting a record from history will recalculate your best time.
          </p>
        </div>
      </div>
    </div>
  )
}

export default withAuth(ExerciseDetailPage)
