'use client'
import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Input, Button } from '../../../components/Form'
import { Header } from '../../../components/Navigation'
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
      setToast({ type: 'success', message: 'Account created successfully!' })
      
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header 
        title="Create Account" 
        showBack 
        onBack={() => step === 1 ? router.back() : setStep(1)} 
      />
      
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      <div className="px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-caption text-gray-500 dark:text-gray-400">
                Step {step} of 2
              </span>
              <span className="text-caption text-gray-500 dark:text-gray-400">
                {step === 1 ? 'Account Details' : 'Personal Info'}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 2) * 100}%` }}
              />
            </div>
          </div>

          {/* Welcome message */}
          <div className="text-center mb-8">
            <h2 className="text-title font-bold text-gray-900 dark:text-gray-100 mb-2">
              {step === 1 ? 'Create Your Account' : 'Tell Us About You'}
            </h2>
            <p className="text-body text-gray-600 dark:text-gray-400">
              {step === 1 
                ? 'Start your training journey with RYTHM'
                : 'Set up your organization profile'
              }
            </p>
          </div>

          <form onSubmit={step === 1 ? handleNextStep : handleSubmit} className="space-y-6">
            {step === 1 ? (
              // Step 1: Account credentials
              <>
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
                />

                <Input
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={errors.password}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  helperText="Must be 8+ characters with uppercase, lowercase, and number"
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                  error={errors.confirmPassword}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
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
                  />
                </div>

                <Input
                  label="Organization Name"
                  type="text"
                  value={formData.tenantName}
                  onChange={handleInputChange('tenantName')}
                  error={errors.tenantName}
                  placeholder="Your gym, team, or organization"
                  autoComplete="organization"
                  helperText="This will be your organization's workspace in RYTHM"
                  required
                />

                <div className="space-y-4">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={loading || authLoading}
                    className="w-full"
                  >
                    Create Account
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="w-full"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                </div>
              </>
            )}
          </form>

          {/* Terms and login link */}
          <div className="mt-8 space-y-4">
            {step === 2 && (
              <p className="text-caption text-center text-gray-600 dark:text-gray-400">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            )}
            
            <div className="text-center">
              <p className="text-body text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <Link 
                  href="/auth/login" 
                  className="text-primary-600 dark:text-primary-400 font-medium hover:underline focus:underline focus:outline-none"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}