interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  gradient?: string
}

export function StatsCard({ title, value, change, changeType = 'neutral', icon, gradient = 'from-blue-500 to-blue-600' }: StatsCardProps) {
  const changeColorClass = {
    positive: 'text-green-400',
    negative: 'text-red-400',
    neutral: 'text-gray-400',
  }[changeType]

  const changeIcon = {
    positive: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    negative: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
    neutral: null,
  }[changeType]

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-300 border border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wide">
              {title}
            </p>
            <p className="mt-2 text-3xl font-bold text-white">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
          <div className={`flex-shrink-0 p-3 rounded-xl bg-gradient-to-r ${gradient} shadow-lg`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        </div>
        
        {change && (
          <div className="mt-4 flex items-center">
            {changeIcon && (
              <div className={`flex items-center ${changeColorClass} mr-2`}>
                {changeIcon}
              </div>
            )}
            <span className={`text-sm font-semibold ${changeColorClass}`}>
              {change}
            </span>
            <span className="text-sm text-gray-500 ml-2">
              from last month
            </span>
          </div>
        )}
      </div>
      
      {/* Decorative gradient border */}
      <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${gradient}`} />
    </div>
  )
}