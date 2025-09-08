import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-900 dark:to-gray-800">
      {/* Safe area container */}
      <div className="safe-area-top safe-area-bottom px-4">
        {/* Header */}
        <header className="text-center py-8">
          <h1 className="text-title font-bold text-primary-900 dark:text-primary-100 mb-2">
            RYTHM
          </h1>
          <p className="text-body-large text-gray-700 dark:text-gray-300">
            Hybrid Training Made Simple
          </p>
        </header>

        {/* Primary Navigation - Following guideline for 3-5 destinations */}
        <nav className="mb-8" role="navigation" aria-label="Main navigation">
          <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
            {/* Strength Training Card */}
            <div className="card card-interactive" tabIndex={0} role="button">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-strength-500 rounded-mobile flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-white text-xl" aria-hidden="true">💪</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-heading font-semibold text-gray-900 dark:text-gray-100">
                    Strength Training
                  </h3>
                  <p className="text-caption text-gray-600 dark:text-gray-400">
                    Track weights, sets, and PRs
                  </p>
                </div>
              </div>
            </div>

            {/* Cardio Training Card */}
            <div className="card card-interactive" tabIndex={0} role="button">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-cardio-500 rounded-mobile flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-white text-xl" aria-hidden="true">🏃</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-heading font-semibold text-gray-900 dark:text-gray-100">
                    Cardio Training
                  </h3>
                  <p className="text-caption text-gray-600 dark:text-gray-400">
                    Monitor distance, pace, and endurance
                  </p>
                </div>
              </div>
            </div>

            {/* Hybrid Workouts Card */}
            <div className="card card-interactive" tabIndex={0} role="button">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-hybrid-500 rounded-mobile flex items-center justify-center mr-4 flex-shrink-0">
                  <span className="text-white text-xl" aria-hidden="true">⚡</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-heading font-semibold text-gray-900 dark:text-gray-100">
                    Hybrid Workouts
                  </h3>
                  <p className="text-caption text-gray-600 dark:text-gray-400">
                    CrossFit, Hyrox, and mixed training
                  </p>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Authentication Actions */}
        <section className="max-w-md mx-auto space-y-4" aria-label="Authentication">
          <Link href="/auth/login" className="block">
            <button className="btn btn-primary w-full" type="button">
              <span>Sign In</span>
            </button>
          </Link>
          
          <Link href="/auth/register" className="block">
            <button className="btn btn-secondary w-full" type="button">
              <span>Create Account</span>
            </button>
          </Link>
        </section>

        {/* App Information */}
        <footer className="mt-12 text-center">
          <p className="text-caption text-gray-500 dark:text-gray-400">
            Multi-tenant training platform with offline support
          </p>
        </footer>
      </div>
    </div>
  )
}