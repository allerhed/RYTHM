'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Check if this is a localStorage/JSON parsing error
    if (error.message?.includes('JSON.parse') || 
        error.message?.includes('[object Object]') ||
        error.message?.includes('storage')) {
      console.warn('Storage-related error caught by ErrorBoundary:', error.message)
      
      // Clear potentially corrupted localStorage data
      try {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-user')
        console.log('Cleared potentially corrupted auth data')
      } catch (clearError) {
        console.error('Error clearing localStorage:', clearError)
      }
      
      // Reset the error state and reload
      this.setState({ hasError: false })
      window.location.href = '/auth/login'
      return
    }
    
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md mx-auto text-center p-6">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-text-primary mb-2">
              Something went wrong
            </h1>
            <p className="text-text-secondary mb-4">
              We encountered an unexpected error. Please try refreshing the page.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  // Clear all data and restart
                  try {
                    localStorage.clear()
                  } catch (e) {}
                  window.location.href = '/auth/login'
                }}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Reset & Login Again
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Global error handler for unhandled promise rejections and runtime errors
export function setupGlobalErrorHandlers() {
  if (typeof window === 'undefined') return

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason
    if (error?.message?.includes('JSON.parse') || 
        error?.message?.includes('[object Object]') ||
        error?.message?.includes('storage')) {
      console.warn('Storage-related promise rejection caught:', error.message)
      event.preventDefault()
      
      // Clear potentially corrupted data
      try {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-user')
      } catch (clearError) {
        console.error('Error clearing localStorage:', clearError)
      }
    }
  })

  // Handle global errors
  window.addEventListener('error', (event) => {
    const error = event.error || event.message
    if (typeof error === 'string' && (
        error.includes('JSON.parse') || 
        error.includes('[object Object]') ||
        error.includes('storage') ||
        error.includes('_storageChangeDispatcher'))) {
      console.warn('Storage-related error caught:', error)
      event.preventDefault()
      
      // Clear potentially corrupted data
      try {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-user')
      } catch (clearError) {
        console.error('Error clearing localStorage:', clearError)
      }
    }
  })
}

export default ErrorBoundary