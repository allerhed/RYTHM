'use client'
import { useState, useEffect } from 'react'

interface ActivityItem {
  id: string
  type: 'user_created' | 'tenant_created' | 'session_completed' | 'system_alert'
  message: string
  timestamp: string
  user?: string
}

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockActivities: ActivityItem[] = [
      {
        id: '1',
        type: 'user_created',
        message: 'New user registered: john@example.com',
        timestamp: '2 minutes ago',
        user: 'System'
      },
      {
        id: '2',
        type: 'session_completed',
        message: 'Workout session completed by team Alpha',
        timestamp: '5 minutes ago',
        user: 'Coach Mike'
      },
      {
        id: '3',
        type: 'tenant_created',
        message: 'New organization created: FitStudio Pro',
        timestamp: '1 hour ago',
        user: 'Admin'
      },
      {
        id: '4',
        type: 'system_alert',
        message: 'Database backup completed successfully',
        timestamp: '2 hours ago',
        user: 'System'
      },
    ]
    setActivities(mockActivities)
  }, [])

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_created':
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
      case 'session_completed':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'system_alert':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
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
      case 'user_created':
        return 'from-green-500 to-emerald-600'
      case 'tenant_created':
        return 'from-blue-500 to-indigo-600'
      case 'session_completed':
        return 'from-purple-500 to-pink-600'
      case 'system_alert':
        return 'from-yellow-500 to-orange-600'
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
                      {activity.timestamp}
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