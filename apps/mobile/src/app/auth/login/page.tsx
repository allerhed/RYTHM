'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input, Button } from '../../../components/Form'
import { Toast } from '../../../components/Feedback'
import { useAuth } from '../../../contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}
    
    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      setToast({ type: 'error', message: 'Please fix the errors below' })
      return
    }
    
    setLoading(true)
    
    try {
      await login(email, password, rememberMe)
      setToast({ type: 'success', message: 'Welcome back! Redirecting...' })
      
      // Redirect to dashboard after successful login
      setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
    } catch (error: any) {
      console.error('Login error:', error)
      setToast({ 
        type: 'error', 
        message: error.message || 'Login failed. Please check your credentials.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const isFormLoading = loading || authLoading

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Header */}
      <header className="safe-area-top px-6 pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-gray-600 dark:text-gray-400">←</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Sign In</h1>
          <div className="w-10" /> {/* Spacer for center alignment */}
        </div>
      </header>
      
      {/* Toast notifications */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main content */}
      <div className="px-6 py-8">
        <div className="max-w-md mx-auto">
          {/* Logo and Welcome */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg">
              <span className="text-2xl font-bold text-white">R</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Welcome Back
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Ready to continue your training journey?
            </p>
          </div>

          {/* Login form */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setEmail(e.target.value)
                    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }))
                  }}
                  error={errors.email}
                  placeholder="Enter your email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  className="bg-gray-50/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50"
                />
              </div>

              <div>
                <Input
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }))
                  }}
                  error={errors.password}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="bg-gray-50/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">
                    Keep me logged in (4 weeks)
                  </span>
                </label>
                
                <Link 
                  href="/auth/forgot-password" 
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isFormLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {isFormLoading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>
          </div>

          {/* Sign up link */}
          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              New to RYTHM?{' '}
              <Link 
                href="/auth/register" 
                className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Create your account
              </Link>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Join thousands of athletes already training smarter
            </p>
          </div>

          {/* Quick features */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-2">
                <span className="text-blue-600 dark:text-blue-400 text-sm">📊</span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Analytics</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-2">
                <span className="text-green-600 dark:text-green-400 text-sm">🎯</span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Goal Setting</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-2">
                <span className="text-purple-600 dark:text-purple-400 text-sm">📈</span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">Progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}