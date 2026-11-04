import { NextResponse } from 'next/server';
import { adminCookieName, adminSessionDuration, createAdminToken } from '@/lib/auth';

export async function POST(request: Request) {
  const configuredEmail = process.env.ADMIN_EMAIL;
  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredEmail || !configuredPassword || !process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'Configure ADMIN_EMAIL, ADMIN_PASSWORD e AUTH_SECRET no ambiente do servidor.' }, { status: 503 });
  }

  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  if (body.email !== configuredEmail || body.password !== configuredPassword) {
    return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
  }

  try {
    const token = await createAdminToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(adminCookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: adminSessionDuration,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'AUTH_SECRET inválido; use um segredo aleatório com pelo menos 32 caracteres.' }, { status: 503 });
  }
}
