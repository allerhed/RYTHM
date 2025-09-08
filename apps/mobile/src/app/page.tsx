import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 safe-area-top">
      <div className="px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-primary-900 mb-2">RYTHM</h1>
          <p className="text-lg text-gray-600">Hybrid Training Made Simple</p>
        </div>

        {/* Feature Cards */}
        <div className="space-y-6 mb-12">
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-strength-500 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white font-bold text-xl">💪</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Strength Training</h3>
                <p className="text-gray-600">Track weights, sets, and PRs</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-cardio-500 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white font-bold text-xl">🏃</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cardio Training</h3>
                <p className="text-gray-600">Monitor distance, pace, and endurance</p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-hybrid-500 rounded-lg flex items-center justify-center mr-4">
                <span className="text-white font-bold text-xl">⚡</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Hybrid Workouts</h3>
                <p className="text-gray-600">CrossFit, Hyrox, and mixed training</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4">
          <Link href="/auth/login" className="block">
            <button className="btn-primary w-full">
              Sign In
            </button>
          </Link>
          
          <Link href="/auth/register" className="block">
            <button className="btn-secondary w-full">
              Create Account
            </button>
          </Link>
        </div>

        {/* App Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-500">
            Multi-tenant training platform with offline support
          </p>
        </div>
      </div>
    </div>
  )
}