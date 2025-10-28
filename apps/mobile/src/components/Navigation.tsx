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
      className="fixed bottom-0 left-0 right-0 bg-dark-secondary border-t border-dark-border safe-area-bottom z-50"
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
              className={`nav-item flex-col transition-colors ${
                isActive 
                  ? 'text-orange-primary' 
                  : 'text-text-secondary hover:text-text-primary'
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
    <header className="bg-dark-secondary border-b border-dark-border safe-area-top">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          {showBack && (
            <button
              onClick={onBack}
              className="nav-item mr-2 -ml-2 text-orange-primary hover:bg-dark-card"
              aria-label="Go back"
            >
              <span aria-hidden="true">←</span>
            </button>
          )}
          <h1 className="text-xl font-bold text-text-primary">
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