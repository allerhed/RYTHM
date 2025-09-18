'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import { useState, useEffect } from 'react'
import type { AppRouter } from '@rythm/api/src/router'
import { AuthProvider } from '../contexts/AuthContext'
import ErrorBoundary, { setupGlobalErrorHandlers } from '../components/ErrorBoundary'

// Create tRPC client
export const trpc = createTRPCReact<AppRouter>()

function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Client-side: use environment variable or fallback to localhost
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  }
  
  // Server-side: prioritize environment variables
  if (process.env.API_URL) {
    return process.env.API_URL
  }
  
  // Fallback for development
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://api:3001` // Use Docker service name for local development
}

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

  const [trpcClient] = useState(() => {
    const baseUrl = getBaseUrl()
    console.log('tRPC Client Configuration:', { baseUrl })
    
    return trpc.createClient({
      links: [
        httpBatchLink({
          url: `${baseUrl}/api/trpc`,
          headers() {
            const token = typeof window !== 'undefined' 
              ? localStorage.getItem('auth-token') 
              : null
            
            console.log('tRPC Request Headers:', { hasToken: !!token, token: token ? `${token.substring(0, 20)}...` : null })
            return token ? { authorization: `Bearer ${token}` } : {}
          },
        }),
      ],
    })
  })

  return (
    <ErrorBoundary>
      <AuthProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </trpc.Provider>
      </AuthProvider>
    </ErrorBoundary>
  )
}