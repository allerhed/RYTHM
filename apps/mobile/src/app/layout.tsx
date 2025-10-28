import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from './providers'
import { HamburgerMenu } from '@/components/HamburgerMenu'

export const metadata: Metadata = {
  title: 'RYTHM - Hybrid Training App',
  description: 'Track your strength, cardio, and hybrid workouts with precision',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'RYTHM',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'application-name': 'RYTHM',
  },
}

export const viewport: Viewport = {
  themeColor: '#0F0F0F', // Dark theme primary background
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
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="color-scheme" content="dark" />
        {/* Prevent browser extension interference */}
        <meta httpEquiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'none';" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>
      <body className="h-full bg-dark-primary text-text-primary">
        <Providers>
          <HamburgerMenu />
          <main className="h-full min-h-screen">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}