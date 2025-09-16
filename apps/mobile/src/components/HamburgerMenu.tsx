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
  PlusCircleIcon
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
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-40 p-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label="Open navigation menu"
      >
        <Bars3Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>

      {/* Full-screen Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
          
          {/* Navigation Panel */}
          <div className="absolute top-0 right-0 h-full w-full max-w-sm bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Navigation
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close navigation menu"
                >
                  <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* User Profile Section */}
              {user && (
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-4">
                    <Avatar user={user} size="lg" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                      {user.about && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">
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
                      className="w-full flex items-center px-4 py-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                    >
                      <Icon className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                      <div className="ml-4 flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.name}
                        </div>
                        {item.description && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </nav>

              {/* Footer Actions */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-left rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors group"
                >
                  <ArrowRightOnRectangleIcon className="w-6 h-6 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors" />
                  <span className="ml-4 text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
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