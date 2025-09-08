'use client'
import React from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '../../components/Navigation'
import { Button } from '../../components/Form'
import { Avatar } from '../../components/Avatar'
import { useAuth, withAuth } from '../../contexts/AuthContext'

// Simple Card component for the dashboard
interface CardProps {
  children: React.ReactNode
  className?: string
}

function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      {children}
    </div>
  )
}

function DashboardPage() {
  const router = useRouter()
  const { user, logout, fetchProfile } = useAuth()

  // Fetch fresh profile data when component mounts
  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        await fetchProfile()
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      }
    }
    
    if (user) {
      loadProfile()
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header 
        title="Dashboard"
        showUserAvatar={true}
        user={user || undefined}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
          >
            Sign Out
          </Button>
        }
      />

      {/* Main content */}
      <div className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome section */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar user={user || undefined} size="md" />
              <div>
                <h1 className="text-display font-bold text-gray-900 dark:text-gray-100">
                  Welcome back, {user?.firstName || user?.email}!
                </h1>
                <p className="text-body text-gray-600 dark:text-gray-400">
                  Ready to continue your training journey?
                </p>
              </div>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4 bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700">
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 mx-2">4</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">SEP 8 - SEP 14, 25</span>
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Week Days */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-8">
              {[
                { day: 'M', label: 'Monday', active: true },
                { day: 'T', label: 'Tuesday' },
                { day: 'W', label: 'Wednesday' },
                { day: 'T', label: 'Thursday' },
                { day: 'F', label: 'Friday' },
                { day: 'S', label: 'Saturday' },
                { day: 'S', label: 'Sunday' }
              ].map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                    item.active 
                      ? 'bg-teal-500 text-white border-2 border-teal-600' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {item.day}
                  </div>
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    item.active ? 'bg-teal-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}></div>
                </div>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid gap-6 lg:grid-cols-3 mb-8">
            {/* Profile Information */}
            <Card className="p-6">
              <h2 className="text-subtitle font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Profile Information
              </h2>
              
              {/* Profile Picture and Basic Info */}
              <div className="flex items-center space-x-4 mb-6">
                <Avatar user={user || undefined} size="lg" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {user?.firstName} {user?.lastName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {user?.email}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {user?.about && (
                  <div>
                    <span className="text-caption font-medium text-gray-500 dark:text-gray-400">
                      About
                    </span>
                    <p className="text-body text-gray-900 dark:text-gray-100">
                      {user.about}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-caption font-medium text-gray-500 dark:text-gray-400">
                    Role
                  </span>
                  <p className="text-body text-gray-900 dark:text-gray-100 capitalize">
                    {user?.role || 'User'}
                  </p>
                </div>
              </div>

              {/* Quick Actions moved here */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push('/training/new')}
                  >
                    Log workout
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push('/profile')}
                  >
                    Edit Profile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => router.push('/analytics')}
                  >
                    View Analytics
                  </Button>
                </div>
              </div>
            </Card>

            {/* Training Dashboard - spans 2 columns */}

            <Card className="p-6 lg:col-span-2">
              {/* Training Score Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Training Score:</span>
                  <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">Grinding</span>
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Score Display */}
              <div className="mb-6">
                <div className="flex items-baseline space-x-3 mb-2">
                  <span className="text-6xl font-bold text-gray-900 dark:text-gray-100">55</span>
                  <span className="text-lg text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                    +0 pts this week
                  </span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-6">
                  <div className="h-full flex">
                    <div className="w-1/6 bg-teal-500"></div>
                    <div className="w-1/6 bg-yellow-600"></div>
                    <div className="w-1/6 bg-green-500"></div>
                    <div className="w-1/6 bg-blue-500"></div>
                    <div className="w-1/6 bg-purple-500"></div>
                    <div className="w-1/6 bg-green-600"></div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Hours Trained</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">0h 27m</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">-1h 36m</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">2h 3m last week</div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Training Load</span>
                  </div>
                  <div className="space-y-1">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">18</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">-84</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">102 last week</div>
                  </div>
                </div>
              </div>

              {/* Today's Date */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
                  Monday, Sep 8
                </h3>
                
                {/* Recent Workout */}
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Vasteras Walking</h4>
                      </div>
                    </div>
                    <div className="bg-teal-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Load 18
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">DISTANCE</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">2.19 km</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">CALORIES</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">151 cal</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">MOVING TIME</div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">26m</div>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                    Sep 8, 2025
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent activity */}
          <Card className="p-6 mb-8">
            <h2 className="text-subtitle font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              {[
                { action: 'Completed strength training session', time: '2 hours ago' },
                { action: 'Updated profile information', time: '1 day ago' },
                { action: 'Joined RYTHM community', time: '3 days ago' },
              ].map((activity, index) => (
                <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                  <span className="text-body text-gray-900 dark:text-gray-100">
                    {activity.action}
                  </span>
                  <span className="text-caption text-gray-500 dark:text-gray-400">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Development notice */}
          <Card className="p-6 border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-900/20">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <span className="text-primary-600 dark:text-primary-400 text-lg">🚧</span>
              </div>
              <div>
                <h3 className="text-subtitle font-semibold text-primary-900 dark:text-primary-100 mb-1">
                  Development Mode
                </h3>
                <p className="text-body text-primary-700 dark:text-primary-300">
                  This dashboard is currently in development. Some features may not be fully functional yet.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Export the component wrapped with authentication protection
export default withAuth(DashboardPage)