'use client'
import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { trpc } from '../../../lib/trpc'
import { Input, Button } from '../../../components/Form'
import { Toast } from '../../../components/Feedback'

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') || ''
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [success, setSuccess] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null)
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})

  const verifyToken = trpc.authentication.verifyResetToken.useQuery(
    { token },
    { 
      enabled: !!token,
      retry: false,
      onError: () => {
        setToast({ type: 'error', message: 'This reset link is invalid or has expired' })
      }
    }
  )

  const resetPassword = trpc.authentication.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true)
      setToast({ 
        type: 'success', 
        message: 'Password reset successfully! Redirecting to login...' 
      })
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    },
    onError: (error: any) => {
      setToast({ 
        type: 'error', 
        message: error.message || 'Failed to reset password. Please try again.' 
      })
    }
  })

  const validateForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {}
    
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number'
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
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
    
    resetPassword.mutate({ 
      token,
      newPassword: password,
    })
  }

  if (verifyToken.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-text-secondary">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  if (verifyToken.isError || !verifyToken.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <header className="safe-area-top px-6 pt-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/auth/login')}
              className="flex items-center justify-center w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-text-secondary">←</span>
            </button>
            <h1 className="text-lg font-semibold text-text-primary">Reset Password</h1>
            <div className="w-10" />
          </div>
        </header>

        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}

        <div className="px-6 py-8">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900 rounded-2xl mb-6">
                <span className="text-3xl">❌</span>
              </div>
              <h2 className="text-3xl font-bold text-text-primary mb-3">
                Invalid Reset Link
              </h2>
              <p className="text-text-secondary text-lg">
                This password reset link is invalid or has expired.
              </p>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
              <p className="text-text-secondary mb-6 text-center">
                Reset links expire after 1 hour for security reasons.
              </p>
              <Link href="/auth/forgot-password">
                <Button
                  variant="primary"
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                >
                  Request New Reset Link
                </Button>
              </Link>
            </div>

            <div className="mt-8 text-center">
              <Link 
                href="/auth/login" 
                className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                ← Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center">
        <div className="text-center px-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-2xl mb-6">
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="text-3xl font-bold text-text-primary mb-3">
            Password Reset Complete!
          </h2>
          <p className="text-text-secondary text-lg">
            Redirecting you to login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <header className="safe-area-top px-6 pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/auth/login')}
            className="flex items-center justify-center w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-text-secondary">←</span>
          </button>
          <h1 className="text-lg font-semibold text-text-primary">Reset Password</h1>
          <div className="w-10" />
        </div>
      </header>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="px-6 py-8">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-lg">
              <span className="text-3xl">🔑</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Create New Password
            </h2>
            <p className="text-text-secondary text-lg">
              for <strong>{verifyToken.data?.email || 'your account'}</strong>
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  label="New Password"
                  type="password"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }))
                  }}
                  error={errors.password}
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  required
                  className="bg-gray-50/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50"
                />
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Must be at least 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              <div>
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: undefined }))
                  }}
                  error={errors.confirmPassword}
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  required
                  className="bg-gray-50/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={resetPassword.isLoading}
                disabled={success}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {resetPassword.isLoading ? 'Resetting Password...' : 'Reset Password'}
              </Button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-text-secondary">
              Remember your password?{' '}
              <Link 
                href="/auth/login" 
                className="text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
