import { auth } from "@/lib/auth/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  console.log('🛡️ [MIDDLEWARE] Path:', nextUrl.pathname, '| Logged in:', isLoggedIn, '| Has auth:', !!req.auth)

  // Define protected routes
  const isProtectedRoute = nextUrl.pathname.startsWith('/dashboard') ||
                          nextUrl.pathname.startsWith('/admin') ||
                          nextUrl.pathname.startsWith('/profile') ||
                          nextUrl.pathname.startsWith('/employees') ||
                          nextUrl.pathname.startsWith('/portal-system')

  // Define auth routes
  const isAuthRoute = nextUrl.pathname.startsWith('/login') ||
                     nextUrl.pathname.startsWith('/register')

  // Handle root path (/)
  if (nextUrl.pathname === '/') {
    if (isLoggedIn) {
      console.log('🛡️ [MIDDLEWARE] Root path - Redirecting logged in user to dashboard')
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    } else {
      console.log('🛡️ [MIDDLEWARE] Root path - Redirecting guest to login')
      return NextResponse.redirect(new URL('/login', nextUrl))
    }
  }

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !isLoggedIn) {
    console.log('🛡️ [MIDDLEWARE] Protected route without auth - Redirecting to login')
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  // Redirect to dashboard if accessing auth routes while logged in
  if (isAuthRoute && isLoggedIn) {
    console.log('🛡️ [MIDDLEWARE] Auth route while logged in - Redirecting to dashboard')
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  console.log('🛡️ [MIDDLEWARE] Allowing request to proceed')
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}