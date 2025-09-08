'use client'
import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '../../components/Navigation'
import { Button } from '../../components/Form'
import { useAuth, withAuth } from '../../contexts/AuthContext'

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  about: string
}

interface PasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

interface Toast {
  type: 'success' | 'error'
  message: string
}

function ProfilePage() {
  const router = useRouter()
  const { user, updateProfile, updatePassword, updateAvatar, fetchProfile } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile')
  const [loading, setLoading] = useState(false)
  const [avatarLoading, setAvatarLoading] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  
  const [profileData, setProfileData] = useState<ProfileData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    about: user?.about || ''
  })
  
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch fresh profile data when component mounts
  React.useEffect(() => {
    const loadProfile = async () => {
      try {
        await fetchProfile()
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      }
    }
    
    if (user) {
      loadProfile()
    }
  }, [])

  // Update profile data when user changes
  React.useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        about: user.about || ''
      })
    }
  }, [user])

  // Clear toast after 5 seconds
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const validateProfileForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    
    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    
    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePasswordForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    }
    
    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password'
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateProfileForm()) {
      setToast({ type: 'error', message: 'Please fix the errors below' })
      return
    }
    
    setLoading(true)
    
    try {
      await updateProfile(profileData)
      setToast({ type: 'success', message: 'Profile updated successfully!' })
    } catch (error: any) {
      console.error('Profile update error:', error)
      setToast({ type: 'error', message: error.message || 'Failed to update profile' })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validatePasswordForm()) {
      setToast({ type: 'error', message: 'Please fix the errors below' })
      return
    }
    
    setLoading(true)
    
    try {
      await updatePassword(passwordData.currentPassword, passwordData.newPassword)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setToast({ type: 'success', message: 'Password updated successfully!' })
    } catch (error: any) {
      console.error('Password update error:', error)
      setToast({ type: 'error', message: error.message || 'Failed to update password' })
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setToast({ type: 'error', message: 'Please select an image file' })
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: 'error', message: 'Image must be smaller than 5MB' })
      return
    }

    setAvatarLoading(true)
    
    try {
      await updateAvatar(file)
      setToast({ type: 'success', message: 'Profile picture updated successfully!' })
    } catch (error: any) {
      console.error('Avatar update error:', error)
      setToast({ type: 'error', message: error.message || 'Failed to update profile picture' })
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleInputChange = (field: keyof ProfileData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfileData(prev => ({ ...prev, [field]: e.target.value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handlePasswordChange = (field: keyof PasswordData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData(prev => ({ ...prev, [field]: e.target.value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const getAvatarUrl = () => {
    if (user?.avatarUrl) {
      return `http://localhost:3001${user.avatarUrl}`
    }
    return null
  }

  const getInitials = () => {
    const firstName = user?.firstName || profileData.firstName || ''
    const lastName = user?.lastName || profileData.lastName || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header 
        title="Profile"
        showBack={true}
        onBack={() => router.push('/dashboard')}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            Done
          </Button>
        }
      />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-20 left-4 right-4 z-50 p-4 rounded-lg border ${
          toast.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200'
            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="px-4 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Profile Picture Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div className="text-center">
              <div className="relative inline-block">
                <div 
                  className="w-24 h-24 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900 flex items-center justify-center cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
                  onClick={handleAvatarClick}
                >
                  {getAvatarUrl() ? (
                    <img 
                      src={getAvatarUrl()!} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-semibold text-primary-600 dark:text-primary-400">
                      {getInitials()}
                    </span>
                  )}
                  {avatarLoading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="spinner w-6 h-6 border-white" />
                    </div>
                  )}
                </div>
                <button
                  onClick={handleAvatarClick}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
                  disabled={avatarLoading}
                >
                  📷
                </button>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                Click to upload a new profile picture
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                JPG, PNG or GIF (max 5MB)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'profile'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Profile Information
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'password'
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Change Password
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'profile' ? (
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={profileData.firstName}
                        onChange={handleInputChange('firstName')}
                        className={`input w-full ${errors.firstName ? 'border-red-300 dark:border-red-700' : ''}`}
                        placeholder="Enter your first name"
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        value={profileData.lastName}
                        onChange={handleInputChange('lastName')}
                        className={`input w-full ${errors.lastName ? 'border-red-300 dark:border-red-700' : ''}`}
                        placeholder="Enter your last name"
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={profileData.email}
                      onChange={handleInputChange('email')}
                      className={`input w-full ${errors.email ? 'border-red-300 dark:border-red-700' : ''}`}
                      placeholder="Enter your email address"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="about" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      About
                    </label>
                    <textarea
                      id="about"
                      value={profileData.about}
                      onChange={handleInputChange('about')}
                      rows={4}
                      maxLength={500}
                      className="input w-full resize-none"
                      placeholder="Tell us about yourself, your fitness goals, or training experience..."
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {profileData.about.length}/500 characters
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="spinner w-5 h-5 mr-2" />
                          Updating Profile...
                        </div>
                      ) : (
                        'Update Profile'
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange('currentPassword')}
                      className={`input w-full ${errors.currentPassword ? 'border-red-300 dark:border-red-700' : ''}`}
                      placeholder="Enter your current password"
                    />
                    {errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currentPassword}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange('newPassword')}
                      className={`input w-full ${errors.newPassword ? 'border-red-300 dark:border-red-700' : ''}`}
                      placeholder="Enter your new password"
                    />
                    {errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.newPassword}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange('confirmPassword')}
                      className={`input w-full ${errors.confirmPassword ? 'border-red-300 dark:border-red-700' : ''}`}
                      placeholder="Confirm your new password"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                    )}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">Password Requirements:</h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Mix of letters, numbers, and symbols recommended</li>
                      <li>• Different from your current password</li>
                    </ul>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      className="w-full"
                      disabled={loading}
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="spinner w-5 h-5 mr-2" />
                          Updating Password...
                        </div>
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Account Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Account Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">User ID:</span>
                <span className="text-gray-900 dark:text-gray-100 font-mono">{user?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Role:</span>
                <span className="text-gray-900 dark:text-gray-100 capitalize">{user?.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Tenant ID:</span>
                <span className="text-gray-900 dark:text-gray-100 font-mono">{user?.tenantId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export the component wrapped with authentication protection
export default withAuth(ProfilePage)