import { NextRequest, NextResponse } from 'next/server';
import { getGuestSession, setGuestCookie } from '@/lib/activity';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Banco indisponível.' }, { status: 503 });
  try {
    const session = await getGuestSession(request);
    const items = await prisma.learnedFact.findMany({ where: { sessionId: session.id }, orderBy: { createdAt: 'desc' }, take: 100, select: { id: true, content: true, createdAt: true } });
    const response = NextResponse.json({ items });
    if (session.isNew) setGuestCookie(response, session.token);
    return response;
  } catch (error) {
    console.error('Memory read failed:', error);
    return NextResponse.json({ error: 'Não foi possível carregar a memória.' }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Banco indisponível.' }, { status: 503 });
  try {
    const body = await request.json();
    const content = typeof body?.content === 'string' ? body.content.trim().slice(0, 1200) : '';
    if (!content) return NextResponse.json({ error: 'Escreva o que quer guardar.' }, { status: 400 });
    const session = await getGuestSession(request);
    const count = await prisma.learnedFact.count({ where: { sessionId: session.id } });
    if (count >= 100) return NextResponse.json({ error: 'A memória chegou ao limite de 100 itens. Apague algum item para salvar outro.' }, { status: 409 });
    const item = await prisma.learnedFact.create({ data: { sessionId: session.id, content } });
    const response = NextResponse.json({ item }, { status: 201 });
    if (session.isNew) setGuestCookie(response, session.token);
    return response;
  } catch (error) {
    console.error('Memory save failed:', error);
    return NextResponse.json({ error: 'Não foi possível salvar essa memória.' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'Banco indisponível.' }, { status: 503 });
  try {
    const session = await getGuestSession(request);
    const id = request.nextUrl.searchParams.get('id');
    if (id) await prisma.learnedFact.deleteMany({ where: { id, sessionId: session.id } });
    else await prisma.learnedFact.deleteMany({ where: { sessionId: session.id } });
    const response = NextResponse.json({ ok: true });
    if (session.isNew) setGuestCookie(response, session.token);
    return response;
  } catch (error) {
    console.error('Memory delete failed:', error);
    return NextResponse.json({ error: 'Não foi possível apagar a memória.' }, { status: 503 });
  }
}
