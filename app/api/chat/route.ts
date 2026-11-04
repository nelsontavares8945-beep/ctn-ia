import { NextRequest, NextResponse } from 'next/server';
import { recordActivity } from '@/lib/activity';
import { askGemini, responseText } from '@/lib/gemini';

const appName = process.env.APP_NAME || 'CTN.IA';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = typeof body?.message === 'string' ? body.message.trim().slice(0, 8000) : '';
    if (!message) return NextResponse.json({ error: 'Mensagem vazia.' }, { status: 400 });
    const rawHistory = Array.isArray(body?.history) ? body.history : [];
    const history = rawHistory
      .filter((item: any) => (item?.role === 'user' || item?.role === 'assistant') && typeof item?.content === 'string')
      .slice(-20)
      .map((item: any) => ({ role: item.role, parts: [{ text: item.content.trim().slice(0, 4000) }] }))
      .filter((item: any) => item.parts[0].text.length > 0);
    const contents = [...history, { role: 'user', parts: [{ text: message }] }];
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: `${appName} está sem IA conectada. Configure GEMINI_API_KEY no ambiente do servidor.` }, { status: 503 });
    const data = await askGemini(contents, `Você é ${appName}, uma assistente útil, natural e direta. Responda em português do Brasil. Use o contexto das mensagens anteriores para manter a continuidade da conversa. Informe quando não souber e não afirme que tem acesso à internet em tempo real sem uma ferramenta de busca.`);
    const answer = responseText(data) || 'Não consegui responder agora.';
    const response = NextResponse.json({ answer });
    try { return await recordActivity(request, 'chat', message, answer, response); }
    catch (error) { console.error('Chat answer created but history could not be saved:', error); return response; }
  } catch (error) {
    console.error('Chat request failed:', error);
    return NextResponse.json({ error: 'Não foi possível consultar a IA. Confira a chave Gemini e os limites da cota gratuita.' }, { status: 500 });
  }
}
