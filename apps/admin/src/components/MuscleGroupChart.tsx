'use client'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface MuscleGroupData {
  muscle_group: string
  total_sets: string
  unique_users: string
}

interface MuscleGroupChartProps {
  data: MuscleGroupData[]
  className?: string
}

const COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444',
  '#6366F1', '#EC4899', '#14B8A6', '#F97316', '#84CC16'
]

export function MuscleGroupChart({ data, className }: MuscleGroupChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`h-64 flex items-center justify-center ${className}`}>
        <p className="text-gray-400">No muscle group data available</p>
      </div>
    )
  }

  const chartData = data.slice(0, 8).map((item, index) => ({
    name: item.muscle_group.charAt(0).toUpperCase() + item.muscle_group.slice(1),
    value: parseInt(item.total_sets),
    users: parseInt(item.unique_users),
    color: COLORS[index % COLORS.length]
  }))

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-dark-elevated1 p-3 rounded-lg border border-gray-600 shadow-lg">
          <p className="text-white font-medium">{data.name}</p>
          <p className="text-orange-400">Sets: {data.value.toLocaleString()}</p>
          <p className="text-orange-400">Users: {data.users.toLocaleString()}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, percent }) => percent > 5 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}