'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { AuthProvider } from '../contexts/AuthContext'
import ErrorBoundary, { setupGlobalErrorHandlers } from '../components/ErrorBoundary'

// Simplified tRPC placeholder - full router configuration to be added later
const mockQueryResult = (defaultData: any = null) => ({ 
  data: defaultData, 
  isLoading: false, 
  error: null, 
  refetch: () => Promise.resolve(),
  isRefetching: false,
  isFetching: false,
  isSuccess: true,
  isError: false,
  status: 'success' as const
})

const mockArrayQueryResult = (defaultData: any[] = []) => ({ 
  data: defaultData, 
  isLoading: false, 
  error: null, 
  refetch: () => Promise.resolve(),
  isRefetching: false,
  isFetching: false,
  isSuccess: true,
  isError: false,
  status: 'success' as const
})

const mockMutationResult = () => ({ 
  mutate: (data?: any) => {}, 
  mutateAsync: (data?: any) => Promise.resolve(data || {}),
  isLoading: false,
  isError: false,
  isSuccess: false,
  error: null,
  data: null,
  reset: () => {},
  status: 'idle' as const
})

export const trpc = {
  analytics: {
    overview: {
      useQuery: (...args: any[]) => mockQueryResult()
    },
    trainingScore: {
      useQuery: (...args: any[]) => mockQueryResult()
    }
  },
  sessions: {
    recentActivity: {
      useQuery: (...args: any[]) => mockArrayQueryResult()
    },
    list: {
      useQuery: (...args: any[]) => mockArrayQueryResult()
    },
    count: {
      useQuery: (...args: any[]) => mockQueryResult(0)
    }
  },
  exerciseTemplates: {
    create: {
      useMutation: (...args: any[]) => mockMutationResult()
    },
    list: {
      useQuery: (...args: any[]) => mockArrayQueryResult()
    }
  },
  workoutTemplates: {
    list: {
      useQuery: (...args: any[]) => mockArrayQueryResult()
    },
    create: {
      useMutation: (...args: any[]) => mockMutationResult()
    },
    update: {
      useMutation: (...args: any[]) => mockMutationResult()
    },
    delete: {
      useMutation: (...args: any[]) => mockMutationResult()
    },
    getForSelection: {
      useQuery: (...args: any[]) => mockArrayQueryResult()
    },
    getById: {
      useQuery: (...args: any[]) => mockQueryResult({ exercises: [] })
    }
  }
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

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}