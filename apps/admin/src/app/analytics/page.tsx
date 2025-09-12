'use client'
import { AdminLayout } from '@/components/AdminLayout'
import { StatsCard } from '@/components/StatsCard'

export default function AnalyticsPage() {
  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-gray-400">
            Comprehensive insights into your platform's performance and user engagement.
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Daily Active Users"
            value="15,847"
            change="+12.5%"
            changeType="positive"
            gradient="from-blue-500 to-cyan-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />
          <StatsCard
            title="Workout Sessions"
            value="8,264"
            change="+8.2%"
            changeType="positive"
            gradient="from-purple-500 to-indigo-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            }
          />
          <StatsCard
            title="Average Session Time"
            value="42m"
            change="+3.1%"
            changeType="positive"
            gradient="from-green-500 to-teal-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatsCard
            title="User Retention"
            value="89.2%"
            change="-1.4%"
            changeType="negative"
            gradient="from-orange-500 to-pink-600"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Usage Trends */}
          <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                Usage Trends
              </h3>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-xs rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  7d
                </button>
                <button className="px-3 py-1 text-xs rounded-lg bg-gray-700 text-gray-400 border border-gray-600">
                  30d
                </button>
              </div>
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-700/50 rounded-lg">
              <p className="text-gray-400">Chart visualization would go here</p>
            </div>
          </div>

          {/* Device Breakdown */}
          <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-6">
              Device Breakdown
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-gray-300">Mobile</span>
                </div>
                <span className="text-white font-semibold">67.4%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-gray-300">Desktop</span>
                </div>
                <span className="text-white font-semibold">24.8%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-gray-300">Tablet</span>
                </div>
                <span className="text-white font-semibold">7.8%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-6">
            Performance Insights
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white">98.7%</h4>
              <p className="text-gray-400">Uptime</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white">1.2s</h4>
              <p className="text-gray-400">Avg Response Time</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="text-xl font-bold text-white">99.1%</h4>
              <p className="text-gray-400">Success Rate</p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}