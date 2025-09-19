'use client'

import { useAuth } from '../../contexts/AuthContext'

export default function AnalyticsPage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Analytics</h1>
            <p className="text-gray-400">Please login to view your analytics.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-4">Analytics</h1>
          <p className="text-gray-400">Analytics dashboard coming soon...</p>
          <p className="text-sm text-gray-500 mt-2">This feature will be available after deployment is complete.</p>
        </div>
      </div>
    </div>
  )
}
