import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey || 'default_secret_key')

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value

  // 1. Redirect to login if accessing dashboard without session
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      await jwtVerify(session, encodedKey, {
        algorithms: ['HS256'],
      })
      // Session is valid
      return NextResponse.next()
    } catch (error) {
      // Session is invalid
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // 2. Redirect to dashboard if accessing login with active session
  if (request.nextUrl.pathname.startsWith('/login')) {
      if (session) {
        try {
            await jwtVerify(session, encodedKey, {
              algorithms: ['HS256'],
            })
            return NextResponse.redirect(new URL('/dashboard', request.url))
        } catch (error) {
            // Invalid session, let them proceed to login
            return NextResponse.next()
        }
      }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/login'],
}
