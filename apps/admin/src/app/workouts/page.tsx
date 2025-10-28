'use client'
import { AdminLayout } from '@/components/AdminLayout'
import { StatsCard } from '@/components/StatsCard'
import { WorkoutDetailsModal } from '@/components/WorkoutDetailsModal'
import { apiClient, type WorkoutSession, type WorkoutSessionStats } from '@/lib/api'
import { useEffect, useState } from 'react'

export default function WorkoutsPage() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([])
  const [stats, setStats] = useState<WorkoutSessionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutSession | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in-progress'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'strength' | 'cardio' | 'hybrid'>('all')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filters: any = { page, limit: 12, status: statusFilter }
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter
      }
      
      const [sessionsData, statsData] = await Promise.all([
        apiClient.admin.getWorkoutSessions(filters),
        apiClient.admin.getWorkoutSessionStats()
      ])
      
      setSessions(sessionsData.sessions)
      setTotalPages(sessionsData.totalPages)
      setStats(statsData)
    } catch (err) {
      console.error('Error fetching workout data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load workout data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [page, statusFilter, categoryFilter])

  const handleViewDetails = (workout: WorkoutSession) => {
    setSelectedWorkout(workout)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedWorkout(null)
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
      case 'Intermediate':
        return 'badge-primary'
      case 'Advanced':
        return 'badge-danger'
      default:
        return 'bg-dark-elevated0/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
      case 'in-progress':
        return 'badge-primary'
      default:
        return 'bg-dark-elevated0/20 text-gray-400 border-gray-500/30'
    }
  }

  const getWorkoutIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hiit':
      case 'cardio':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'strength':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )
      case 'hybrid':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
    }
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="text-red-400 text-xl mb-4">⚠️ Error loading workouts</div>
            <div className="text-gray-400 mb-4">{error}</div>
            <button 
              onClick={fetchData}
              className="btn-primary"
            >
              Try Again
            </button>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Workout Management
          </h1>
          <p className="mt-2 text-gray-400">
            View and manage workout sessions across all organizations.
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Workouts"
              value={stats.totalWorkouts.toString()}
              change="+8%"
              changeType="positive"
              accent="primary"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
            <StatsCard
              title="Active Workouts"
              value={stats.activeWorkouts.toString()}
              change="+12%"
              changeType="positive"
              accent="primary"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatsCard
              title="Total Participants"
              value={stats.totalParticipants.toString()}
              change="+15%"
              changeType="positive"
              accent="primary"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              }
            />
            <StatsCard
              title="Avg. Duration"
              value={`${stats.avgDuration} min`}
              change="+2%"
              changeType="positive"
              accent="primary"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-400">Loading workouts...</span>
          </div>
        )}

        {/* Workouts Grid */}
        {!loading && sessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((workout) => (
              <div key={workout.id} className="rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#232323] shadow-xl border border-dark-border p-6 hover:shadow-2xl transition-all duration-300 relative">
                <div className="accent-bar" />
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="icon-accent h-12 w-12 flex items-center justify-center text-white">
                      {getWorkoutIcon(workout.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {workout.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {workout.type} • {workout.duration} min
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusBadge(workout.status)}`}>
                    {workout.status === 'in-progress' ? 'In Progress' : 'Completed'}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Difficulty</span>
                    <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium border ${getDifficultyBadge(workout.difficulty)}`}>
                      {workout.difficulty}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Created by</span>
                    <span className="text-white text-sm">{workout.instructor}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Exercises</span>
                    <span className="text-white font-semibold">{workout.exerciseCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Organization</span>
                    <span className="text-gray-300 text-sm truncate max-w-[120px]" title={workout.tenantName}>
                      {workout.tenantName || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Created</span>
                    <span className="text-gray-300">{new Date(workout.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700">
                  <button 
                    onClick={() => handleViewDetails(workout)}
                    className="btn-primary w-full text-sm"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && sessions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-4">No workouts found</div>
            <div className="text-gray-500">Create your first workout to get started</div>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Workout Details Modal */}
      <WorkoutDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        workout={selectedWorkout}
      />
    </AdminLayout>
  )
}