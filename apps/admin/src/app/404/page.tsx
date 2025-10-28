'use client'
import Link from 'next/link'

export default function NotFound404Page() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Unicorn Illustration */}
        <div className="relative">
          <div className="mx-auto w-32 h-32 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-2xl">
            <div className="text-6xl">🦄</div>
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <span className="text-lg">✨</span>
          </div>
          <div className="absolute -bottom-1 -left-3 w-6 h-6 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <span className="text-sm">⭐</span>
          </div>
        </div>

        {/* Error Code */}
        <div>
          <h1 className="text-8xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-2xl font-bold text-white mt-4">
            Oops! You Found a Unicorn! 🦄
          </h2>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <p className="text-gray-300 text-lg leading-relaxed">
            Congratulations! You've discovered something as rare as a unicorn... 
            a page that doesn't exist!
          </p>
          <p className="text-gray-400">
            The unicorns must have moved this page to their secret magical realm. 
            Don't worry, we'll help you find your way back to safety!
          </p>
        </div>

        {/* Fun Stats */}
        <div className="bg-gradient-to-b from-[#1a1a1a] to-[#232323] rounded-2xl border border-gray-700 p-6 space-y-4">
          <h3 className="text-white font-semibold">🎉 Lost Page Discovery Stats</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400">404</div>
              <div className="text-gray-400">Error Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-400">🌈</div>
              <div className="text-gray-400">Magic Points</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link 
            href="/dashboard"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span className="mr-2">🏠</span>
            Return to Dashboard
          </Link>
          
          <Link 
            href="/"
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-gradient-to-b from-[#1a1a1a] to-[#232323] text-gray-300 font-semibold rounded-lg hover:bg-gray-700 hover:text-white transition-all duration-200 border border-gray-700"
          >
            <span className="mr-2">🔙</span>
            Go Back
          </Link>
        </div>

        {/* Fun Footer */}
        <div className="pt-8 border-t border-gray-700">
          <p className="text-gray-500 text-sm">
            💡 <strong>Pro Tip:</strong> Unicorns are excellent at hiding pages! 
            Try using the navigation menu or search for what you're looking for.
          </p>
        </div>
      </div>

      {/* Floating Magic Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 text-2xl animate-bounce" style={{ animationDelay: '0s' }}>✨</div>
        <div className="absolute top-32 right-20 text-xl animate-bounce" style={{ animationDelay: '1s' }}>🌟</div>
        <div className="absolute bottom-40 left-20 text-lg animate-bounce" style={{ animationDelay: '2s' }}>⭐</div>
        <div className="absolute bottom-60 right-10 text-2xl animate-bounce" style={{ animationDelay: '1.5s' }}>💫</div>
        <div className="absolute top-1/2 left-5 text-sm animate-bounce" style={{ animationDelay: '0.5s' }}>🦄</div>
        <div className="absolute top-1/3 right-5 text-lg animate-bounce" style={{ animationDelay: '2.5s' }}>🌈</div>
      </div>
    </div>
  )
}