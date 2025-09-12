'use client'
import { AdminLayout } from '@/components/AdminLayout'
import { StatsCard } from '@/components/StatsCard'

interface Workout {
  id: string
  name: string
  type: string
  duration: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  instructor: string
  participants: number
  createdAt: string
  status: 'active' | 'archived' | 'draft'
}

const mockWorkouts: Workout[] = [
  {
    id: '1',
    name: 'HIIT Cardio Blast',
    type: 'HIIT',
    duration: 30,
    difficulty: 'Intermediate',
    instructor: 'Sarah Johnson',
    participants: 45,
    createdAt: '2024-03-01',
    status: 'active'
  },
  {
    id: '2',
    name: 'Strength Training Fundamentals',
    type: 'Strength',
    duration: 45,
    difficulty: 'Beginner',
    instructor: 'Mike Chen',
    participants: 32,
    createdAt: '2024-02-28',
    status: 'active'
  },
  {
    id: '3',
    name: 'Yoga Flow & Flexibility',
    type: 'Yoga',
    duration: 60,
    difficulty: 'Beginner',
    instructor: 'Emily Davis',
    participants: 28,
    createdAt: '2024-02-25',
    status: 'active'
  },
  {
    id: '4',
    name: 'Advanced CrossFit WOD',
    type: 'CrossFit',
    duration: 50,
    difficulty: 'Advanced',
    instructor: 'Alex Rivera',
    participants: 18,
    createdAt: '2024-02-20',
    status: 'draft'
  }
]

export default function WorkoutsPage() {
  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'Intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'Advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'draft':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'archived':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getWorkoutIcon = (type: string) => {
    switch (type) {
      case 'HIIT':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        )
      case 'Strength':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        )
      case 'Yoga':
        return (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        )
      case 'CrossFit':
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

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Workout Management
            </h1>
            <p className="mt-2 text-gray-400">
              Create, manage, and monitor workout programs across all organizations.
            </p>
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg">
            Create New Workout
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Workouts"
            value="127"
            change="+8%"
            changeType="positive"
            gradient="from-blue-500 to-blue-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatsCard
            title="Active Workouts"
            value="89"
            change="+12%"
            changeType="positive"
            gradient="from-green-500 to-emerald-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Total Participants"
            value="1,234"
            change="+15%"
            changeType="positive"
            gradient="from-purple-500 to-pink-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Avg. Duration"
            value="42 min"
            change="+2%"
            changeType="positive"
            gradient="from-orange-500 to-red-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>

        {/* Workouts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockWorkouts.map((workout) => (
            <div key={workout.id} className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg text-white">
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
                  {workout.status}
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
                  <span className="text-gray-400">Instructor</span>
                  <span className="text-white text-sm">{workout.instructor}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Participants</span>
                  <span className="text-white font-semibold">{workout.participants}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Created</span>
                  <span className="text-gray-300">{new Date(workout.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="flex space-x-3">
                  <button className="flex-1 px-3 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors duration-200 text-sm">
                    View Details
                  </button>
                  <button className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors duration-200 text-sm">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  )
}