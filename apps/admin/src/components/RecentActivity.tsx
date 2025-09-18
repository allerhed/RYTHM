'use client'
import { useState, useEffect } from 'react'


import { adminApi, ActivityItem } from '../services/adminApi'

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const dashboardData = await adminApi.getDashboardData()
        setActivities(dashboardData.recentActivity || [])
      } catch (error) {
        console.error('Failed to fetch recent activity:', error)
        setActivities([])
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [])

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_registration':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        )
      case 'tenant_created':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-6m-9 0H3m2 0h6M9 7h6m-6 4h6m-6 4h6" />
          </svg>
        )
      case 'workout_completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        )
    }
  }

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_registration':
        return 'from-green-500 to-emerald-600'
      case 'tenant_created':
        return 'from-blue-500 to-indigo-600'
      case 'workout_completed':
        return 'from-purple-500 to-pink-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="rounded-2xl bg-gray-800 shadow-xl border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">
          Recent Activity
        </h3>
        <button className="text-sm text-gray-400 hover:text-white transition-colors duration-200">
          View all
        </button>
      </div>
      <div className="flow-root">
        <ul className="-mb-8">
          {activities.map((activity, index) => (
            <li key={activity.id}>
              <div className="relative pb-8">
                {index !== activities.length - 1 && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-700"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex space-x-3">
                  <div className={`h-8 w-8 rounded-full bg-gradient-to-r ${getActivityColor(activity.type)} flex items-center justify-center shadow-lg`}>
                    <div className="text-white">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                    <div>
                      <p className="text-sm text-gray-300">
                        {activity.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        by {activity.user}
                      </p>
                    </div>
                    <div className="text-right text-sm whitespace-nowrap text-gray-500">
                      {activity.timestamp instanceof Date
                        ? activity.timestamp.toLocaleString()
                        : new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}