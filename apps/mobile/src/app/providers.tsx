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
      useQuery: (params: any = {}) => {
        const [data, setData] = useState<any[] | null>(null)
        const [isLoading, setIsLoading] = useState(true)
        const [error, setError] = useState<Error | null>(null)

        useEffect(() => {
          const fetchExerciseTemplates = async () => {
            try {
              setIsLoading(true)
              setError(null)
              
              const token = localStorage.getItem('auth-token')
              if (!token) {
                console.log('❌ No authentication token found')
                setData([])
                return
              }

              const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.rythm.training'
              const queryParams = encodeURIComponent(JSON.stringify(params))
              
              console.log('🔍 Fetching exercise templates from:', apiUrl + '/api/trpc/exerciseTemplates.list')
              
              const response = await fetch(apiUrl + '/api/trpc/exerciseTemplates.list?input=' + queryParams, {
                method: 'GET',
                headers: {
                  'Authorization': 'Bearer ' + token,
                  'Content-Type': 'application/json',
                },
              })

              if (!response.ok) {
                const errorText = await response.text()
                console.error('❌ HTTP ' + response.status + ':', errorText)
                throw new Error('HTTP error! status: ' + response.status)
              }

              const result = await response.json()
              console.log('📊 Exercise templates API response:', result)
              
              // tRPC response format: { result: { data: [...] } }
              const exerciseTemplates = result.result?.data || []
              console.log('📊 Extracted exercise templates:', exerciseTemplates.length, 'templates')
              setData(exerciseTemplates)
            } catch (err: any) {
              console.error('❌ Error fetching exercise templates:', err)
              setError(err)
              setData([]) // Fallback to empty array on error
            } finally {
              setIsLoading(false)
            }
          }

          fetchExerciseTemplates()
        }, [JSON.stringify(params)])

        return {
          data,
          isLoading,
          error,
          refetch: () => Promise.resolve(),
          isRefetching: false,
          isFetching: isLoading,
          isSuccess: !isLoading && !error,
          isError: !!error,
          status: isLoading ? 'loading' : error ? 'error' : 'success' as const
        }
      }
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
