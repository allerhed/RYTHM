'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input, Button } from '../../../components/Form'
import { Header } from '../../../components/Navigation'
import { Toast } from '../../../components/Feedback'
import { useAuth } from '../../../contexts/AuthContext'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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
      await login(email, password)
      setToast({ type: 'success', message: 'Login successful!' })
      
      // Redirect to dashboard after successful login
      setTimeout(() => router.push('/dashboard'), 1000)
    } catch (error: any) {
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with back navigation */}
      <Header 
        title="Sign In" 
        showBack 
        onBack={() => router.back()} 
      />
      
      {/* Toast notifications */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Main content */}
      <div className="px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Welcome message */}
          <div className="text-center mb-8">
            <h2 className="text-title font-bold text-gray-900 dark:text-gray-100 mb-2">
              Welcome back!
            </h2>
            <p className="text-body text-gray-600 dark:text-gray-400">
              Sign in to continue your training journey
            </p>
          </div>

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
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
            />

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
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="ml-2 text-caption text-gray-600 dark:text-gray-400">
                  Remember me
                </span>
              </label>
              
              <Link 
                href="/auth/forgot-password" 
                className="text-caption text-primary-600 dark:text-primary-400 hover:underline focus:underline focus:outline-none"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isFormLoading}
              className="w-full"
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="my-8 relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-caption">
              <span className="bg-gray-50 dark:bg-gray-900 px-4 text-gray-500 dark:text-gray-400">
                or
              </span>
            </div>
          </div>

          {/* Social login (demo) */}
          <div className="space-y-3">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setToast({ type: 'info', message: 'Social login coming soon!' })}
              disabled={isFormLoading}
            >
              <span className="mr-2">🍎</span>
              Continue with Apple
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => setToast({ type: 'info', message: 'Social login coming soon!' })}
              disabled={isFormLoading}
            >
              <span className="mr-2">🔷</span>
              Continue with Google
            </Button>
          </div>

          {/* Sign up link */}
          <div className="mt-8 text-center">
            <p className="text-body text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link 
                href="/auth/register" 
                className="text-primary-600 dark:text-primary-400 font-medium hover:underline focus:underline focus:outline-none"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}