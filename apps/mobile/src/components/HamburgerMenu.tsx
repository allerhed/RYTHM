'use client'
import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from './Avatar'
import {
  HomeIcon,
  ChartBarIcon,
  ClockIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  Bars3Icon,
  CalendarIcon,
  ClipboardDocumentIcon,
  PlusCircleIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  description?: string
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    description: 'Your workout overview'
  },
  {
    name: 'New Workout',
    href: '/training/new',
    icon: PlusCircleIcon,
    description: 'Start a new workout session'
  },
  {
    name: 'Calendar',
    href: '/calendar',
    icon: CalendarIcon,
    description: 'Training calendar and schedule'
  },
  {
    name: "Personal Records - PR's",
    href: '/prs',
    icon: TrophyIcon,
    description: 'Track your personal records'
  },
  {
    name: 'Templates',
    href: '/templates',
    icon: ClipboardDocumentIcon,
    description: 'Workout templates and routines'
  },
  {
    name: 'History',
    href: '/history',
    icon: ClockIcon,
    description: 'Past workouts and progress'
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: ChartBarIcon,
    description: 'Performance insights'
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: UserIcon,
    description: 'Account settings and info'
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Cog6ToothIcon,
    description: 'App preferences'
  }
]

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()

  // Don't show hamburger menu on auth pages or when user is not logged in
  const isAuthPage = pathname.startsWith('/auth') || pathname === '/'
  
  if (!user || isAuthPage) {
    return null
  }

  const handleNavigation = (href: string) => {
    setIsOpen(false)
    router.push(href)
  }

  const handleLogout = async () => {
    try {
      await logout()
      setIsOpen(false)
      router.push('/auth/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      {/* Inline Hamburger Button (attached to header via layout) */}
      <button
        onClick={() => setIsOpen(true)}
        className="ml-auto p-2 rounded-lg bg-dark-elevated1 border border-dark-border hover:border-orange-primary/40 focus:outline-none focus:ring-2 focus:ring-orange-primary transition-colors"
        aria-label="Open navigation menu"
      >
        <Bars3Icon className="w-6 h-6 text-orange-primary" />
      </button>

      {/* Full-screen Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
          
          {/* Navigation Panel */}
          <div className="absolute top-0 right-0 h-full w-full max-w-sm bg-dark-primary shadow-2xl transform transition-transform duration-300 ease-in-out pt-[env(safe-area-inset-top)] safe-area-top">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-orange-primary/30">
                <h2 className="text-xl font-semibold text-text-primary">
                  Navigation
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-dark-elevated1 transition-colors"
                  aria-label="Close navigation menu"
                >
                  <XMarkIcon className="w-6 h-6 text-orange-primary" />
                </button>
              </div>

              {/* User Profile Section */}
              {user && (
                <div className="p-6 border-b border-orange-primary/30">
                  <div className="flex items-center space-x-4">
                    <Avatar user={user} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-text-primary truncate">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-text-secondary truncate">
                        {user.email}
                      </p>
                      {user.about && (
                        <p className="text-xs text-text-tertiary mt-1 line-clamp-2">
                          {user.about}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.name}
                      onClick={() => handleNavigation(item.href)}
                      className="w-full flex items-center px-4 py-3 text-left rounded-lg hover:bg-dark-elevated1 transition-colors group"
                    >
                      <Icon className="w-6 h-6 text-orange-primary transition-colors" />
                      <div className="ml-4 flex-1">
                        <div className="text-sm font-medium text-text-primary group-hover:text-orange-primary transition-colors">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-xs text-text-tertiary mt-1">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </nav>

              {/* Footer Actions */}
              <div className="p-4 border-t border-orange-primary/30">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-left rounded-lg hover:bg-error-soft transition-colors group"
                >
                  <ArrowRightOnRectangleIcon className="w-6 h-6 text-text-secondary group-hover:text-error transition-colors" />
                  <span className="ml-4 text-sm font-medium text-text-primary group-hover:text-error transition-colors">
                    Sign Out
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}