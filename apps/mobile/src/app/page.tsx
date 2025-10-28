import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="h-screen flex flex-col bg-dark-primary">
      <div className="flex-1 flex flex-col justify-between px-6 py-8 safe-area-top safe-area-bottom">
        
        {/* Logo & Title Section */}
        <div className="text-center pt-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-orange-primary to-orange-hover rounded-3xl mb-6 shadow-glow-orange">
            <span className="text-4xl font-bold text-white">R</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-primary to-orange-hover bg-clip-text text-transparent mb-3">
            RYTHM
          </h1>
          <p className="text-xl text-text-secondary font-medium">
            Your Training Companion
          </p>
        </div>

        {/* Training Types - Compact Grid */}
        <div className="grid grid-cols-3 gap-3 px-2">
          <div className="bg-dark-card backdrop-blur-sm rounded-2xl p-4 text-center shadow-card border border-dark-border hover:border-orange-primary/30 transition-colors">
            <div className="text-3xl mb-2">💪</div>
            <p className="text-sm font-semibold text-text-primary">Strength</p>
          </div>
          <div className="bg-dark-card backdrop-blur-sm rounded-2xl p-4 text-center shadow-card border border-dark-border hover:border-orange-primary/30 transition-colors">
            <div className="text-3xl mb-2">🏃</div>
            <p className="text-sm font-semibold text-text-primary">Cardio</p>
          </div>
          <div className="bg-dark-card backdrop-blur-sm rounded-2xl p-4 text-center shadow-card border border-dark-border hover:border-orange-primary/30 transition-colors">
            <div className="text-3xl mb-2">⚡</div>
            <p className="text-sm font-semibold text-text-primary">Hybrid</p>
          </div>
        </div>

        {/* Key Features - Simplified */}
        <div className="space-y-3">
          <div className="flex items-center space-x-3 bg-dark-card backdrop-blur-sm rounded-xl p-3 border border-dark-border">
            <div className="w-10 h-10 bg-dark-elevated rounded-lg flex items-center justify-center flex-shrink-0 border border-orange-primary/30">
              <span className="text-xl">📊</span>
            </div>
            <span className="text-text-primary font-medium">Track every rep & run</span>
          </div>
          <div className="flex items-center space-x-3 bg-dark-card backdrop-blur-sm rounded-xl p-3 border border-dark-border">
            <div className="w-10 h-10 bg-dark-elevated rounded-lg flex items-center justify-center flex-shrink-0 border border-orange-primary/30">
              <span className="text-xl">📈</span>
            </div>
            <span className="text-text-primary font-medium">Visualize progress</span>
          </div>
          <div className="flex items-center space-x-3 bg-dark-card backdrop-blur-sm rounded-xl p-3 border border-dark-border">
            <div className="w-10 h-10 bg-dark-elevated rounded-lg flex items-center justify-center flex-shrink-0 border border-orange-primary/30">
              <span className="text-xl">🎯</span>
            </div>
            <span className="text-text-primary font-medium">Achieve your goals</span>
          </div>
        </div>

        {/* Call to Action Buttons */}
        <div className="space-y-3 pb-4">
          <Link href="/auth/register" className="block">
            <button className="w-full bg-orange-primary hover:bg-orange-hover text-white font-bold py-4 px-8 rounded-button shadow-glow-orange active:scale-98 transition-all duration-200">
              Start Training
            </button>
          </Link>
          
          <Link href="/auth/login" className="block">
            <button className="w-full bg-dark-card text-text-primary font-semibold py-4 px-8 rounded-button border border-dark-border hover:border-orange-primary active:scale-98 transition-all duration-200">
              Sign In
            </button>
          </Link>
        </div>

      </div>
    </div>
  )
}