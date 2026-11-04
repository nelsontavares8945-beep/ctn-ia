import { NextRequest, NextResponse } from 'next/server';
import { getGuestSession, setGuestCookie } from '@/lib/activity';
import { prisma } from '@/lib/prisma';

const categories = new Set(['chat', 'music', 'document', 'photo']);

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Banco não configurado. Defina DATABASE_URL.' }, { status: 503 });
  try {
    const session = await getGuestSession(request);
    const rows = await prisma.activity.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: { id: true, category: true, prompt: true, content: true, createdAt: true },
    });
    const response = NextResponse.json({ items: rows });
    if (session.isNew) setGuestCookie(response, session.token);
    return response;
  } catch (error) {
    console.error('History request failed:', error);
    return NextResponse.json({ error: 'Não foi possível carregar o histórico. Confira AUTH_SECRET e DATABASE_URL.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Banco não configurado. Defina DATABASE_URL.' }, { status: 503 });
  try {
    const body = await request.json();
    const category = typeof body?.category === 'string' ? body.category : '';
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
    const content = typeof body?.content === 'string' ? body.content.trim() : '';
    if (!categories.has(category) || !prompt || !content || prompt.length > 2000 || content.length > 20000) {
      return NextResponse.json({ error: 'Registro inválido ou muito grande.' }, { status: 400 });
    }
    const session = await getGuestSession(request);
    const item = await prisma.activity.create({ data: { sessionId: session.id, category, prompt, content } });
    const response = NextResponse.json({ item }, { status: 201 });
    if (session.isNew) setGuestCookie(response, session.token);
    return response;
  } catch (error) {
    console.error('Could not save history:', error);
    return NextResponse.json({ error: 'Não foi possível salvar. Verifique a configuração do banco e do segredo de sessão.' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Banco não configurado. Defina DATABASE_URL.' }, { status: 503 });
  try {
    const session = await getGuestSession(request);
    await prisma.activity.deleteMany({ where: { sessionId: session.id } });
    const response = NextResponse.json({ ok: true });
    if (session.isNew) setGuestCookie(response, session.token);
    return response;
  } catch (error) {
    console.error('Could not clear history:', error);
    return NextResponse.json({ error: 'Não foi possível apagar o histórico.' }, { status: 503 });
  }
}
