import { NextRequest, NextResponse } from 'next/server';
import { recordActivity } from '@/lib/activity';
import { analyzeImageWithFallback } from '@/lib/ai-fallback';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const entry = formData.get('file');
    const file = entry instanceof File ? entry : null;
    const question = String(formData.get('question') || 'Descreva o que aparece na imagem.').slice(0, 1000);
    if (!file || !file.type.startsWith('image/')) return NextResponse.json({ error: 'Envie um arquivo de imagem válido.' }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'A imagem deve ter até 8 MB.' }, { status: 413 });
    if (!process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) return NextResponse.json({ error: 'Configure Groq ou Gemini para analisar imagens.' }, { status: 503 });
    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
    const answer = await analyzeImageWithFallback(question, file.type, base64);
    const response = NextResponse.json({ analysis: answer });
    try { return await recordActivity(request, 'photo', question, answer, response); }
    catch (error) { console.error('Photo answer created but history could not be saved:', error); return response; }
  } catch (error) {
    console.error('Photo analysis failed:', error);
    return NextResponse.json({ error: 'Erro ao analisar imagem. Confira o acesso e os limites gratuitos do Groq ou Gemini.' }, { status: 500 });
  }
}
