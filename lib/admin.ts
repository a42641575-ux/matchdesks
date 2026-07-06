import { cookies } from 'next/headers';
import crypto from 'node:crypto';

// Minimal admin auth for the moderation queue. There's no user-account system
// in this milestone, so moderation is gated by a single shared secret
// (ADMIN_SECRET env var). The secret itself never lives in the cookie — we
// store an HMAC of it and verify by recomputing.

export const ADMIN_COOKIE = 'matchdesks_admin';
const TOKEN_SALT = 'matchdesks-admin-v1';

export function isAuthConfigured(): boolean {
  return Boolean(process.env.ADMIN_SECRET);
}

export function adminToken(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return '';
  return crypto.createHmac('sha256', secret).update(TOKEN_SALT).digest('hex');
}

function timingSafeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  if (!isAuthConfigured()) return false;
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const expected = adminToken();
  if (!expected) return false;
  return timingSafeEqual(token, expected);
}

export async function setAdminCookie(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE, adminToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}
