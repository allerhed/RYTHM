'use client'
import { useEffect, useState } from 'react'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { AdminLayout } from '@/components/AdminLayout'
import { StatsCard } from '@/components/StatsCard'
import { RecentActivity } from '@/components/RecentActivity'
import { apiClient } from '@/lib/api'
import type { AnalyticsDashboard, PerformanceMetrics, EquipmentStats, ExerciseTemplateStats, TenantAnalytics, WorkoutSessionStats } from '@/lib/api'

function DashboardPage() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStats | null>(null)
  const [exerciseTemplateStats, setExerciseTemplateStats] = useState<ExerciseTemplateStats | null>(null)
  const [topTenants, setTopTenants] = useState<TenantAnalytics[]>([])
  const [workoutStats, setWorkoutStats] = useState<WorkoutSessionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all dashboard data in parallel - use 30d for dashboard overview
        const [dashboardData, performanceData, equipmentData, templateData, tenantData, workoutData] = await Promise.all([
          apiClient.admin.getAnalyticsDashboard({ timeRange: '30d', compareToLast: true }),
          apiClient.admin.getPerformanceMetrics({ timeRange: '30d' }),
          apiClient.admin.getEquipmentStats({ timeRange: '30d' }),
          apiClient.admin.getExerciseTemplateStats({ timeRange: '30d' }),
          apiClient.admin.getTenantAnalytics({ timeRange: '30d' }),
          apiClient.admin.getWorkoutSessionStats(),
        ])

        setDashboard(dashboardData)
        setPerformanceMetrics(performanceData)
        setEquipmentStats(equipmentData)
        setExerciseTemplateStats(templateData)
        setTopTenants(tenantData.slice(0, 5)) // Top 5 for dashboard
        setWorkoutStats(workoutData)
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

  if (!dashboard || !performanceMetrics) {
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

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = Math.round(minutes % 60)
    return `${hours}h ${remainingMinutes}m`
  }

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
            title="Active Users (30d)"
            value={formatNumber(dashboard.activeUsers.value)}
            change={dashboard.activeUsers.change?.value}
            changeType={dashboard.activeUsers.change?.type}
            gradient="from-blue-500 to-blue-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            }
          />
          <StatsCard
            title="Organizations"
            value={formatNumber(performanceMetrics.totalTenants)}
            gradient="from-green-500 to-emerald-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-9 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6" />
              </svg>
            }
          />
          <StatsCard
            title="Workout Sessions"
            value={formatNumber(dashboard.totalSessions.value)}
            change={dashboard.totalSessions.change?.value}
            changeType={dashboard.totalSessions.change?.type}
            gradient="from-purple-500 to-pink-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatsCard
            title="Active Today"
            value={formatNumber(performanceMetrics.activeUsers24h)}
            gradient="from-orange-500 to-red-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
        </div>

        {/* Additional Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {equipmentStats && (
            <StatsCard
              title="Active Equipment"
              value={formatNumber(equipmentStats.activeEquipment)}
              gradient="from-emerald-500 to-green-600"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              }
            />
          )}
          {exerciseTemplateStats && (
            <StatsCard
              title="Exercise Templates"
              value={formatNumber(exerciseTemplateStats.totalExerciseTemplates)}
              gradient="from-violet-500 to-purple-600"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          )}
          <StatsCard
            title="Average Session Time"
            value={formatDuration(dashboard.avgSessionDuration.value)}
            change={dashboard.avgSessionDuration.change?.value}
            changeType={dashboard.avgSessionDuration.change?.type}
            gradient="from-cyan-500 to-blue-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="User Retention"
            value={`${dashboard.retentionRate.value.toFixed(1)}%`}
            gradient="from-indigo-500 to-purple-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>

        {/* System Health */}
        <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-4 w-4 rounded-full shadow-lg bg-green-400"></div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">
                System Health
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-400">Status:</span>
                <span className="text-sm font-medium capitalize text-green-400">
                  Healthy
                </span>
              </div>
            </div>
            <div className="flex-shrink-0">
              <div className="p-3 rounded-xl bg-green-500/10">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {performanceMetrics && (
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-700/50 border border-gray-600/50">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-200">
                    System is operating normally with {formatNumber(performanceMetrics.activeUsers24h)} active users in the last 24 hours
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Just now</p>
                </div>
              </div>
            )}
            
            {equipmentStats && (
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-700/50 border border-gray-600/50">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-200">
                    Equipment inventory updated: {formatNumber(equipmentStats.activeEquipment)} pieces of equipment currently active
                  </p>
                  <p className="text-xs text-gray-400 mt-1">2 minutes ago</p>
                </div>
              </div>
            )}
            
            {exerciseTemplateStats && (
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-700/50 border border-gray-600/50">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-200">
                    Exercise template library contains {formatNumber(exerciseTemplateStats.totalExerciseTemplates)} templates
                  </p>
                  <p className="text-xs text-gray-400 mt-1">5 minutes ago</p>
                </div>
              </div>
            )}
            
            <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-700/50 border border-gray-600/50">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-orange-400 rounded-full mt-2"></div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-200">
                  Dashboard analytics refreshed for {dashboard.timeRange} time period
                </p>
                <p className="text-xs text-gray-400 mt-1">Just now</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default withAuth(DashboardPage)