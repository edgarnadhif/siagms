import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = process.env.SESSION_SECRET
const encodedKey = new TextEncoder().encode(secretKey || 'default_secret_key')

type SessionPayload = {
  userId: string
  expiresAt: Date
}

export async function createSession(userId: string, remember: boolean = false) {
  // If remember me is checked, set expiration to 30 days, else 1 day (session)
  // But strictly speaking, session cookies expire on browser close. 
  // However, often "remember me" means a persistent cookie vs a session cookie.
  // Next.js cookies API uses create/set and requires maxAge.
  // A transient cookie (session) usually has no expiry, but secure/httpOnly.
  // Let's use 7 days for normal, 30 days for remember me for simplicity, 
  // or use undefined for session cookie (browser close) if possible.
  
  const duration = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 days vs 1 day
  const expiresAt = new Date(Date.now() + duration)
  
  const session = await new SignJWT({ userId, expiresAt })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(encodedKey)
 
  const cookieStore = await cookies()
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  })
}

export async function verifySession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
 
  if (!session) {
    return null
  }
 
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    })
    return payload as SessionPayload
  } catch (error) {
    console.log('Failed to verify session')
    return null
  }
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}
