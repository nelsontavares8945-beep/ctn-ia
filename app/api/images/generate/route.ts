import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({
    error: 'A geração de imagens exige um modelo com cota gratuita disponível na sua conta Gemini. Ela está desativada para evitar qualquer cobrança inesperada.',
  }, { status: 503 });
}
