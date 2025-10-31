'use client'
import { useEffect, useState } from 'react'
import { AdminLayout } from '@/components/AdminLayout'
import { StatsCard } from '@/components/StatsCard'
import { UsageTrendsChart } from '@/components/UsageTrendsChart'
import { MuscleGroupChart } from '@/components/MuscleGroupChart'
import { apiClient } from '@/lib/api'
import type { AnalyticsDashboard, PerformanceMetrics, TenantAnalytics, ExerciseAnalytics, EquipmentStats, ExerciseTemplateStats } from '@/lib/api'

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<AnalyticsDashboard | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [tenantAnalytics, setTenantAnalytics] = useState<TenantAnalytics[]>([])
  const [exerciseAnalytics, setExerciseAnalytics] = useState<ExerciseAnalytics | null>(null)
  const [equipmentStats, setEquipmentStats] = useState<EquipmentStats | null>(null)
  const [exerciseTemplateStats, setExerciseTemplateStats] = useState<ExerciseTemplateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y' | 'all'>('90d')

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      const [dashboardData, performanceData, tenantData, exerciseData, equipmentData, exerciseTemplateData] = await Promise.all([
        apiClient.admin.getAnalyticsDashboard({ timeRange, compareToLast: true }),
        apiClient.admin.getPerformanceMetrics({ timeRange }),
        apiClient.admin.getTenantAnalytics({ timeRange: timeRange === '7d' ? '30d' : timeRange === 'all' ? '1y' : timeRange }),
        apiClient.admin.getExerciseAnalytics({ timeRange: timeRange === '7d' ? '30d' : timeRange === 'all' ? '1y' : timeRange }),
        apiClient.admin.getEquipmentStats({ timeRange }),
        apiClient.admin.getExerciseTemplateStats({ timeRange }),
      ])

      setDashboard(dashboardData)
      setPerformanceMetrics(performanceData)
      setTenantAnalytics(tenantData)
      setExerciseAnalytics(exerciseData)
      setEquipmentStats(equipmentData)
      setExerciseTemplateStats(exerciseTemplateData)
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
                <div className="rounded-2xl bg-dark-elevated1 h-32"></div>
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
            {(['7d', '30d', '90d', '1y', 'all'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
                  timeRange === range
                    ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                    : 'bg-gray-700 text-gray-400 border-gray-600 hover:bg-gray-600'
                }`}
              >
                {range === 'all' ? 'ALL TIME' : range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {dashboard && (
            <>
              <StatsCard
                title="Active Users"
                value={formatNumber(dashboard.activeUsers.value)}
                change={dashboard.activeUsers.change?.value}
                changeType={dashboard.activeUsers.change?.type}
                accent="primary"
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
                accent="primary"
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
                accent="primary"
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
                accent="primary"
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />
            </>
          )}
          {equipmentStats && (
            <StatsCard
              title="Active Equipment"
              value={formatNumber(equipmentStats.activeEquipment)}
              accent="primary"
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
              accent="primary"
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
            />
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Usage Trends Chart */}
          <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                Usage Trends
              </h3>
              <div className="flex space-x-2 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-gray-400">Active Users</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-gray-400">Sessions</span>
                </div>
              </div>
            </div>
            <UsageTrendsChart 
              timeRange={timeRange === '1y' || timeRange === 'all' ? '90d' : timeRange} 
              className="h-64"
            />
          </div>

          {/* Workouts Logged */}
          <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              Workouts Logged
            </h3>
            <div className="flex flex-col items-center justify-center h-64">
              <div className="icon-accent inline-flex items-center justify-center w-24 h-24 mb-6">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-white mb-2">
                {performanceMetrics ? formatNumber(performanceMetrics.totalSessions) : '0'}
              </h2>
              <p className="text-gray-400 text-lg mb-4">Total Workouts Completed</p>
              <div className="grid grid-cols-2 gap-4 w-full">
                <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-400">
                    {performanceMetrics ? formatNumber(performanceMetrics.sessions24h) : '0'}
                  </p>
                  <p className="text-gray-500 text-sm">Last 24 Hours</p>
                </div>
                <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-400">
                    {dashboard ? formatNumber(dashboard.totalSessions.value) : '0'}
                  </p>
                  <p className="text-gray-500 text-sm">This Period</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Additional Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Organizations */}
          <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-gray-700 p-6">
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
                      index === 2 ? 'bg-orange-600' : 'bg-orange-500'
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
          <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              Popular Exercises
            </h3>
            <div className="space-y-4">
              {exerciseAnalytics?.popularExercises.slice(0, 8).map((exercise, index) => (
                <div key={exercise.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="badge-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold">
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
          <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              System Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
              <div className="text-center">
                <div className="icon-accent inline-flex items-center justify-center w-16 h-16 mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-white">{formatNumber(performanceMetrics.totalTenants)}</h4>
                <p className="text-gray-400 text-sm">Organizations</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center icon-accent w-16 h-16 mb-&">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-white">{formatNumber(performanceMetrics.totalUsers)}</h4>
                <p className="text-gray-400 text-sm">Total Users</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center icon-accent w-16 h-16 mb-&">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-white">{formatNumber(performanceMetrics.totalSessions)}</h4>
                <p className="text-gray-400 text-sm">Total Sessions</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center icon-accent w-16 h-16 mb-&">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-white">{formatNumber(performanceMetrics.totalExercises)}</h4>
                <p className="text-gray-400 text-sm">Exercises</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center icon-accent w-16 h-16 mb-&">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-white">{formatNumber(performanceMetrics.activeUsers24h)}</h4>
                <p className="text-gray-400 text-sm">Active (24h)</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center icon-accent w-16 h-16 mb-&">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-bold text-white">{formatNumber(performanceMetrics.sessions24h)}</h4>
                <p className="text-gray-400 text-sm">Sessions (24h)</p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center icon-accent w-16 h-16 mb-&">
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

        {/* Equipment Analytics */}
        {equipmentStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Equipment Overview */}
            <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">
                Equipment Overview
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center icon-accent w-12 h-12 mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-white">{equipmentStats.totalEquipment}</h4>
                  <p className="text-gray-400 text-sm">Total Equipment</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center icon-accent w-12 h-12 mb-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-bold text-white">{equipmentStats.activeEquipment}</h4>
                  <p className="text-gray-400 text-sm">Active Equipment</p>
                </div>
              </div>
              
              {/* Equipment by Category */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">Equipment by Category</h4>
                <div className="space-y-2">
                  {equipmentStats.equipmentByCategory.map((cat) => (
                    <div key={cat.category} className="flex justify-between items-center">
                      <span className="text-gray-300 capitalize">{cat.category.replace('_', ' ')}</span>
                      <span className="text-white font-semibold">{cat.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Most Used Equipment */}
            <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-6">
                Most Used Equipment
              </h3>
              <div className="space-y-4">
                {equipmentStats.mostUsedEquipment.slice(0, 6).map((equipment, index) => (
                  <div key={equipment.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                        index < 2 ? 'bg-primary' : 
                        index < 4 ? 'bg-primary-hover' : 
                        'bg-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-gray-300 truncate block">{equipment.name}</span>
                        <p className="text-xs text-gray-500 capitalize">{equipment.category.replace('_', ' ')}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-white font-semibold">
                        {equipment.session_usage || equipment.exercise_count + equipment.template_count}
                      </span>
                      <p className="text-xs text-gray-500">
                        {equipment.session_usage ? 'sessions' : 'uses'}
                      </p>
                    </div>
                  </div>
                ))}
                {equipmentStats.mostUsedEquipment.length === 0 && (
                  <p className="text-gray-400 text-center py-8">No equipment usage data available</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Exercise Template Analytics */}
        {exerciseTemplateStats && (
          <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              Exercise Template Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Template Type Distribution */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-4">Templates by Type</h4>
                <div className="space-y-3">
                  {exerciseTemplateStats.exerciseTemplatesByType.map((type) => (
                    <div key={type.exercise_type} className="flex justify-between items-center">
                      <span className="text-gray-300 capitalize">{type.exercise_type.toLowerCase()}</span>
                      <span className="text-white font-semibold">{type.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular Muscle Groups in Templates */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-4">Popular Muscle Groups</h4>
                <div className="space-y-3">
                  {exerciseTemplateStats.topMuscleGroups.slice(0, 5).map((group, index) => (
                    <div key={group.muscle_group} className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          index === 0 ? 'bg-orange-500' :
                          index === 1 ? 'bg-orange-500' :
                          index === 2 ? 'bg-green-500' :
                          index === 3 ? 'bg-orange-500' : 'bg-dark-elevated0'
                        }`} />
                        <span className="text-gray-300 capitalize">{group.muscle_group}</span>
                      </div>
                      <span className="text-white font-semibold">{group.template_count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h4 className="text-sm font-semibold text-gray-300 mb-4">Recent Activity</h4>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center icon-accent w-16 h-16 mb-&">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-white">{exerciseTemplateStats.recentExerciseTemplates}</h4>
                  <p className="text-gray-400 text-sm">New templates ({timeRange === 'all' ? 'all time' : timeRange.replace('d', ' days').replace('y', ' year')})</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}