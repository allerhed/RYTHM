'use client'
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AutoLoginPage() {
  const [status, setStatus] = useState<{ message: string; type: string } | null>(null)
  const router = useRouter()

  const showStatus = (message: string, type: string = 'info') => {
    setStatus({ message, type })
  }

  const autoLogin = async (email: string, password: string) => {
    showStatus('🔄 Logging in...', 'info')
    
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      
      if (response.ok) {
        // Store in localStorage
        localStorage.setItem('admin_token', data.token)
        localStorage.setItem('admin_user', JSON.stringify(data.user))
        
        showStatus(`✅ Successfully logged in as ${data.user.name}! Redirecting to templates...`, 'success')
        
        setTimeout(() => {
          router.push('/templates')
        }, 1500)
      } else {
        showStatus(`❌ Login failed: ${data.error}`, 'error')
      }
    } catch (error) {
      showStatus(`❌ Network error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error')
    }
  }

  const goToTemplates = () => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      showStatus('⚠️ Please login first!', 'error')
      return
    }
    router.push('/templates')
  }

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    const user = localStorage.getItem('admin_user')
    
    if (token && user) {
      try {
        const userData = JSON.parse(user)
        showStatus(`ℹ️ Already logged in as ${userData.name}. Click "Go to Templates" to view the admin interface.`, 'info')
      } catch (e) {
        showStatus('⚠️ Invalid stored user data. Please login again.', 'error')
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_user')
      }
    }
  }, [])

  const getStatusClass = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800 border border-green-200'
      case 'error': return 'bg-red-100 text-red-800 border border-red-200'
      default: return 'bg-blue-100 text-blue-800 border border-blue-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          🎯 RYTHM Admin Auto-Login
        </h1>
        
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="font-semibold text-gray-700 mb-3">Available Admin Credentials:</p>
          
          <div className="space-y-2">
            <div className="p-3 bg-white rounded border">
              <div className="font-mono text-sm">
                📧 <strong>orchestrator@rythm.app</strong><br />
                🔑 Password123
              </div>
            </div>
            
            <div className="p-3 bg-white rounded border">
              <div className="font-mono text-sm">
                📧 <strong>admin@rythm.app</strong><br />
                🔑 admin123
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => autoLogin('orchestrator@rythm.app', 'Password123')}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            🚀 Login as Orchestrator
          </button>
          
          <button
            onClick={() => autoLogin('admin@rythm.app', 'admin123')}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            🔧 Login as Admin
          </button>

          <button
            onClick={goToTemplates}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors"
          >
            📋 Go to Templates Page
          </button>
        </div>

        {status && (
          <div className={`mt-4 p-3 rounded-lg ${getStatusClass(status.type)}`}>
            {status.message}
          </div>
        )}
      </div>
    </div>
  )
}