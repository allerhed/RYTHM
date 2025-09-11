import React from 'react'

interface AvatarProps {
  user?: {
    firstName?: string
    lastName?: string
    email?: string
    avatarUrl?: string
  }
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showBorder?: boolean
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
}

const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-lg',
  xl: 'text-2xl'
}

export function Avatar({ user, size = 'md', className = '', showBorder = true }: AvatarProps) {
  const sizeClass = sizeClasses[size]
  const textSizeClass = textSizeClasses[size]
  const borderClass = showBorder ? 'border-2 border-gray-200 dark:border-gray-600' : ''
  
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`
    }
    if (user?.firstName) {
      return user.firstName.charAt(0)
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase()
    }
    return '?'
  }

  const getAltText = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    if (user?.firstName) {
      return user.firstName
    }
    if (user?.email) {
      return user.email
    }
    return 'User avatar'
  }

  const getAvatarUrl = () => {
    if (user?.avatarUrl) {
      // If the URL already includes http/https, use it as is
      if (user.avatarUrl.startsWith('http://') || user.avatarUrl.startsWith('https://')) {
        return user.avatarUrl
      }
      // Use the frontend's API proxy which now handles both API and static files
      // The proxy will strip /api for static files and keep it for API endpoints
      const avatarPath = user.avatarUrl.startsWith('/') ? user.avatarUrl : `/${user.avatarUrl}`
      const fullUrl = `/api${avatarPath}`
      console.log('Avatar URL constructed (via smart proxy):', fullUrl) // Debug log
      return fullUrl
    }
    return null
  }

  const avatarUrl = getAvatarUrl()

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={getAltText()}
        className={`${sizeClass} rounded-full object-cover ${borderClass} ${className}`}
        onError={(e) => {
          console.error('Avatar image failed to load:', avatarUrl)
          // Hide the image element if it fails to load
          e.currentTarget.style.display = 'none'
        }}
        onLoad={() => {
          console.log('Avatar image loaded successfully:', avatarUrl)
        }}
      />
    )
  }

  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center ${borderClass} ${className}`}>
      <span className={`text-white ${textSizeClass} font-semibold`}>
        {getInitials()}
      </span>
    </div>
  )
}