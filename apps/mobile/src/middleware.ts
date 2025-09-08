import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/profile', '/analytics', '/training']

// Auth routes that should redirect if already authenticated
const authRoutes = ['/auth/login', '/auth/register']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if this is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))
  
  // For now, just allow all routes to pass through
  // In a production app, you would check for valid JWT tokens here
  // and redirect to /auth/login if not authenticated
  
  if (isProtectedRoute) {
    // TODO: Add JWT token validation logic here
    // For development, we'll let the AuthContext handle redirects
    console.log(`Accessing protected route: ${pathname}`)
  }
  
  if (isAuthRoute) {
    // TODO: Add logic to redirect to dashboard if already authenticated
    console.log(`Accessing auth route: ${pathname}`)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}