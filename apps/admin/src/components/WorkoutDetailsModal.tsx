'use client'
import { type WorkoutSession } from '@/lib/api'

interface WorkoutDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  workout: WorkoutSession | null
}

export function WorkoutDetailsModal({ isOpen, onClose, workout }: WorkoutDetailsModalProps) {
  if (!isOpen || !workout) return null

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-dark-elevated0/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'in-progress':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default:
        return 'bg-dark-elevated0/20 text-gray-400 border-gray-500/30'
    }
  }

  const getWorkoutIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'hiit':
      case 'cardio':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'strength':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )
      case 'hybrid':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-2xl shadow-2xl border border-gray-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center shadow-lg text-white">
                {getWorkoutIcon(workout.type)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{workout.name}</h2>
                <p className="text-gray-400 capitalize">{workout.type} • {workout.duration} minutes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Status and Difficulty Badges */}
          <div className="flex items-center space-x-3 mb-6">
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border capitalize ${getStatusBadge(workout.status)}`}>
              {workout.status === 'in-progress' ? 'In Progress' : 'Completed'}
            </span>
            <span className={`inline-flex px-3 py-1 rounded-lg text-sm font-medium border ${getDifficultyBadge(workout.difficulty)}`}>
              {workout.difficulty}
            </span>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Information */}
            <div className="space-y-6">
              <div className="bg-gray-700/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Workout Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Created by</span>
                    <span className="text-white font-medium">{workout.instructor}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Organization</span>
                    <span className="text-white font-medium">{workout.tenantName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Duration</span>
                    <span className="text-white font-medium">{workout.duration} minutes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Category</span>
                    <span className="text-white font-medium capitalize">{workout.type}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Created Date</span>
                    <span className="text-white font-medium">
                      {new Date(workout.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Exercise Summary */}
              <div className="bg-gray-700/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Exercise Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">{workout.exerciseCount}</div>
                    <div className="text-sm text-gray-400">Exercises</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">{workout.totalSets}</div>
                    <div className="text-sm text-gray-400">Total Sets</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Additional Details */}
            <div className="space-y-6">
              {/* Training Load & RPE */}
              {(workout.trainingLoad || workout.difficulty) && (
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
                  <div className="space-y-3">
                    {workout.trainingLoad && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Training Load</span>
                        <span className="text-white font-medium">{workout.trainingLoad}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Difficulty Level</span>
                      <span className={`px-2 py-1 rounded text-sm font-medium ${getDifficultyBadge(workout.difficulty).replace('border', '')}`}>
                        {workout.difficulty}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {workout.notes && (
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Notes</h3>
                  <p className="text-gray-300 leading-relaxed">{workout.notes}</p>
                </div>
              )}

              {/* Session Details */}
              <div className="bg-gray-700/50 rounded-xl p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Session Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Workout ID</span>
                    <span className="text-white font-mono text-sm">{workout.id.substring(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getStatusBadge(workout.status).replace('border', '')}`}>
                      {workout.status === 'in-progress' ? 'In Progress' : 'Completed'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Participants</span>
                    <span className="text-white font-medium">{workout.participants}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-700">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 hover:text-white transition-colors duration-200"
            >
              Close
            </button>
            <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 shadow-lg">
              Export Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}