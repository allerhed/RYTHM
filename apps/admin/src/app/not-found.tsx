'use client'
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Unicorn Illustration */}
        <div className="relative">
          <div className="mx-auto w-40 h-40 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
            <div className="text-7xl">🦄</div>
          </div>
          <div className="absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <span className="text-2xl">✨</span>
          </div>
          <div className="absolute -bottom-2 -left-4 w-8 h-8 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse" style={{ animationDelay: '1s' }}>
            <span className="text-lg">⭐</span>
          </div>
        </div>

        {/* Error Code */}
        <div className="space-y-2">
          <h1 className="text-9xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
            404
          </h1>
          <h2 className="text-3xl font-bold text-white">
            🦄 Unicorn Discovery! 🦄
          </h2>
          <h3 className="text-xl text-gray-300">
            Page Not Found in This Realm
          </h3>
        </div>

        {/* Error Message */}
        <div className="space-y-4">
          <p className="text-gray-300 text-lg leading-relaxed">
            🎉 <strong>Congratulations!</strong> You've stumbled upon something as rare as a unicorn... 
            a page that has galloped away to the magical digital realm!
          </p>
          <p className="text-gray-400">
            Our unicorns are notorious for moving pages around when they get bored. 
            Don't worry though, we'll help you find your way back to the known universe!
          </p>
        </div>

        {/* Fun Discovery Stats */}
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <span className="text-2xl">🏆</span>
            <h3 className="text-white font-semibold">Rare Discovery Achievement</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400">404</div>
              <div className="text-gray-400">Error Code</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">∞</div>
              <div className="text-gray-400">Rarity Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-400">🌈</div>
              <div className="text-gray-400">Magic Points</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link 
            href="/dashboard"
            className="w-full inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <span className="mr-3 text-xl">🏠</span>
            Return to Dashboard
          </Link>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-800 text-gray-300 font-semibold rounded-lg hover:bg-gray-700 hover:text-white transition-all duration-200 border border-gray-700"
            >
              <span className="mr-2">🔙</span>
              Go Back
            </button>
            
            <Link 
              href="/users"
              className="inline-flex items-center justify-center px-6 py-3 bg-gray-800 text-gray-300 font-semibold rounded-lg hover:bg-gray-700 hover:text-white transition-all duration-200 border border-gray-700"
            >
              <span className="mr-2">👥</span>
              Users
            </Link>
          </div>
        </div>

        {/* Fun Footer */}
        <div className="pt-8 border-t border-gray-700">
          <p className="text-gray-500 text-sm leading-relaxed">
            💡 <strong>Unicorn Wisdom:</strong> Sometimes the best discoveries happen when you're lost! 
            But if you need to find something specific, try using our navigation menu above.
          </p>
        </div>
      </div>

      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 text-3xl animate-bounce" style={{ animationDelay: '0s' }}>✨</div>
        <div className="absolute top-40 right-20 text-2xl animate-bounce" style={{ animationDelay: '1s' }}>🌟</div>
        <div className="absolute bottom-60 left-20 text-xl animate-bounce" style={{ animationDelay: '2s' }}>⭐</div>
        <div className="absolute bottom-40 right-10 text-3xl animate-bounce" style={{ animationDelay: '1.5s' }}>💫</div>
        <div className="absolute top-1/2 left-5 text-lg animate-bounce" style={{ animationDelay: '0.5s' }}>🦄</div>
        <div className="absolute top-1/3 right-5 text-2xl animate-bounce" style={{ animationDelay: '2.5s' }}>🌈</div>
        <div className="absolute bottom-1/3 left-1/4 text-sm animate-bounce" style={{ animationDelay: '3s' }}>💎</div>
        <div className="absolute top-3/4 right-1/3 text-lg animate-bounce" style={{ animationDelay: '0.8s' }}>✨</div>
      </div>
    </div>
  )
}