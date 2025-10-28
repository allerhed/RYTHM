'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input, Button } from '../../../components/Form'
import { Toast } from '../../../components/Feedback'
import { useAuth } from '../../../contexts/AuthContext'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  tenantName: string
}

interface FormErrors {
  email?: string
  password?: string
  confirmPassword?: string
  firstName?: string
  lastName?: string
  tenantName?: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading: authLoading } = useAuth()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    tenantName: '',
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; message: string } | null>(null)
  const [errors, setErrors] = useState<FormErrors>({})
  const [step, setStep] = useState(1) // Multi-step form

  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and a number'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required'
    }
    
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required'
    }
    
    if (!formData.tenantName) {
      newErrors.tenantName = 'Organization name is required'
    } else if (formData.tenantName.length < 2) {
      newErrors.tenantName = 'Organization name must be at least 2 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1 && validateStep1()) {
      setStep(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Form submission started', { step, formData })
    
    if (!validateStep2()) {
      setToast({ type: 'error', message: 'Please fix the errors below' })
      return
    }
    
    setLoading(true)
    
    try {
      console.log('Calling register function with data:', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        tenantName: formData.tenantName,
      })
      
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        tenantName: formData.tenantName,
      })
      
      console.log('Registration successful!')
      setToast({ type: 'success', message: 'Welcome to RYTHM! Setting up your account...' })
      
      // Redirect to dashboard after successful registration
      // Give a moment for the auth state to update
      setTimeout(() => {
        console.log('Redirecting to dashboard...')
        router.push('/dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('Registration error:', error)
      setToast({ 
        type: 'error', 
        message: error.message || 'Registration failed. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      {/* Header */}
      <header className="safe-area-top px-6 pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => step === 1 ? router.back() : setStep(1)}
            className="flex items-center justify-center w-10 h-10 bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-xl border border-dark-border hover:bg-dark-elevated hover:border-orange-primary/30 transition-all"
          >
            <span className="text-orange-primary">←</span>
          </button>
          <h1 className="text-lg font-semibold text-text-primary">Create Account</h1>
          <div className="w-10" /> {/* Spacer for center alignment */}
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
          {/* Logo and Welcome */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-primary to-orange-hover rounded-2xl mb-6 shadow-glow-orange">
              <span className="text-2xl font-bold text-white">R</span>
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-primary to-orange-hover bg-clip-text text-transparent mb-3">
              {step === 1 ? 'Join RYTHM' : 'Almost There!'}
            </h2>
            <p className="text-text-secondary text-lg">
              {step === 1 
                ? 'Start your fitness journey today'
                : 'Complete your profile setup'
              }
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-secondary font-medium">
                Step {step} of 2
              </span>
              <span className="text-sm text-text-secondary">
                {step === 1 ? 'Account Setup' : 'Personal Details'}
              </span>
            </div>
            <div className="w-full bg-dark-border rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-orange-primary to-orange-hover h-2 rounded-full transition-all duration-500"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>

          {/* Form */}
          <div className="bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-2xl p-8 shadow-card border border-dark-border">
            <form onSubmit={step === 1 ? handleNextStep : handleSubmit} className="space-y-6">
              {step === 1 ? (
                // Step 1: Account credentials
                <>
                  <div>
                    <Input
                      label="Email address"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
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
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      error={errors.password}
                      placeholder="Create a strong password"
                      autoComplete="new-password"
                      helperText="8+ characters with uppercase, lowercase, and number"
                      required
                      className="bg-gray-50/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50"
                    />
                  </div>

                  <div>
                    <Input
                      label="Confirm Password"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange('confirmPassword')}
                      error={errors.confirmPassword}
                      placeholder="Confirm your password"
                      autoComplete="new-password"
                      required
                      className="bg-gray-50/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full bg-gradient-to-r from-orange-primary to-orange-hover hover:from-orange-dark hover:to-orange-primary text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    Continue
                  </Button>
                </>
              ) : (
                // Step 2: Personal information
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      type="text"
                      value={formData.firstName}
                      onChange={handleInputChange('firstName')}
                      error={errors.firstName}
                      placeholder="First name"
                      autoComplete="given-name"
                      required
                      className="bg-gray-50/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50"
                    />

                    <Input
                      label="Last Name"
                      type="text"
                      value={formData.lastName}
                      onChange={handleInputChange('lastName')}
                      error={errors.lastName}
                      placeholder="Last name"
                      autoComplete="family-name"
                      required
                      className="bg-gray-50/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50"
                    />
                  </div>

                  <div>
                    <Input
                      label="Organization Name"
                      type="text"
                      value={formData.tenantName}
                      onChange={handleInputChange('tenantName')}
                      error={errors.tenantName}
                      placeholder="Your gym, team, or organization"
                      autoComplete="organization"
                      helperText="This will be your organization's workspace"
                      required
                      className="bg-gray-50/50 dark:bg-gray-700/50 border-gray-200/50 dark:border-gray-600/50"
                    />
                  </div>

                  <div className="space-y-3">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={loading || authLoading}
                      className="w-full bg-gradient-to-r from-orange-primary to-orange-hover hover:from-orange-dark hover:to-orange-primary text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      {loading || authLoading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      className="w-full bg-white/50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700"
                      onClick={() => setStep(1)}
                    >
                      Back
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>

          {/* Terms and login link */}
          <div className="mt-8 space-y-4">
            {step === 2 && (
              <p className="text-sm text-center text-text-secondary leading-relaxed">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-orange-primary hover:text-orange-hover dark:hover:text-blue-300 font-medium transition-colors">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-orange-primary hover:text-orange-hover dark:hover:text-blue-300 font-medium transition-colors">
                  Privacy Policy
                </Link>
              </p>
            )}
            
            <div className="text-center">
              <p className="text-text-secondary">
                Already training with RYTHM?{' '}
                <Link 
                  href="/auth/login" 
                  className="text-orange-primary font-semibold hover:text-orange-hover dark:hover:text-blue-300 transition-colors"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          {/* Benefits preview */}
          {step === 1 && (
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center mb-2">
                  <span className="text-orange-primary">📊</span>
                </div>
                <span className="text-xs text-text-secondary font-medium">Smart Analytics</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center mb-2">
                  <span className="text-orange-600 dark:text-orange-400">💪</span>
                </div>
                <span className="text-xs text-text-secondary font-medium">All Training</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-2">
                  <span className="text-purple-600 dark:text-purple-400">📈</span>
                </div>
                <span className="text-xs text-text-secondary font-medium">Progress Tracking</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}