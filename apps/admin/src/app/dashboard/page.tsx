'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AdminLayout } from '@/components/AdminLayout'
import { StatsCard } from '@/components/StatsCard'
import { RecentActivity } from '@/components/RecentActivity'
import { adminApi, DashboardData } from '@/services/adminApi'

export default function DashboardPage() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Ensure we have a token from the auth context
        const token = localStorage.getItem('admin_token')
        if (!token) {
          setError('No authentication token found')
          return
        }
        
        const data = await adminApi.getDashboardData()
        setDashboardData(data)
      } catch (err) {
        console.error('Dashboard API error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [user])

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
            <p className="text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="rounded-2xl bg-red-900/20 border border-red-500/30 text-red-400 px-6 py-4">
          <div className="flex items-center space-x-3">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Error: {error}</span>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!dashboardData) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-400">No dashboard data available</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  const { stats, recentActivity } = dashboardData

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user?.firstName || user?.email?.split('@')[0] || 'Admin'}
          </h1>
          <p className="mt-2 text-gray-400">
            Here's what's happening with your fitness platform today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            change="+12%"
            changeType="positive"
            gradient="from-blue-500 to-blue-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Active Organizations"
            value={stats.totalTenants.toString()}
            change="+3%"
            changeType="positive"
            gradient="from-green-500 to-emerald-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-9 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6" />
              </svg>
            }
          />
          <StatsCard
            title="Total Workouts"
            value={stats.totalWorkouts.toLocaleString()}
            change="+8%"
            changeType="positive"
            gradient="from-purple-500 to-pink-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatsCard
            title="Active Users (24h)"
            value={stats.activeUsers24h.toString()}
            change="-2%"
            changeType="negative"
            gradient="from-orange-500 to-red-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
        </div>

        {/* System Health */}
        <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className={`h-4 w-4 rounded-full shadow-lg ${
                stats.systemHealth === 'good' ? 'bg-green-400' :
                stats.systemHealth === 'warning' ? 'bg-yellow-400' :
                'bg-red-400'
              }`}></div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                System Health
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-400">Status:</span>
                <span className={`text-sm font-medium capitalize ${
                  stats.systemHealth === 'good' ? 'text-green-400' :
                  stats.systemHealth === 'warning' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {stats.systemHealth}
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className={`p-3 rounded-xl ${
                stats.systemHealth === 'good' ? 'bg-green-500/10' :
                stats.systemHealth === 'warning' ? 'bg-yellow-500/10' :
                'bg-red-500/10'
              }`}>
                <svg className={`w-6 h-6 ${
                  stats.systemHealth === 'good' ? 'text-green-400' :
                  stats.systemHealth === 'warning' ? 'text-yellow-400' :
                  'text-red-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <RecentActivity />
      </div>
    </AdminLayout>
  )
}