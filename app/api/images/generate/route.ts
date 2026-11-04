import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt obrigatório.' }, { status: 400 });
    }

    if (!client) {
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
          <defs>
            <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stop-color="#101827" />
              <stop offset="100%" stop-color="#1d4ed8" />
            </linearGradient>
          </defs>
          <rect width="1024" height="1024" fill="url(#bg)"/>
          <circle cx="512" cy="420" r="220" fill="#7c3aed" opacity="0.7"/>
          <circle cx="512" cy="420" r="150" fill="#38bdf8" opacity="0.6"/>
          <text x="512" y="760" font-size="44" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif">CTN.IA</text>
          <text x="512" y="820" font-size="26" text-anchor="middle" fill="#dbeafe" font-family="Arial, sans-serif">${prompt.slice(0, 60)}</text>
        </svg>
      `;

      return NextResponse.json({
        image: `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`,
      });
    }

    const response = await client.images.generate({
      model: 'gpt-image-1',
      prompt,
      size: '1024x1024',
    });

    const image = response.data?.[0]?.url || response.data?.[0]?.b64_json;

    return NextResponse.json({
      image: image
        ? image.startsWith('data:')
          ? image
          : `data:image/png;base64,${image}`
        : null,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao gerar imagem.' }, { status: 500 });
  }
}
