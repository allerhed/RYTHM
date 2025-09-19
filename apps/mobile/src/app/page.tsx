import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
      {/* Hero Section */}
      <div className="safe-area-top safe-area-bottom px-6">
        {/* Header */}
        <header className="text-center pt-12 pb-8">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
              <span className="text-3xl font-bold text-white">R</span>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            RYTHM
          </h1>
          <p className="text-xl text-gray-700 dark:text-gray-300 mb-2 font-medium">
            Your Complete Training Companion
          </p>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
            Transform your fitness journey with intelligent tracking, personalized workouts, and powerful analytics
          </p>
        </header>

        {/* Value Propositions */}
        <section className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Strength Training */}
            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50">
              <div className="w-14 h-14 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl" aria-hidden="true">💪</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                Strength Training
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Track every rep, set, and PR with precision. Build strength systematically with intelligent progression tracking.
              </p>
            </div>

            {/* Cardio Excellence */}
            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50">
              <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl" aria-hidden="true">🏃</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                Cardio Excellence
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Monitor pace, distance, and endurance gains. From zone training to HIIT, optimize every heartbeat.
              </p>
            </div>

            {/* Hybrid Performance */}
            <div className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50">
              <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl" aria-hidden="true">⚡</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                Hybrid Performance
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                Master CrossFit, Hyrox, and functional fitness. Train like an athlete with data-driven insights.
              </p>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="mb-12">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-auto border border-gray-200/50 dark:border-gray-700/50">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
              Why Athletes Choose RYTHM
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-400">📊</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Real-time Analytics</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 dark:text-green-400">🎯</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Smart Goal Setting</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-600 dark:text-purple-400">🎯</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Progress Tracking</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-orange-600 dark:text-orange-400">📈</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Performance Insights</span>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="max-w-md mx-auto">
          <div className="space-y-4 mb-8">
            <Link href="/auth/register" className="block">
              <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <span className="text-lg">Start Your Journey</span>
                <p className="text-sm opacity-90 mt-1">Free to get started</p>
              </button>
            </Link>
            
            <Link href="/auth/login" className="block">
              <button className="w-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold py-3 px-8 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300">
                <span>Welcome Back</span>
              </button>
            </Link>
          </div>

          {/* Social Proof */}
          <div className="text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              Trusted by athletes worldwide
            </p>
            <div className="flex justify-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-yellow-400 text-sm">★</span>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center pb-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Professional training platform • Multi-tenant • Enterprise ready
          </p>
        </footer>
      </div>
    </div>
  )
}