import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminCookieName, isAdminTokenValid } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const token = cookies().get(adminCookieName)?.value;
  if (!(await isAdminTokenValid(token))) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  let databaseConfigured = Boolean(process.env.DATABASE_URL);
  let activityCount: number | null = null;
  if (databaseConfigured) {
    try { activityCount = await prisma.activity.count(); }
    catch { databaseConfigured = false; }
  }

  return NextResponse.json({
    appName: process.env.APP_NAME || 'CTN.IA',
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
    model: process.env.MODEL || 'gemini-3.5-flash',
    adminConfigured: Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD && process.env.AUTH_SECRET),
    databaseConfigured,
    activityCount,
    note: 'Segredos não são enviados ao navegador. Configure-os no ambiente do servidor.',
  });
}
