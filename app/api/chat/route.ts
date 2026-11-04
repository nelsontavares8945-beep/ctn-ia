import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const appName = process.env.APP_NAME || 'CTN.IA';
const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body?.message === 'string' ? body.message.trim() : '';

    if (!message) {
      return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 });
    }

    if (!client) {
      return NextResponse.json({
        answer: `${appName} respondeu no modo local: ${message}. Para uma resposta com IA real, configure OPENAI_API_KEY no arquivo .env.local.`,
      });
    }

    const completion = await client.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            `Você é ${appName}, uma assistente inteligente útil, direta e atualizada. Responda em português do Brasil. Seja precisa e contextualizada.`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
    });

    const answer = completion.choices[0]?.message?.content || 'Não consegui responder agora.';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        answer: 'Houve um problema ao consultar a IA. Verifique a chave da API e tente novamente.',
      },
      { status: 500 }
    );
  }
}
