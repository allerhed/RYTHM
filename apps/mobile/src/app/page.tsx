import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      <div className="flex-1 flex flex-col justify-between px-6 py-8 safe-area-top safe-area-bottom">
        
        {/* Logo & Title Section */}
        <div className="text-center pt-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl mb-6 shadow-xl">
            <span className="text-4xl font-bold text-white">R</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            RYTHM
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 font-medium">
            Your Training Companion
          </p>
        </div>

        {/* Training Types - Compact Grid */}
        <div className="grid grid-cols-3 gap-3 px-2">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="text-3xl mb-2">💪</div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Strength</p>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="text-3xl mb-2">🏃</div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Cardio</p>
          </div>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-lg border border-gray-200/50 dark:border-gray-700/50">
            <div className="text-3xl mb-2">⚡</div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Hybrid</p>
          </div>
        </div>

        {/* Key Features - Simplified */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 border border-gray-200/30 dark:border-gray-700/30">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">📊</span>
            </div>
            <span className="text-gray-800 dark:text-gray-200 font-medium">Track every rep & run</span>
          </div>
          <div className="flex items-center space-x-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 border border-gray-200/30 dark:border-gray-700/30">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">📈</span>
            </div>
            <span className="text-gray-800 dark:text-gray-200 font-medium">Visualize progress</span>
          </div>
          <div className="flex items-center space-x-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-3 border border-gray-200/30 dark:border-gray-700/30">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🎯</span>
            </div>
            <span className="text-gray-800 dark:text-gray-200 font-medium">Achieve your goals</span>
          </div>
        </div>

        {/* Call to Action Buttons */}
        <div className="space-y-3 pb-4">
          <Link href="/auth/register" className="block">
            <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg active:scale-95 transition-all duration-200">
              Start Training
            </button>
          </Link>
          
          <Link href="/auth/login" className="block">
            <button className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm text-gray-900 dark:text-gray-100 font-semibold py-4 px-8 rounded-2xl border-2 border-gray-300 dark:border-gray-600 active:scale-95 transition-all duration-200">
              Sign In
            </button>
          </Link>
        </div>

      </div>
    </div>
  )
}