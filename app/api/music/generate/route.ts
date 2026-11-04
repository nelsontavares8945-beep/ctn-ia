import { NextResponse } from 'next/server';

function buildLyrics(prompt: string) {
  const basePrompt = prompt.toLowerCase();
  const mood = basePrompt.includes('triste') ? 'triste' : basePrompt.includes('feliz') ? 'alegre' : 'inspirador';

  const lyrics = [
    'No silêncio da noite eu aprendi a voar',
    'Cada passo foi uma chance de renascer',
    'Com coragem no peito e fé no coração',
    `Eu sigo em frente, mesmo quando o mundo diz que não`,
    'A luz sempre vem quando a alma escolhe lutar',
    'E a vida me mostrou que o sonho também canta',
    'Hoje eu sou mais forte, com a voz do céu',
    'E a esperança me leva para além do medo',
  ];

  if (mood === 'alegre') {
    return [
      'Hoje a vida me sorriu em plena luz',
      'Eu danço com o vento e sigo em busca do sol',
      'Cada batida no peito me chama para viver',
      'E o sonho me guia até a estrada da alegria',
      'Eu canto sem medo, porque o amor me move',
      'A música me leva para um lugar de paz',
    ].join('\n');
  }

  if (mood === 'triste') {
    return [
      'As nuvens caíram e o céu ficou sem cor',
      'Mas ainda há dentro de mim uma chama a resistir',
      'Eu aprendi que o choro também pode ser alegria',
      'E que o amanhã nasce depois da noite',
      'Mesmo ferida, eu sigo procurando a paz',
    ].join('\n');
  }

  return lyrics.join('\n');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt obrigatório.' }, { status: 400 });
    }

    const melody = 'C - G - Am - F';
    const chords = ['C', 'G', 'Am', 'F'];
    const lyrics = buildLyrics(prompt);

    return NextResponse.json({
      lyrics,
      melody,
      chords,
      tempo: 92,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao gerar música.' }, { status: 500 });
  }
}
