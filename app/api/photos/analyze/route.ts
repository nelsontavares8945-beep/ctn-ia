import { NextRequest, NextResponse } from 'next/server';
import { recordActivity } from '@/lib/activity';
import { askGemini, responseText } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const entry = formData.get('file');
    const file = entry instanceof File ? entry : null;
    const question = String(formData.get('question') || 'Descreva o que aparece na imagem.').slice(0, 1000);
    if (!file || !file.type.startsWith('image/')) return NextResponse.json({ error: 'Envie um arquivo de imagem válido.' }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'A imagem deve ter até 8 MB.' }, { status: 413 });
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: 'Configure GEMINI_API_KEY para analisar imagens.' }, { status: 503 });
    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
    const result = await askGemini([{ role: 'user', parts: [{ text: question }, { inline_data: { mime_type: file.type, data: base64 } }] }], 'Analise a imagem e responda em português do Brasil. Seja claro e não invente detalhes que não possam ser vistos.');
    const answer = responseText(result) || 'Não foi possível analisar a imagem.';
    const response = NextResponse.json({ analysis: answer });
    try { return await recordActivity(request, 'photo', question, answer, response); }
    catch (error) { console.error('Photo answer created but history could not be saved:', error); return response; }
  } catch (error) {
    console.error('Photo analysis failed:', error);
    return NextResponse.json({ error: 'Erro ao analisar imagem. Confira a chave Gemini e a cota gratuita.' }, { status: 500 });
  }
}
