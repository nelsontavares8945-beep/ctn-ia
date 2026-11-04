import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminCookieName, isAdminTokenValid } from '@/lib/auth';

export async function GET() {
  const token = cookies().get(adminCookieName)?.value;
  if (!(await isAdminTokenValid(token))) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  return NextResponse.json({
    appName: process.env.APP_NAME || 'CTN.IA',
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    model: process.env.MODEL || 'gpt-4o-mini',
    adminConfigured: Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET),
    note: 'Segredos não são enviados ao navegador. Configure-os no ambiente do servidor.',
  });
}
