'use client'
import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Form'

export default function TestAuthPage() {
  const { user, isAuthenticated, fetchProfile } = useAuth()
  const [debugInfo, setDebugInfo] = useState('')

  const handleFetchProfile = async () => {
    try {
      await fetchProfile()
      setDebugInfo('Profile fetched successfully')
    } catch (error: any) {
      setDebugInfo(`Profile fetch error: ${error.message}`)
    }
  }

  const testAvatarUrl = () => {
    if (user?.avatarUrl) {
      const constructedUrl = user.avatarUrl.startsWith('http') 
        ? user.avatarUrl 
        : `/api${user.avatarUrl.startsWith('/') ? user.avatarUrl : '/' + user.avatarUrl}`
      
      setDebugInfo(`
        User object: ${JSON.stringify(user, null, 2)}
        Avatar URL from user: ${user.avatarUrl}
        Constructed URL (via smart proxy): ${constructedUrl}
      `)
    } else {
      setDebugInfo('No avatar URL found in user object')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Not Authenticated</h1>
          <p>Please log in to test avatar functionality</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-primary p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Avatar Debug Page</h1>
        
        <div className="bg-dark-card rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Current Avatar</h2>
          <div className="flex items-center space-x-4 mb-4">
            <Avatar user={user || undefined} size="xl" />
            <div>
              <p className="font-medium">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-text-secondary">{user?.email}</p>
            </div>
          </div>
        </div>

        <div className="bg-dark-card rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Actions</h2>
          <div className="space-y-2">
            <Button onClick={handleFetchProfile} variant="primary" size="sm">
              Fetch Fresh Profile
            </Button>
            <Button onClick={testAvatarUrl} variant="outline" size="sm">
              Debug Avatar URL
            </Button>
          </div>
        </div>

        {debugInfo && (
          <div className="bg-dark-elevated rounded-lg p-4">
            <h3 className="font-semibold mb-2">Debug Info:</h3>
            <pre className="text-sm whitespace-pre-wrap">{debugInfo}</pre>
          </div>
        )}
      </div>
    </div>
  )
}