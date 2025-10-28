/**
 * Example: Dashboard Page with Pull-to-Refresh Integration
 * 
 * This is a reference implementation showing how to integrate the PullToRefresh
 * component into an existing page. Use this pattern for other pages.
 * 
 * Key Changes:
 * 1. Import PullToRefresh component
 * 2. Create handleRefresh async function
 * 3. Wrap main content area with PullToRefresh
 * 4. Call data fetching functions in handleRefresh
 */

'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '../../components/PullToRefresh'
import { Header } from '../../components/Navigation'
import { useAuth } from '../../contexts/AuthContext'

function DashboardPageExample() {
  const router = useRouter()
  const { user, fetchProfile } = useAuth()
  const [todaysWorkouts, setTodaysWorkouts] = useState([])
  const [loading, setLoading] = useState(false)
  
  // Existing data fetching function
  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      // Fetch user profile
      await fetchProfile()
      
      // Fetch today's workouts
      const response = await fetch('/api/sessions/today')
      const data = await response.json()
      setTodaysWorkouts(data)
      
      // Add any other data fetching here
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initial data load
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Pull-to-refresh handler
  // This is the key addition - it calls all your data fetching functions
  const handleRefresh = async () => {
    await fetchDashboardData()
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header stays outside of pull-to-refresh */}
      <Header title="Dashboard" />
      
      {/* Wrap scrollable content area with PullToRefresh */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="flex-1 overflow-y-auto">
          {/* Your existing page content */}
          <div className="container mx-auto px-4 py-6">
            
            {/* Welcome Section */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user?.firstName || 'Athlete'}!
              </h1>
              <p className="text-text-secondary mt-1">
                Ready to crush your workout?
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-lg p-4 shadow">
                <div className="text-3xl font-bold text-orange-primary">
                  {todaysWorkouts.length}
                </div>
                <div className="text-sm text-text-secondary mt-1">
                  Today's Workouts
                </div>
              </div>
              
              <div className="bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-lg p-4 shadow">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  92%
                </div>
                <div className="text-sm text-text-secondary mt-1">
                  Weekly Goal
                </div>
              </div>
            </div>

            {/* Workouts List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-text-secondary mt-2">Loading workouts...</p>
                </div>
              ) : todaysWorkouts.length > 0 ? (
                todaysWorkouts.map((workout: any) => (
                  <div 
                    key={workout.id}
                    className="bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-lg p-4 shadow"
                  >
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {workout.name}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      {workout.category} • {workout.duration}min
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-text-secondary">
                    No workouts scheduled for today
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </PullToRefresh>
    </div>
  )
}

export default DashboardPageExample

/**
 * INTEGRATION NOTES:
 * 
 * 1. Component Structure:
 *    - Keep header/navigation outside PullToRefresh
 *    - Wrap only the scrollable content area
 *    - Ensure parent div has proper height (h-screen, flex-col)
 * 
 * 2. Refresh Handler:
 *    - Create single handleRefresh function
 *    - Call all data fetching methods inside it
 *    - Don't show loading indicators during refresh (PullToRefresh handles this)
 * 
 * 3. Data Fetching:
 *    - Use existing data fetching patterns (tRPC, fetch, etc.)
 *    - Can use React Query's invalidateQueries if using React Query
 *    - Example with React Query:
 *      const queryClient = useQueryClient()
 *      const handleRefresh = async () => {
 *        await queryClient.invalidateQueries(['dashboard'])
 *      }
 * 
 * 4. Styling:
 *    - Ensure scrollable container has overflow-y-auto
 *    - PullToRefresh component handles its own styling
 *    - Works with Tailwind classes
 * 
 * 5. Testing:
 *    - Test on mobile device or Chrome DevTools mobile emulation
 *    - Pull down from top of page to trigger refresh
 *    - Verify all data refetches properly
 *    - Check that pull doesn't trigger when scrolled down
 */
