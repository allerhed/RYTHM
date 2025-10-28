import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <div className="h-screen flex flex-col bg-dark-primary">
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-8 safe-area-top safe-area-bottom">
        
        {/* Logo & Title Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-8">
            <Image 
              src="/icons/icon-512x512.png" 
              alt="RYTHM Logo" 
              width={200} 
              height={200}
              className="rounded-3xl"
              priority
            />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-primary to-orange-hover bg-clip-text text-transparent mb-3">
            RYTHM
          </h1>
          <p className="text-xl text-text-secondary font-medium">
            Your Training Companion
          </p>
        </div>

        {/* Call to Action Buttons */}
        <div className="w-full max-w-sm space-y-3">
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