import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { generateSecret, generateURI, verifySync } from 'otplib'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export interface JWTPayload {
  userId: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
  divisionId: string | null
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Sign JWT token (expires in 7 days)
export async function signToken(payload: Record<string, unknown>, expiration = '7d'): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(JWT_SECRET)
}

// Verify JWT token
export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as Record<string, unknown>
  } catch {
    return null
  }
}

// Get current user from cookie
export async function getCurrentUser(request?: Request): Promise<JWTPayload | null> {
  const cookieHeader = request?.headers.get('cookie') || (await cookies()).toString()
  const match = cookieHeader.match(/pmo_token=([^;]+)/)
  const token = match?.[1]
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return payload as unknown as JWTPayload
}

// Check if email domain is allowed
export function isEmailDomainAllowed(email: string): boolean {
  const domains = (process.env.ALLOWED_EMAIL_DOMAINS || '').split(',').map(d => d.trim()).filter(Boolean)
  if (domains.length === 0) return true // allow all if not configured
  const emailDomain = email.split('@')[1]?.toLowerCase()
  return emailDomain ? domains.some(d => emailDomain === d.toLowerCase() || emailDomain.endsWith('.' + d.toLowerCase())) : false
}

// Generate 2FA secret
export function generate2FASecret(email: string): { secret: string; otpauth: string } {
  const secret = generateSecret()
  const otpauth = generateURI({ strategy: 'totp', issuer: 'PMO Dashboard', label: email, secret })
  return { secret, otpauth }
}

// Verify 2FA token
export function verify2FAToken(secret: string, token: string): boolean {
  const result = verifySync({ token, secret, strategy: 'totp' })
  return result.valid
}