import React from 'react'

interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export function LoadingSkeleton({ className = '', lines = 1 }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse ${className}`} aria-label="Loading content">
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="bg-dark-elevated rounded h-4 mb-2 last:mb-0"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  )
}

interface EmptyStateProps {
  icon?: string
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon = '📝', title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4" role="region" aria-label="Empty state">
      <div className="text-6xl mb-4" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-heading font-semibold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-body text-text-secondary mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  )
}

interface ToastProps {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  onClose?: () => void
  autoClose?: boolean
}

export function Toast({ type, message, onClose, autoClose = true }: ToastProps) {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, 5000)
      return () => clearTimeout(timer)
    }
  }, [autoClose, onClose])

  const typeStyles = {
    success: 'bg-green-900/90 border-green-700 text-green-100',
    error: 'bg-red-900/90 border-red-700 text-red-100',
    warning: 'bg-yellow-900/90 border-yellow-700 text-yellow-100',
    info: 'bg-orange-900/90 border-orange-primary text-orange-100'
  }

  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  }

  return (
    <div
      className={`fixed top-4 left-4 right-4 z-50 p-4 border rounded-lg shadow-lg ${typeStyles[type]}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <span className="flex-shrink-0 mr-3 text-lg" aria-hidden="true">
          {icons[type]}
        </span>
        <div className="flex-1">
          <p className="text-body font-medium">
            {message}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-3 nav-item p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
            aria-label="Close notification"
          >
            <span aria-hidden="true">×</span>
          </button>
        )}
      </div>
    </div>
  )
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <EmptyState
          icon="⚠️"
          title="Something went wrong"
          description="We're sorry, but something unexpected happened. Please try refreshing the page."
          action={
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          }
        />
      )
    }

    return this.props.children
  }
}