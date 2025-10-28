'use client'
import { useState } from 'react'
import { withAuth } from '@/contexts/AuthContext'
import { AdminLayout } from '@/components/AdminLayout'

function SettingsPage() {
  const [notifications, setNotifications] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [autoSave, setAutoSave] = useState(true)

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Settings
          </h1>
          <p className="mt-2 text-gray-400">
            Manage your admin preferences and system configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Account Settings */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-dark-border p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Account Settings
              </h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      defaultValue="Admin Orchestrator"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      defaultValue="orchestrator@rythm.app"
                      className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role
                  </label>
                  <select className="dropdown-fix w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                    <option>Super Admin</option>
                    <option>Organization Admin</option>
                    <option>Tenant Admin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-dark-border p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                </svg>
                Notification Preferences
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Push Notifications</h3>
                    <p className="text-gray-400 text-sm">Receive real-time alerts for system events</p>
                  </div>
                  <button
                    onClick={() => setNotifications(!notifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${notifications ? 'bg-orange-600' : 'bg-gray-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-dark-primary transition-transform duration-200 ${notifications ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Email Alerts</h3>
                    <p className="text-gray-400 text-sm">Get notified via email for critical issues</p>
                  </div>
                  <button
                    onClick={() => setEmailAlerts(!emailAlerts)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${emailAlerts ? 'bg-orange-600' : 'bg-gray-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-dark-primary transition-transform duration-200 ${emailAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Auto Save</h3>
                    <p className="text-gray-400 text-sm">Automatically save changes as you work</p>
                  </div>
                  <button
                    onClick={() => setAutoSave(!autoSave)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${autoSave ? 'bg-orange-600' : 'bg-gray-600'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-dark-primary transition-transform duration-200 ${autoSave ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-dark-border p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Security
              </h2>
              
              <div className="space-y-4">
                <button className="w-full px-4 py-3 btn-primary/outline rounded-lg text-left">
                  Change Password
                </button>
                <button className="w-full px-4 py-3 btn-secondary rounded-lg text-left">
                  Enable Two-Factor Authentication
                </button>
                <button className="w-full px-4 py-3 btn-secondary rounded-lg text-left">
                  View Active Sessions
                </button>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-dark-border p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m14-6h2m-2 6h2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                System Information
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Version</span>
                  <span className="text-white font-semibold">v2.1.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Environment</span>
                  <span className="badge-primary">Production</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Uptime</span>
                  <span className="text-white font-semibold">99.9%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Last Backup</span>
                  <span className="text-white font-semibold">2 hours ago</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-dark-elevated1 shadow-xl border border-dark-border p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.864-.833-2.634 0L4.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Danger Zone
              </h2>
              
              <div className="space-y-4">
                <button className="w-full px-4 py-3 btn-danger rounded-lg text-left">
                  Export All Data
                </button>
                <button className="w-full px-4 py-3 btn-danger rounded-lg text-left">
                  Reset All Settings
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="btn-primary px-8 py-3 font-semibold">
            Save Changes
          </button>
        </div>
      </div>
    </AdminLayout>
  )
}

export default withAuth(SettingsPage)