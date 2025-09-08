'use client'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export interface User {
  id: string
  email: string
  role: 'athlete' | 'coach' | 'tenant_admin' | 'org_admin'
  firstName?: string
  lastName?: string
  tenantId: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  tenantName: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user && !!token

  // Initialize auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('auth-token')
    const storedUser = localStorage.getItem('auth-user')
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(userData)
      } catch (error) {
        console.error('Failed to parse stored user data:', error)
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-user')
      }
    }
    
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true)
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Login failed')
      }

      const data = await response.json()
      const { token: authToken, user: userData } = data

      // Store in state and localStorage
      setToken(authToken)
      setUser(userData as User)
      localStorage.setItem('auth-token', authToken)
      localStorage.setItem('auth-user', JSON.stringify(userData))

    } catch (error: any) {
      console.error('Login error:', error)
      throw new Error(error.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData): Promise<void> => {
    console.log('AuthContext.register called with:', data)
    setIsLoading(true)
    
    try {
      console.log('Making fetch request to:', 'http://localhost:3001/api/auth/register')
      const response = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      console.log('Response status:', response.status, response.statusText)

      if (!response.ok) {
        const error = await response.json()
        console.error('API error response:', error)
        throw new Error(error.error || 'Registration failed')
      }

      const responseData = await response.json()
      console.log('API success response:', responseData)
      const { token: authToken, user: userData } = responseData

      // Store in state and localStorage
      setToken(authToken)
      setUser(userData as User)
      localStorage.setItem('auth-token', authToken)
      localStorage.setItem('auth-user', JSON.stringify(userData))

    } catch (error: any) {
      console.error('Registration error:', error)
      throw new Error(error.message || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }

  const logout = (): void => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth-token')
    localStorage.removeItem('auth-user')
    router.push('/auth/login')
  }

  const refreshToken = async (): Promise<void> => {
    if (!token) {
      throw new Error('No token to refresh')
    }

    try {
      const response = await fetch('http://localhost:3001/api/trpc/auth.refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: { token }
        }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      const newToken = data.result.data.token

      setToken(newToken)
      localStorage.setItem('auth-token', newToken)

    } catch (error: any) {
      console.error('Token refresh error:', error)
      logout()
      throw new Error(error.message || 'Token refresh failed')
    }
  }

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!token) return

    const refreshInterval = setInterval(() => {
      refreshToken().catch(() => {
        // Token refresh failed, user will be logged out
      })
    }, 6 * 60 * 60 * 1000) // Refresh every 6 hours (token expires in 7 days)

    return () => clearInterval(refreshInterval)
  }, [token])

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Higher-order component for protected routes
interface WithAuthProps {
  redirectTo?: string
  requiredRole?: User['role'][]
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthProps = {}
) {
  const { redirectTo = '/auth/login', requiredRole } = options

  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading, user } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          router.push(redirectTo)
          return
        }

        // Check role requirements
        if (requiredRole && user && !requiredRole.includes(user.role)) {
          router.push('/unauthorized')
          return
        }
      }
    }, [isAuthenticated, isLoading, user, router])

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="spinner w-8 h-8" />
        </div>
      )
    }

    if (!isAuthenticated) {
      return null
    }

    if (requiredRole && user && !requiredRole.includes(user.role)) {
      return null
    }

    return <Component {...props} />
  }
}

// Hook for API calls with authentication
export function useAuthenticatedFetch() {
  const { token, logout } = useAuth()

  return async (url: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (response.status === 401) {
      logout()
      throw new Error('Unauthorized')
    }

    return response
  }
}