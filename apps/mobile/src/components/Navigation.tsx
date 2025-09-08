import React from 'react'
import Link from 'next/link'
import { Avatar } from './Avatar'

interface BottomNavProps {
  currentPath?: string
}

const navigation = [
  { name: 'Workouts', href: '/workouts', icon: '💪', ariaLabel: 'Workouts' },
  { name: 'Analytics', href: '/analytics', icon: '📊', ariaLabel: 'Analytics' },
  { name: 'Profile', href: '/profile', icon: '👤', ariaLabel: 'Profile' },
]

export function BottomNavigation({ currentPath }: BottomNavProps) {
  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-bottom"
      role="navigation"
      aria-label="Bottom navigation"
    >
      <div className="flex justify-around items-center px-4">
        {navigation.map((item) => {
          const isActive = currentPath === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`nav-item flex-col ${
                isActive 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              aria-label={item.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-xl mb-1" aria-hidden="true">
                {item.icon}
              </span>
              <span className="text-xs font-medium">
                {item.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

interface HeaderProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  actions?: React.ReactNode
  showUserAvatar?: boolean
  user?: {
    firstName?: string
    lastName?: string
    email?: string
    avatarUrl?: string
  }
}

export function Header({ title, showBack = false, onBack, actions, showUserAvatar = false, user }: HeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          {showBack && (
            <button
              onClick={onBack}
              className="nav-item mr-2 -ml-2"
              aria-label="Go back"
            >
              <span aria-hidden="true">←</span>
            </button>
          )}
          <h1 className="text-heading font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
        </div>
        
        <div className="flex items-center space-x-3">
          {showUserAvatar && user && (
            <div className="flex items-center space-x-2">
              <Avatar user={user} size="sm" />
            </div>
          )}
          {actions && (
            <div className="flex items-center space-x-2">
              {actions}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}