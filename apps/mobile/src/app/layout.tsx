import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'RYTHM - Your Training Companion',
  description: 'Track your strength, cardio, and hybrid workouts with precision',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RYTHM',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'application-name': 'RYTHM',
  },
}

export const viewport: Viewport = {
  themeColor: '#FF8C42', // Orange brand color
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Allow zooming for accessibility
  userScalable: true, // Allow user scaling for accessibility
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="color-scheme" content="dark" />
        {/* Prevent browser extension interference */}
        <meta httpEquiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'none';" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className="h-full bg-dark-primary text-text-primary">
        {/* Black notch overlay (ensures notch/status bar area always black) */}
        <div className="fixed top-0 left-0 right-0 h-[env(safe-area-inset-top)] bg-black pointer-events-none z-[100]"></div>
        <Providers>
          <main className="h-full min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}