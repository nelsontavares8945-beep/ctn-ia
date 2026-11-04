import { SignJWT, jwtVerify } from 'jose';

const COOKIE_NAME = 'ctnia_admin_session';
const SESSION_DURATION = 60 * 60 * 8;

function getSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) return null;
  return new TextEncoder().encode(value);
}

export async function createAdminToken() {
  const secret = getSecret();
  if (!secret) throw new Error('AUTH_SECRET precisa ter pelo menos 32 caracteres.');
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION}s`)
    .sign(secret);
}

export async function isAdminTokenValid(token?: string) {
  const secret = getSecret();
  if (!secret || !token) return false;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export const adminCookieName = COOKIE_NAME;
export const adminSessionDuration = SESSION_DURATION;
