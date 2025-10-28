'use client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface Unauthorized401Props {
  message?: string
  redirectPath?: string
}

export function Unauthorized401({ 
  message = "You've found a unicorn! But this area requires special permissions.", 
  redirectPath = "/login" 
}: Unauthorized401Props) {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push(redirectPath)
    }, 5000)

    return () => clearTimeout(timer)
  }, [router, redirectPath])

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Unicorn */}
        <div className="mx-auto w-24 h-24 icon-accent rounded-full flex items-center justify-center shadow-2xl animate-pulse">
          <div className="text-4xl">🦄</div>
        </div>

        {/* Error */}
        <div>
          <h1 className="text-6xl font-bold text-primary">
            401
          </h1>
          <h2 className="text-xl font-bold text-white mt-2">
            Unicorn Alert! 🦄
          </h2>
        </div>

        {/* Message */}
        <p className="text-gray-300 leading-relaxed">
          {message}
        </p>

        {/* Redirect Notice */}
        <div className="bg-dark-elevated1 rounded-lg border border-gray-700 p-4">
          <p className="text-gray-400 text-sm">
            ✨ Redirecting to login in 5 seconds...
          </p>
        </div>

        {/* Quick Action */}
        <button
          onClick={() => router.push(redirectPath)}
          className="w-full px-6 py-3 btn-primary rounded-lg transition-all duration-200 shadow-lg"
        >
          🔐 Get Magic Access Now
        </button>
      </div>
    </div>
  )
}