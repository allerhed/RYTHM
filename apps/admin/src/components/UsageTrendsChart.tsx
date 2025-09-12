'use client'
import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { apiClient } from '@/lib/api'

interface ChartDataPoint {
  date: string
  activeUsers: number
  sessions: number
  avgDuration: number
}

interface UsageTrendsChartProps {
  timeRange: '7d' | '30d' | '90d'
  className?: string
}

export function UsageTrendsChart({ timeRange, className }: UsageTrendsChartProps) {
  const [data, setData] = useState<ChartDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const granularity = timeRange === '7d' ? 'day' : timeRange === '30d' ? 'day' : 'week'
        const trends = await apiClient.admin.getUsageTrends({ timeRange, granularity })
        
        // Format data for chart
        const formattedData = trends.map(trend => ({
          date: new Date(trend.period).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            ...(granularity === 'week' && { year: 'numeric' })
          }),
          activeUsers: trend.activeUsers,
          sessions: trend.totalSessions,
          avgDuration: Math.round(trend.avgDuration),
        }))
        
        setData(formattedData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch trends')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [timeRange])

  if (loading) {
    return (
      <div className={`h-64 flex items-center justify-center bg-gray-700/50 rounded-lg ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`h-64 flex items-center justify-center bg-gray-700/50 rounded-lg ${className}`}>
        <p className="text-red-400">Error: {error}</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className={`h-64 flex items-center justify-center bg-gray-700/50 rounded-lg ${className}`}>
        <p className="text-gray-400">No data available for the selected period</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9CA3AF"
            fontSize={12}
            tick={{ fill: '#9CA3AF' }}
          />
          <YAxis 
            stroke="#9CA3AF"
            fontSize={12}
            tick={{ fill: '#9CA3AF' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F9FAFB'
            }}
            labelStyle={{ color: '#F9FAFB' }}
          />
          <Area
            type="monotone"
            dataKey="activeUsers"
            stroke="#3B82F6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorUsers)"
            name="Active Users"
          />
          <Area
            type="monotone"
            dataKey="sessions"
            stroke="#8B5CF6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorSessions)"
            name="Sessions"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}