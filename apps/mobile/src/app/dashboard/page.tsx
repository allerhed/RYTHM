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
  const { user, logout } = useAuth()

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

          {/* User info card */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
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
            </Card>

            <Card className="p-6">
              <h2 className="text-subtitle font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Training Stats
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-body text-gray-600 dark:text-gray-400">
                    Sessions completed
                  </span>
                  <span className="text-body font-semibold text-gray-900 dark:text-gray-100">
                    12
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-body text-gray-600 dark:text-gray-400">
                    Total hours
                  </span>
                  <span className="text-body font-semibold text-gray-900 dark:text-gray-100">
                    8.5h
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-body text-gray-600 dark:text-gray-400">
                    Current streak
                  </span>
                  <span className="text-body font-semibold text-gray-900 dark:text-gray-100">
                    5 days
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-subtitle font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push('/training/new')}
                >
                  Start Training
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