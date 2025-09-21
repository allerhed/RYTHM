'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import ErrorBoundary, { setupGlobalErrorHandlers } from '../components/ErrorBoundary'
import { trpc, getTRPCClient } from '../lib/trpc'

export function Providers({ children }: { children: React.ReactNode }) {
  // Set up global error handlers for storage-related issues
  useEffect(() => {
    setupGlobalErrorHandlers()
  }, [])

  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: (failureCount, error: any) => {
          // Don't retry on 401 errors
          if (error?.status === 401) return false
          return failureCount < 3
        },
      },
    },
  }))

  const [trpcClient] = useState(() => getTRPCClient())

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  )
}
