import { SignJWT, jwtVerify } from 'jose';
import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const guestCookieName = 'ctnia_guest_session';
const maxHistoryRows = 100;

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new Error('AUTH_SECRET precisa ter pelo menos 32 caracteres.');
  return new TextEncoder().encode(value);
}

export async function getGuestSession(request: NextRequest) {
  const current = request.cookies.get(guestCookieName)?.value;
  if (current) {
    try {
      const { payload } = await jwtVerify(current, secret());
      if (payload.role === 'guest' && typeof payload.sub === 'string') {
        return { id: payload.sub, token: current, isNew: false };
      }
    } catch {
      // Emite uma nova sessão para cookies inválidos ou expirados.
    }
  }
  const id = randomUUID();
  const token = await new SignJWT({ role: 'guest' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(id)
    .setIssuedAt()
    .setExpirationTime('90d')
    .sign(secret());
  return { id, token, isNew: true };
}

export function setGuestCookie(response: NextResponse, token: string) {
  response.cookies.set(guestCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 90,
  });
  return response;
}

export async function recordActivity(
  request: NextRequest,
  category: string,
  prompt: string,
  content: string,
  response: NextResponse,
) {
  if (!process.env.DATABASE_URL) return response;
  const session = await getGuestSession(request);
  await prisma.activity.create({ data: { sessionId: session.id, category, prompt: prompt.slice(0, 2000), content } });
  const oldRows = await prisma.activity.findMany({
    where: { sessionId: session.id },
    orderBy: { createdAt: 'desc' },
    skip: maxHistoryRows,
    select: { id: true },
  });
  if (oldRows.length) {
    await prisma.activity.deleteMany({ where: { id: { in: oldRows.map((row) => row.id) } } });
  }
  if (session.isNew) setGuestCookie(response, session.token);
  return response;
}
