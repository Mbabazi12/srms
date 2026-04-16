import jwt from 'jsonwebtoken';
import { JwtPayload } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'srms-super-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const COOKIE_NAME = 'srms_token';

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function getTokenFromCookieHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const tokenCookie = cookies.find(c => c.startsWith(`${COOKIE_NAME}=`));
  return tokenCookie ? tokenCookie.split('=')[1] : null;
}

export function createAuthCookie(token: string): string {
  const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function clearAuthCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

export { COOKIE_NAME };
