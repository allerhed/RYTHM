'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input, Button } from '../../../components/Form'
import { Toast } from '../../../components/Feedback'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null)
  const [error, setError] = useState('')

  const validateEmail = (email: string) => {
    if (!email) {
      return 'Email is required'
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return 'Please enter a valid email address'
    }
    return ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const emailError = validateEmail(email)
    if (emailError) {
      setError(emailError)
      setToast({ type: 'error', message: emailError })
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('/api/trpc/auth.requestPasswordReset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send reset email')
      }

      setSubmitted(true)
      setToast({ 
        type: 'success', 
        message: 'Password reset link sent! Check your email.' 
      })
    } catch (error: any) {
      console.error('Request password reset error:', error)
      setToast({ 
        type: 'error', 
        message: error.message || 'Failed to send reset email. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <header className="safe-area-top px-6 pt-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/auth/login')}
              className="flex items-center justify-center w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-gray-600 dark:text-gray-400">←</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Password Reset</h1>
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
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-2xl mb-6">
                <span className="text-3xl">✉️</span>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Check Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                We've sent a password reset link to:
              </p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-6">
                {email}
              </p>
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
              <div className="space-y-4 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 dark:text-blue-400 text-lg">1.</span>
                  <p>Check your inbox (and spam folder) for an email from <strong>info@rythm.training</strong></p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 dark:text-blue-400 text-lg">2.</span>
                  <p>Click the reset link in the email (valid for 1 hour)</p>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-blue-600 dark:text-blue-400 text-lg">3.</span>
                  <p>Create a new password for your account</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                  Didn't receive the email?
                </p>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="secondary"
                  className="w-full"
                >
                  Try Again
                </Button>
              </div>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <header className="safe-area-top px-6 pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 transition-colors"
          >
            <span className="text-gray-600 dark:text-gray-400">←</span>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Reset Password</h1>
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
              <span className="text-3xl">🔐</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              Forgot Password?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              No worries! Enter your email and we'll send you a reset link.
            </p>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  label="Email address"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                  }}
                  error={error}
                  placeholder="Enter your email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  className="bg-gray-50/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  We'll send a password reset link to this email address.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">
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
