import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminCookieName, isAdminTokenValid } from '@/lib/auth';

export async function GET() {
  const token = cookies().get(adminCookieName)?.value;
  return NextResponse.json({ authenticated: await isAdminTokenValid(token) });
}
