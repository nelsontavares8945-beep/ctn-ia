import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { recordActivity } from '@/lib/activity';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const entry = formData.get('file');
    const file = entry instanceof File ? entry : null;
    const question = String(formData.get('question') || 'Descreva o que aparece na imagem.').slice(0, 1000);
    if (!file || !file.type.startsWith('image/')) return NextResponse.json({ error: 'Envie um arquivo de imagem válido.' }, { status: 400 });
    if (file.size > 8 * 1024 * 1024) return NextResponse.json({ error: 'A imagem deve ter até 8 MB.' }, { status: 413 });
    if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'Configure OPENAI_API_KEY para analisar imagens.' }, { status: 503 });

    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await client.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Analise a imagem e responda em português do Brasil. Seja claro e não invente detalhes que não possam ser vistos.' },
        { role: 'user', content: [{ type: 'text', text: question }, { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } }] as any },
      ],
    });
    const answer = result.choices[0]?.message?.content || 'Não foi possível analisar a imagem.';
    const response = NextResponse.json({ analysis: answer });
    try { return await recordActivity(request, 'photo', question, answer, response); }
    catch (error) { console.error('Photo answer created but history could not be saved:', error); return response; }
  } catch (error) {
    console.error('Photo analysis failed:', error);
    return NextResponse.json({ error: 'Erro ao analisar imagem. Verifique a configuração da API.' }, { status: 500 });
  }
}
