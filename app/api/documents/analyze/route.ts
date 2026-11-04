import { NextResponse } from 'next/server';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const question = String(formData.get('question') || 'Resuma e responda o documento.');

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: 'Arquivo obrigatório.' }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const name = file.name || 'documento';
    const lower = name.toLowerCase();

    let extractedText = '';

    if (lower.endsWith('.pdf')) {
      const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
      for (let i = 1; i <= pdf.numPages; i += 1) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(' ');
        extractedText += `${pageText}\n`;
      }
    } else if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
      const result = await mammoth.extractRawText({ buffer: bytes });
      extractedText = result.value || '';
    } else {
      extractedText = bytes.toString('utf-8');
    }

    const textPreview = extractedText.trim().slice(0, 2000);
    const answer = `O documento foi lido com sucesso. A informação principal é: ${
      textPreview || 'nenhum texto foi encontrado.'
    }\n\nPergunta do usuário: ${question}`;

    return NextResponse.json({
      answer,
      textPreview,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao analisar documento.' }, { status: 500 });
  }
}
