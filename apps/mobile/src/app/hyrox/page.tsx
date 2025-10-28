'use client'

/**
 * Hyrox PR Tracker Page
 * 
 * Tracks personal records for the 9 Hyrox exercises:
 * - 1km RUN (x8 for total)
 * - 1km SKI
 * - 50m SLED PUSH
 * - 50m SLED PULL
 * - 80m BURPEE BROAD JUMP
 * - 1km ROW
 * - 200m FARMERS CARRY
 * - 100m SANDBAG LUNGES
 * - 100 WALLBALLS
 * 
 * Features:
 * - Display top 10 best efforts
 * - Show total FOR TIME calculation
 * - Time format: min:sec
 * - Click exercise to view details
 */

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { trpc } from '../../lib/trpc'
import { TrophyIcon, ClockIcon, PlusIcon } from '@heroicons/react/24/outline'
import { PullToRefresh } from '../../components/PullToRefresh'
import Link from 'next/link'
import { Header } from '../../components/Navigation'

// Hyrox exercise definitions
const HYROX_EXERCISES = [
  { name: '1km Run', distance: '1km', multiplier: 8 },
  { name: '1km Ski', distance: '1km', multiplier: 1 },
  { name: '50m Sled Push', distance: '50m', multiplier: 1 },
  { name: '50m Sled Pull', distance: '50m', multiplier: 1 },
  { name: '80m Burpee Broad Jump', distance: '80m', multiplier: 1 },
  { name: '1km Row', distance: '1km', multiplier: 1 },
  { name: '200m Farmers Carry', distance: '200m', multiplier: 1 },
  { name: '100m Sandbag Lunges', distance: '100m', multiplier: 1 },
  { name: '100 Wall Balls', distance: '100 reps', multiplier: 1 }
] as const

// Convert seconds to mm:ss format
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Parse time string (supports various formats) to seconds
const parseTimeToSeconds = (timeStr: string): number => {
  // Handle formats like "1:24:49", "04:43", "209", etc.
  const parts = timeStr.split(':').map(p => parseInt(p.trim()))
  
  if (parts.length === 3) {
    // H:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1]
  } else if (parts.length === 1) {
    // Just seconds
    return parts[0]
  }
  
  return 0
}

function HyroxTrackerPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [activeFilter, setActiveFilter] = useState<string>('All exercises')

  // Fetch Hyrox records
  const { data: hyroxRecords = [], isLoading, error, refetch } = trpc.hyrox.list.useQuery(undefined, {
    enabled: !!user,
    retry: 2
  })
  
  const { data: stats } = trpc.hyrox.getStats.useQuery(undefined, {
    enabled: !!user
  })

  // Map Hyrox records to exercise list
  const hyroxData = useMemo(() => {
    const exerciseMap = new Map<string, any>()
    
    // Initialize all exercises
    HYROX_EXERCISES.forEach(hyroxEx => {
      exerciseMap.set(hyroxEx.name, {
        name: hyroxEx.name,
        distance: hyroxEx.distance,
        multiplier: hyroxEx.multiplier,
        timeInSeconds: 0,
        formattedTime: '--:--',
        pr: null
      })
    })
    
    // Fill in data from actual records
    hyroxRecords.forEach(record => {
      const timeInSeconds = record.currentTimeSeconds
      exerciseMap.set(record.exerciseName, {
        name: record.exerciseName,
        distance: record.distance,
        multiplier: record.multiplier,
        timeInSeconds,
        formattedTime: formatTime(timeInSeconds),
        pr: record,
        historyCount: record.historyCount
      })
    })
    
    return Array.from(exerciseMap.values())
  }, [hyroxRecords])

  // Calculate total FOR TIME (including 8x run)
  const totalTime = useMemo(() => {
    let total = 0
    hyroxData.forEach(ex => {
      if (ex.timeInSeconds > 0) {
        total += ex.timeInSeconds * ex.multiplier
      }
    })
    return total
  }, [hyroxData])

  // Get top 10 best efforts (exercises with PRs, sorted by time)
  const top10Efforts = useMemo(() => {
    return hyroxData
      .filter(ex => ex.timeInSeconds > 0)
      .sort((a, b) => a.timeInSeconds - b.timeInSeconds)
      .slice(0, 10)
  }, [hyroxData])

  // Pull-to-refresh handler
  const handleRefresh = async () => {
    await refetch()
  }

  // Format total time as H:MM:SS
  const formatTotalTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            Please log in to view Hyrox tracker
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-20">
      <Header 
        title="Hyrox Tracker" 
        showBack 
        onBack={() => router.push('/dashboard')} 
      />

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="pt-16 px-4">
          {/* Add Record Button */}
          <div className="mb-4">
            <Link
              href="/hyrox/add-record"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
            >
              <PlusIcon className="h-5 w-5 inline-block mr-2" />
              Add Record
            </Link>
          </div>

          {/* Time Display */}
          <div className="text-center py-6">
            <div className="text-sm text-gray-400 mb-2">00:45</div>
          </div>

          {/* Top 10 Best Efforts */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-300">10 Best Efforts</h2>
              <button className="text-yellow-500 text-sm font-medium">View all</button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {top10Efforts.slice(0, 3).map((effort, index) => (
                <Link 
                  key={effort.name}
                  href={effort.pr ? `/prs/${effort.pr.prId}` : '#'}
                  className="block"
                >
                  <div className="bg-gray-800 rounded-lg p-3 text-center">
                    <div className="bg-yellow-500 text-gray-900 rounded-md px-2 py-1 text-xs font-bold mb-2 inline-block">
                      CURRENT PB
                    </div>
                    <div className="text-xl font-bold mb-1">{effort.formattedTime}</div>
                    <div className="flex items-center justify-center mb-1">
                      <div className="bg-yellow-500 rounded-full w-6 h-6 flex items-center justify-center text-gray-900 font-bold text-sm">
                        {index + 1}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400">{effort.distance}</div>
                    <div className="text-xs text-gray-300 mt-1">{effort.name}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Summary Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-300 mb-4">Summary</h2>
            
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-gray-400 text-sm">#</div>
                  <div className="text-gray-400 text-sm">TYPE</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-gray-400 text-sm">TIME</div>
                  <div className="text-gray-400 text-sm">HR</div>
                </div>
              </div>

              <div className="mt-3 bg-emerald-600 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="text-white font-medium">1</div>
                  <div className="text-white font-bold">FOR TIME</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-white font-bold">{formatTotalTime(totalTime)}</div>
                  <div className="text-white">--</div>
                </div>
              </div>
            </div>
          </div>

          {/* FOR TIME Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-300 mb-4">FOR TIME - {formatTotalTime(totalTime)}</h3>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {['All', 'All exercises', 'Run', 'Ski', 'Sled Push', 'Sled Pull', 'Burpee Broad Jump', 'Row', 'Farmers Carry', 'Sandbag Lunge', 'Wall Ball', 'Transition'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    activeFilter === filter
                      ? 'bg-yellow-500 text-gray-900'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            {/* Exercise List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2 px-2">
                <div className="flex items-center space-x-4">
                  <div className="w-6">#</div>
                  <div>TYPE</div>
                </div>
                <div className="flex items-center space-x-6">
                  <div>TIME</div>
                  <div>HR</div>
                </div>
              </div>

              {hyroxData.map((exercise, index) => {
                // Convert exercise name to URL-friendly slug
                const slug = exercise.name.toLowerCase()
                  .replace(/\s+/g, '-')
                  .replace('1km-', '')
                  .replace('50m-', '')
                  .replace('80m-', '')
                  .replace('100m-', '')
                  .replace('200m-', '')
                  .replace('100-', '')
                
                return (
                  <Link
                    key={exercise.name}
                    href={`/hyrox/${slug}`}
                    className="block"
                  >
                    <div className="bg-emerald-600 rounded-lg p-3 hover:bg-emerald-700 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <div className="text-white font-medium w-6">{index + 1}</div>
                          <div className="text-white font-medium flex-1">
                            {exercise.name}
                            {exercise.multiplier > 1 && (
                              <span className="ml-2 text-xs text-emerald-200">
                                (x{exercise.multiplier})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-white font-bold min-w-[60px] text-right">
                            {exercise.formattedTime}
                          </div>
                          <div className="text-white w-8 text-right">--</div>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Info Text */}
          <div className="text-center text-xs text-gray-500 mt-8 pb-4">
            <p>Click on any exercise to view or add records</p>
            <p className="mt-1">Run time is multiplied by 8 for total calculation</p>
          </div>
        </div>
      </PullToRefresh>
    </div>
  )
}

export default withAuth(HyroxTrackerPage)
