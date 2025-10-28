'use client'

/**
 * Add Hyrox Record Page
 * 
 * Allows users to add a new record for any Hyrox exercise.
 * Features:
 * - Exercise selection dropdown
 * - Time input in mm:ss format
 * - Optional heart rate input
 * - Optional notes
 * - Date picker
 */

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { trpc } from '../../../lib/trpc'
import { Header } from '../../../components/Navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

// Hyrox exercise types
const HYROX_EXERCISES = [
  { value: '1KM_RUN', label: '1km Run', distance: '1km' },
  { value: '1KM_SKI', label: '1km Ski', distance: '1km' },
  { value: '50M_SLED_PUSH', label: '50m Sled Push', distance: '50m' },
  { value: '50M_SLED_PULL', label: '50m Sled Pull', distance: '50m' },
  { value: '80M_BURPEE_BROAD_JUMP', label: '80m Burpee Broad Jump', distance: '80m' },
  { value: '1KM_ROW', label: '1km Row', distance: '1km' },
  { value: '200M_FARMERS_CARRY', label: '200m Farmers Carry', distance: '200m' },
  { value: '100M_SANDBAG_LUNGES', label: '100m Sandbag Lunges', distance: '100m' },
  { value: '100_WALL_BALLS', label: '100 Wall Balls', distance: '100 reps' }
] as const

function AddRecordPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [exerciseType, setExerciseType] = useState('')
  const [timeMinutes, setTimeMinutes] = useState('')
  const [timeSeconds, setTimeSeconds] = useState('')
  const [heartRate, setHeartRate] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const utils = trpc.useUtils()
  const upsertMutation = trpc.hyrox.upsertRecord.useMutation({
    onSuccess: () => {
      utils.hyrox.list.invalidate()
      utils.hyrox.getStats.invalidate()
      router.push('/hyrox')
    },
    onError: (error) => {
      setError(error.message || 'Failed to save record')
      setIsSubmitting(false)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    // Validation
    if (!exerciseType) {
      setError('Please select an exercise')
      setIsSubmitting(false)
      return
    }

    const mins = parseInt(timeMinutes) || 0
    const secs = parseInt(timeSeconds) || 0

    if (mins === 0 && secs === 0) {
      setError('Please enter a valid time')
      setIsSubmitting(false)
      return
    }

    if (secs >= 60) {
      setError('Seconds must be less than 60')
      setIsSubmitting(false)
      return
    }

    const totalSeconds = mins * 60 + secs

    if (totalSeconds <= 0) {
      setError('Time must be greater than 0')
      setIsSubmitting(false)
      return
    }

    // Validate heart rate if provided
    const hr = heartRate ? parseInt(heartRate) : undefined
    if (hr !== undefined && (hr < 40 || hr > 300)) {
      setError('Heart rate must be between 40 and 300 bpm')
      setIsSubmitting(false)
      return
    }

    try {
      await upsertMutation.mutateAsync({
        exerciseType: exerciseType as any,
        timeSeconds: totalSeconds,
        achievedDate: new Date(date),
        heartRate: hr,
        notes: notes.trim() || undefined
      })
    } catch (err) {
      // Error handled by onError callback
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            Please log in to add Hyrox records
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Header title="Add Hyrox Record" />
      
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Back Button */}
        <Link 
          href="/hyrox"
          className="inline-flex items-center text-orange-primary hover:text-orange-hover dark:hover:text-blue-300 mb-6"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Hyrox Tracker
        </Link>

        {/* Page Title */}
        <h1 className="text-3xl font-bold text-text-primary mb-6">
          Add Hyrox Record
        </h1>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Exercise Selection */}
          <div>
            <label 
              htmlFor="exercise" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Exercise <span className="text-red-500">*</span>
            </label>
            <select
              id="exercise"
              value={exerciseType}
              onChange={(e) => setExerciseType(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-dark-elevated1 border border-dark-border text-text-primary focus:outline-none focus:ring-2 focus:ring-orange-primary focus:border-transparent transition-colors"
              required
            >
              <option value="">Select an exercise</option>
              {HYROX_EXERCISES.map(ex => (
                <option key={ex.value} value={ex.value}>
                  {ex.label} ({ex.distance})
                </option>
              ))}
            </select>
          </div>

          {/* Time Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="00"
                  min="0"
                  value={timeMinutes}
                  onChange={(e) => setTimeMinutes(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-dark-elevated1 border border-dark-border text-text-primary focus:outline-none focus:ring-2 focus:ring-orange-primary focus:border-transparent text-center text-xl transition-colors"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">minutes</p>
              </div>
              <span className="text-2xl font-bold text-gray-400 dark:text-gray-500">:</span>
              <div className="flex-1">
                <input
                  type="number"
                  placeholder="00"
                  min="0"
                  max="59"
                  value={timeSeconds}
                  onChange={(e) => setTimeSeconds(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-dark-elevated1 border border-dark-border text-text-primary focus:outline-none focus:ring-2 focus:ring-orange-primary focus:border-transparent text-center text-xl transition-colors"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-1">seconds</p>
              </div>
            </div>
          </div>

          {/* Date Input */}
          <div>
            <label 
              htmlFor="date" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 rounded-lg bg-dark-elevated1 border border-dark-border text-text-primary focus:outline-none focus:ring-2 focus:ring-orange-primary focus:border-transparent transition-colors"
              required
            />
          </div>

          {/* Heart Rate Input */}
          <div>
            <label 
              htmlFor="heartRate" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Heart Rate (optional)
            </label>
            <div className="relative">
              <input
                type="number"
                id="heartRate"
                placeholder="165"
                min="40"
                max="300"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-dark-elevated1 border border-dark-border text-text-primary focus:outline-none focus:ring-2 focus:ring-orange-primary focus:border-transparent transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400">
                bpm
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Average heart rate during the exercise
            </p>
          </div>

          {/* Notes Input */}
          <div>
            <label 
              htmlFor="notes" 
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Notes (optional)
            </label>
            <textarea
              id="notes"
              rows={4}
              placeholder="How did it feel? Any observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-dark-elevated1 border border-dark-border text-text-primary focus:outline-none focus:ring-2 focus:ring-orange-primary focus:border-transparent resize-none transition-colors"
            />
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Record'}
            </button>
            <Link
              href="/hyrox"
              className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-text-primary font-medium py-3 px-6 rounded-lg transition-colors text-center"
            >
              Cancel
            </Link>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            💡 Tip
          </h3>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            Your record will only be updated if this time is better (faster) than your current best. 
            All attempts are saved in your history regardless.
          </p>
        </div>
      </div>
    </div>
  )
}

export default withAuth(AddRecordPage)
