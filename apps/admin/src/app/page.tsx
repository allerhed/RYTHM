'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AuthProvider } from '@/contexts/AuthContext'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to dashboard by default
    router.push('/dashboard')
  }, [router])

  return (
    <AuthProvider>
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    </AuthProvider>
  )
}