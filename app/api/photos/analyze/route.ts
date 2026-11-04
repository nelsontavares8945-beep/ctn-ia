import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const question = String(formData.get('question') || 'Descreva o que aparece na imagem.');

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Arquivo obrigatório.' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mime = file.type || 'image/jpeg';
    const dataUrl = `data:${mime};base64,${buffer.toString('base64')}`;

    if (!client) {
      return NextResponse.json({
        analysis: `Recebi a imagem com sucesso. No modo local, posso confirmar que o arquivo foi carregado e que a pergunta foi: "${question}". Para análise real com visão computacional, configure OPENAI_API_KEY.`,
      });
    }

    const completion = await client.chat.completions.create({
      model: process.env.MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Você é a CTN.IA e deve responder sobre imagens de forma útil, objetiva e em português do Brasil.',
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: question },
            { type: 'image_url', image_url: { url: dataUrl } },
          ] as any,
        },
      ],
    });

    const answer = completion.choices[0]?.message?.content || 'Não foi possível analisar a imagem.';

    return NextResponse.json({ analysis: answer });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao analisar imagem.' }, { status: 500 });
  }
}
