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
  about?: string
  avatarUrl?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, keepMeLoggedIn?: boolean) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (data: ProfileUpdateData) => Promise<void>
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>
  updateAvatar: (file: File) => Promise<void>
}

interface ProfileUpdateData {
  firstName: string
  lastName: string
  email: string
  about: string
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
    try {
      const storedToken = localStorage.getItem('auth-token')
      const storedUser = localStorage.getItem('auth-user')
      
      if (storedToken && storedUser) {
        // Validate that storedUser is not '[object Object]'
        if (storedUser === '[object Object]' || storedUser.startsWith('[object')) {
          console.warn('Invalid user data in localStorage, clearing...')
          localStorage.removeItem('auth-token')
          localStorage.removeItem('auth-user')
        } else {
          try {
            const userData = JSON.parse(storedUser)
            // Validate parsed data structure
            if (userData && typeof userData === 'object' && userData.id) {
              setToken(storedToken)
              setUser(userData)
            } else {
              console.warn('Invalid user data structure, clearing localStorage')
              localStorage.removeItem('auth-token')
              localStorage.removeItem('auth-user')
            }
          } catch (parseError) {
            console.error('Failed to parse stored user data:', parseError)
            localStorage.removeItem('auth-token')
            localStorage.removeItem('auth-user')
          }
        }
      }
    } catch (error) {
      console.error('Error initializing auth from localStorage:', error)
      // Clear potentially corrupted data
      try {
        localStorage.removeItem('auth-token')
        localStorage.removeItem('auth-user')
      } catch (clearError) {
        console.error('Error clearing localStorage:', clearError)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string, keepMeLoggedIn: boolean = false): Promise<void> => {
    console.log('🔑 AuthContext.login called with email:', email, 'keepMeLoggedIn:', keepMeLoggedIn)
    setIsLoading(true)
    
    try {
      // Use relative URL to go through the mobile app's proxy
      const loginUrl = '/api/auth/login'
      console.log('📡 Making fetch request to proxy:', loginUrl)
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, keepMeLoggedIn }),
      })

      console.log('📡 API response status:', response.status, response.statusText)

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ API error response:', error)
        throw new Error(error.error || 'Login failed')
      }

      const data = await response.json()
      console.log('✅ API success response:', data)
      const { token: authToken, user: userData } = data

      // Store in state and localStorage
      console.log('💾 Storing auth data in state and localStorage...')
      
      // Validate data before storing
      if (!userData || typeof userData !== 'object' || !userData.id) {
        throw new Error('Invalid user data received from server')
      }
      
      setToken(authToken)
      setUser(userData as User)
      
      try {
        localStorage.setItem('auth-token', authToken)
        const userDataString = JSON.stringify(userData)
        localStorage.setItem('auth-user', userDataString)
        console.log('✅ Auth data stored successfully')
      } catch (storageError) {
        console.error('Failed to store auth data:', storageError)
        // Continue without localStorage if it fails
      }

    } catch (error: any) {
      console.error('❌ Login error:', error)
      throw new Error(error.message || 'Login failed')
    } finally {
      console.log('🏁 AuthContext.login finished')
      setIsLoading(false)
    }
  }

  const register = async (data: RegisterData): Promise<void> => {
    console.log('AuthContext.register called with:', data)
    setIsLoading(true)
    
    try {
      // Use relative URL to go through the mobile app's proxy
      const registerUrl = '/api/auth/register'
      console.log('Making fetch request to proxy:', registerUrl)
      
      const response = await fetch(registerUrl, {
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
      // Validate data before storing
      if (!userData || typeof userData !== 'object' || !userData.id) {
        throw new Error('Invalid user data received from server')
      }
      
      setToken(authToken)
      setUser(userData as User)
      
      try {
        localStorage.setItem('auth-token', authToken)
        const userDataString = JSON.stringify(userData)
        localStorage.setItem('auth-user', userDataString)
      } catch (storageError) {
        console.error('Failed to store auth data:', storageError)
        // Continue without localStorage if it fails
      }

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
    
    try {
      localStorage.removeItem('auth-token')
      localStorage.removeItem('auth-user')
    } catch (error) {
      console.error('Error clearing localStorage on logout:', error)
      // Continue with logout even if localStorage fails
    }
    
    router.push('/auth/login')
  }

  const refreshToken = async (): Promise<void> => {
    if (!token) {
      throw new Error('No token to refresh')
    }

    try {
      const response = await fetch('/api/trpc/auth.refresh', {
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

  const fetchProfile = async (): Promise<void> => {
    if (!token) {
      throw new Error('No authentication token')
    }

    try {
      // Use relative URL to go through the mobile app's proxy
      const profileUrl = '/api/auth/profile'
      
      const response = await fetch(profileUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        // If it's an auth error, clear storage and throw
        if (response.status === 401 || response.status === 403) {
          try {
            localStorage.removeItem('auth-token')
            localStorage.removeItem('auth-user')
          } catch (storageError) {
            console.error('Error clearing storage:', storageError)
          }
          setUser(null)
          setToken(null)
        }
        throw new Error(error.error || 'Profile fetch failed')
      }

      const responseData = await response.json()
      const userData = responseData

      // Validate user data structure
      if (!userData || typeof userData !== 'object' || !userData.id) {
        throw new Error('Invalid user data received from server')
      }

      // Update state and localStorage
      setUser(userData as User)
      
      try {
        const userDataString = JSON.stringify(userData)
        localStorage.setItem('auth-user', userDataString)
      } catch (storageError) {
        console.error('Failed to store user data:', storageError)
        // Continue without localStorage if it fails
      }

    } catch (error: any) {
      console.error('Profile fetch error:', error)
      throw new Error(error.message || 'Profile fetch failed')
    }
  }

  const updateProfile = async (data: ProfileUpdateData): Promise<void> => {
    if (!token) {
      throw new Error('No authentication token')
    }

    try {
      // Use relative URL to go through the mobile app's proxy
      const profileUrl = '/api/auth/profile'
      
      const response = await fetch(profileUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Profile update failed')
      }

      const responseData = await response.json()
      const updatedUser = responseData.user

      // Update state and localStorage
      setUser(updatedUser as User)
      localStorage.setItem('auth-user', JSON.stringify(updatedUser))

    } catch (error: any) {
      console.error('Profile update error:', error)
      throw new Error(error.message || 'Profile update failed')
    }
  }

  const updatePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    if (!token) {
      throw new Error('No authentication token')
    }

    try {
      // Use relative URL to go through the mobile app's proxy
      const passwordUrl = '/api/auth/password'
      
      const response = await fetch(passwordUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Password update failed')
      }

    } catch (error: any) {
      console.error('Password update error:', error)
      throw new Error(error.message || 'Password update failed')
    }
  }

  const updateAvatar = async (file: File): Promise<void> => {
    if (!token) {
      throw new Error('No authentication token')
    }

    try {
      // Use relative URL to go through the mobile app's proxy
      const avatarUrl = '/api/auth/avatar'
      
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch(avatarUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Avatar upload failed')
      }

      const responseData = await response.json()
      const updatedUser = responseData.user

      // Update state and localStorage
      setUser(updatedUser as User)
      localStorage.setItem('auth-user', JSON.stringify(updatedUser))

    } catch (error: any) {
      console.error('Avatar update error:', error)
      throw new Error(error.message || 'Avatar upload failed')
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
    fetchProfile,
    updateProfile,
    updatePassword,
    updateAvatar,
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