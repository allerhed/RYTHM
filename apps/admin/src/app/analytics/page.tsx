'use client'
import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import { StatsCard } from '@/components/StatsCard'
import { UsageTrendsChart } from '@/components/UsageTrendsChart'
import { MuscleGroupChart } from '@/components/MuscleGroupChart'
import { apiClient } from '@/lib/api'
import type { AnalyticsDashboard, PerformanceMetrics, TenantAnalytics, ExerciseAnalytics } from '@/lib/api'

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [tenantAnalytics, setTenantAnalytics] = useState<TenantAnalytics[]>([])
  const [exerciseAnalytics, setExerciseAnalytics] = useState<ExerciseAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const [dashboardData, performanceData, tenantData, exerciseData] = await Promise.all([
        apiClient.admin.getAnalyticsDashboard({ timeRange, compareToLast: true }),
        apiClient.admin.getPerformanceMetrics(),
        apiClient.admin.getTenantAnalytics({ timeRange: timeRange === '7d' ? '30d' : timeRange }),
        apiClient.admin.getExerciseAnalytics({ timeRange: timeRange === '7d' ? '30d' : timeRange }),
      ])

      setDashboard(dashboardData)
      setPerformanceMetrics(performanceData)
      setTenantAnalytics(tenantData)
      setExerciseAnalytics(exerciseData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = Math.round(minutes % 60)
    return `${hours}h ${remainingMinutes}m`
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <p className="mt-2 text-gray-400">Loading analytics data...</p>
          </div>
          
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-2xl bg-gray-800 h-32"></div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics Dashboard</h1>
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400">Error: {error}</p>
              <button 
                onClick={fetchAnalytics}
                className="mt-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              Analytics Dashboard
            </h1>
            <p className="mt-2 text-gray-400">
              Comprehensive insights into your platform's performance and user engagement.
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex space-x-2">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                  timeRange === range
                    ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    : 'bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600'
                }`}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        {dashboard && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Active Users"
              value={formatNumber(dashboard.activeUsers.value)}
              change={dashboard.activeUsers.change?.value}
              changeType={dashboard.activeUsers.change?.type}
              gradient="from-blue-500 to-cyan-600"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />
            <StatsCard
              title="Workout Sessions"
              value={formatNumber(dashboard.totalSessions.value)}
              change={dashboard.totalSessions.change?.value}
              changeType={dashboard.totalSessions.change?.type}
              gradient="from-purple-500 to-indigo-600"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              }
            />
            <StatsCard
              title="Average Session Time"
              value={formatDuration(dashboard.avgSessionDuration.value)}
              change={dashboard.avgSessionDuration.change?.value}
              changeType={dashboard.avgSessionDuration.change?.type}
              gradient="from-green-500 to-teal-600"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatsCard
              title="User Retention"
              value={`${dashboard.retentionRate.value.toFixed(1)}%`}
              change={dashboard.retentionRate.change?.value}
              changeType={dashboard.retentionRate.change?.type}
              gradient="from-orange-500 to-pink-600"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
            />
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Usage Trends Chart */}
          <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                Usage Trends
              </h3>
              <div className="flex space-x-2 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-400">Active Users</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-gray-400">Sessions</span>
                </div>
              </div>
            </div>
            <UsageTrendsChart 
              timeRange={timeRange === '1y' ? '90d' : timeRange} 
              className="h-64"
            />
          </div>

          {/* Muscle Group Distribution */}
          <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              Muscle Group Distribution
            </h3>
            <MuscleGroupChart 
              data={exerciseAnalytics?.muscleGroupUsage || []} 
              className="h-64"
            />
          </div>
        </div>

        {/* Additional Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Organizations */}
          <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              Top Organizations
            </h3>
            <div className="space-y-4">
              {tenantAnalytics.slice(0, 5).map((tenant, index) => (
                <div key={tenant.tenantId} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <span className="text-gray-300 font-medium">{tenant.tenantName}</span>
                      <p className="text-xs text-gray-500">{tenant.totalUsers} users</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-semibold">{tenant.totalSessions}</span>
                    <p className="text-xs text-gray-500">sessions</p>
                  </div>
                </div>
              ))}
              {tenantAnalytics.length === 0 && (
                <p className="text-gray-400 text-center py-8">No tenant data available</p>
              )}
            </div>
          </div>

          {/* Popular Exercises */}
          <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              Popular Exercises
            </h3>
            <div className="space-y-4">
              {exerciseAnalytics?.popularExercises.slice(0, 8).map((exercise, index) => (
                <div key={exercise.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                      index < 3 ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 
                      index < 6 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 
                      'bg-gradient-to-r from-green-500 to-teal-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-300 truncate block">{exercise.name}</span>
                      <p className="text-xs text-gray-500">{exercise.unique_users} users</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-white font-semibold">{exercise.total_sets}</span>
                    <p className="text-xs text-gray-500">sets</p>
                  </div>
                </div>
              ))}
              {(!exerciseAnalytics?.popularExercises.length) && (
                <p className="text-gray-400 text-center py-8">No exercise data available</p>
              )}
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        {performanceMetrics && (
          <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              System Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-white">{formatNumber(performanceMetrics.totalTenants)}</h4>
                <p className="text-gray-400 text-sm">Organizations</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-white">{formatNumber(performanceMetrics.totalUsers)}</h4>
                <p className="text-gray-400 text-sm">Total Users</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-teal-600 mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-white">{formatNumber(performanceMetrics.totalSessions)}</h4>
                <p className="text-gray-400 text-sm">Total Sessions</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-600 mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-white">{formatNumber(performanceMetrics.totalExercises)}</h4>
                <p className="text-gray-400 text-sm">Exercises</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-white">{formatNumber(performanceMetrics.activeUsers24h)}</h4>
                <p className="text-gray-400 text-sm">Active (24h)</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-white">{formatNumber(performanceMetrics.sessions24h)}</h4>
                <p className="text-gray-400 text-sm">Sessions (24h)</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-white">{formatNumber(performanceMetrics.activeTenants24h)}</h4>
                <p className="text-gray-400 text-sm">Active Orgs (24h)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}