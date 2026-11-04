import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { recordActivity } from '@/lib/activity';

const appName = process.env.APP_NAME || 'CTN.IA';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 8000) : '';
    if (!message) return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 });

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ answer: `${appName} está sem IA conectada. Configure OPENAI_API_KEY no ambiente do servidor para obter respostas reais.` }, { status: 503 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `Você é ${appName}, uma assistente útil e direta. Responda em português do Brasil. Informe quando não souber e não afirme que tem acesso à internet em tempo real sem uma ferramenta de busca.` },
        { role: 'user', content: message },
      ],
    });
    const answer = completion.choices[0]?.message?.content || 'Não consegui responder agora.';
    const response = NextResponse.json({ answer });
    try {
      return await recordActivity(request, 'chat', message, answer, response);
    } catch (error) {
      console.error('Chat answer created but history could not be saved:', error);
      return response;
    }
  } catch (error) {
    console.error('Chat request failed:', error);
    return NextResponse.json({ error: 'Não foi possível consultar a IA. Confira a API key, o modelo e o faturamento.' }, { status: 500 });
  }
}
