import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim().slice(0, 1500) : '';
    if (!prompt) return NextResponse.json({ error: 'Prompt obrigatório.' }, { status: 400 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'Configure OPENAI_API_KEY para gerar letras e arranjos personalizados.' }, { status: 503 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const result = await client.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Crie uma proposta musical original em português. Retorne JSON válido com as chaves title, lyrics, melody, chords (array de acordes) e tempo (BPM). A melodia deve ser descrita em notas/ritmo, não em áudio. Não imite artistas vivos.' },
        { role: 'user', content: prompt },
      ],
    });
    const content = result.choices[0]?.message?.content;
    if (!content) throw new Error('Resposta vazia');
    const music = JSON.parse(content);
    return NextResponse.json({ ...music, audioAvailable: false, note: 'Esta integração cria letra e guia musical em texto. Para renderizar áudio cantado é necessário conectar um provedor de geração musical separado.' });
  } catch (error) {
    console.error('Erro ao criar proposta musical:', error);
    return NextResponse.json({ error: 'Não foi possível criar a proposta musical. Confira a chave e o acesso ao modelo.' }, { status: 500 });
  }
}
