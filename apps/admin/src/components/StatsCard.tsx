/**
 * StatsCard
 * Purpose: Display a single analytics metric with unified dark gradient card styling.
 * Acceptance:
 *  - Card background: dark gradient from #1a1a1a to #232323
 *  - Icon container: dark-elevated background with subtle accent ring (orange by default)
 *  - Bottom bar: unified orange gradient accent (not per-card color anymore)
 *  - Optional change indicator with color-coded trend (+/-/neutral)
 *  - Accessible text contrast against dark background
 */
interface StatsCardProps {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
  /**
   * accent variant controls ring & accent bar color.
   * Defaults to primary. Future variants could include 'error'|'neutral'.
   */
  accent?: 'primary' | 'error' | 'neutral'
}

export function StatsCard({ title, value, change, changeType = 'neutral', icon, accent = 'primary' }: StatsCardProps) {
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

  const accentColorClass = {
    primary: 'text-orange-primary',
    error: 'text-error',
    neutral: 'text-text-secondary'
  }[accent]
  const ringShadow = {
    primary: 'ring-orange-500/40',
    error: 'ring-error/50',
    neutral: 'ring-dark-border'
  }[accent]

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#1a1a1a] to-[#232323] shadow-card hover:shadow-lg transition-colors duration-300 border border-dark-border">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              {title}
            </p>
            <p className="mt-2 text-3xl font-bold text-text-primary">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
          </div>
          <div className={`flex-shrink-0 p-3 rounded-xl bg-dark-elevated shadow-inner ring-1 ${ringShadow}`}> 
            <div className={accentColorClass}>
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
            <span className="text-sm text-text-secondary ml-2">
              from last month
            </span>
          </div>
        )}
      </div>
      {/* Accent bar */}
      <div className="accent-bar" />
    </div>
  )
}