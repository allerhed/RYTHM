'use client'
import React, { useState } from 'react'
import { useAuth, withAuth } from '@/contexts/AuthContext'
import { HamburgerMenu } from '../../components/HamburgerMenu'
import { 
  MoonIcon, 
  SunIcon, 
  BellIcon, 
  UserIcon, 
  ShieldCheckIcon, 
  QuestionMarkCircleIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

interface SettingItem {
  id: string
  title: string
  description: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  type: 'toggle' | 'select' | 'action'
  value?: boolean | string
  options?: { value: string; label: string }[]
  action?: () => void
}

function SettingsPage() {
  const { user } = useAuth()
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [language, setLanguage] = useState('en')
  const [units, setUnits] = useState('metric')

  // Check current theme from localStorage or system preference
  React.useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark') || 
                   window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(isDark)
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode
    setDarkMode(newDarkMode)
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const settingSections = [
    {
      title: 'Appearance',
      items: [
        {
          id: 'dark-mode',
          title: 'Dark Mode',
          description: 'Switch between light and dark theme',
          icon: darkMode ? MoonIcon : SunIcon,
          type: 'toggle' as const,
          value: darkMode,
          action: toggleDarkMode
        }
      ]
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'push-notifications',
          title: 'Push Notifications',
          description: 'Receive workout reminders and updates',
          icon: BellIcon,
          type: 'toggle' as const,
          value: notifications,
          action: () => setNotifications(!notifications)
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'language',
          title: 'Language',
          description: 'Choose your preferred language',
          icon: GlobeAltIcon,
          type: 'select' as const,
          value: language,
          options: [
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Español' },
            { value: 'fr', label: 'Français' },
            { value: 'de', label: 'Deutsch' }
          ]
        },
        {
          id: 'units',
          title: 'Units',
          description: 'Weight and measurement units',
          icon: DevicePhoneMobileIcon,
          type: 'select' as const,
          value: units,
          options: [
            { value: 'metric', label: 'Metric (kg, cm)' },
            { value: 'imperial', label: 'Imperial (lbs, in)' }
          ]
        }
      ]
    },
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          title: 'Edit Profile',
          description: 'Update your personal information',
          icon: UserIcon,
          type: 'action' as const,
          action: () => {
            // Navigate to profile page
            window.location.href = '/profile'
          }
        },
        {
          id: 'privacy',
          title: 'Privacy & Security',
          description: 'Manage your privacy settings',
          icon: ShieldCheckIcon,
          type: 'action' as const,
          action: () => {
            // Handle privacy settings
            alert('Privacy settings coming soon!')
          }
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help & Support',
          description: 'Get help with using RYTHM',
          icon: QuestionMarkCircleIcon,
          type: 'action' as const,
          action: () => {
            // Handle help
            alert('Help documentation coming soon!')
          }
        }
      ]
    }
  ]

  const renderSettingItem = (item: SettingItem) => {
    const Icon = item.icon

    return (
      <div
        key={item.id}
        className="flex items-center justify-between p-4 bg-dark-elevated1 rounded-lg border border-dark-border"
      >
        <div className="flex items-center space-x-4 flex-1">
          <div className="p-2 bg-dark-elevated rounded-lg">
            <Icon className="w-5 h-5 text-text-secondary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-text-primary">
              {item.title}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {item.description}
            </p>
          </div>
        </div>

        <div className="flex-shrink-0">
          {item.type === 'toggle' && (
            <button
              onClick={item.action}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-primary focus:ring-offset-2 ${
                item.value ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  item.value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          )}

          {item.type === 'select' && item.options && (
            <select
              value={item.value as string}
              onChange={(e) => {
                if (item.id === 'language') setLanguage(e.target.value)
                if (item.id === 'units') setUnits(e.target.value)
              }}
              className="text-sm border border-dark-border rounded-md px-3 py-1 bg-dark-input text-text-primary focus:outline-none focus:ring-2 focus:ring-orange-primary"
            >
              {item.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {item.type === 'action' && (
            <button
              onClick={item.action}
              className="text-orange-primary hover:text-orange-hover dark:hover:text-blue-300 text-sm font-medium"
            >
              →
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">
            Please log in to access settings
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary pb-20">
      {/* Compact Header */}
      <div className="pt-[env(safe-area-inset-top)] px-4 py-2 flex items-center justify-between">
        <h1 className="text-base font-semibold text-text-primary">Settings</h1>
        <HamburgerMenu />
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {settingSections.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-semibold text-text-primary mb-4">
                {section.title}
              </h2>
              <div className="space-y-3">
                {section.items.map(renderSettingItem)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default withAuth(SettingsPage)