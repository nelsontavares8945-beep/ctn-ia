import { NextRequest, NextResponse } from 'next/server';
import { askGemini, responseText } from '@/lib/gemini';
import { recordActivity } from '@/lib/activity';

function noteToFrequency(note: string) {
  const match = note.match(/^([A-G])(#|b)?/i);
  if (!match) return 440;
  const semitones: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  let midi = 60 + semitones[match[1].toUpperCase()];
  if (match[2] === '#') midi += 1;
  if (match[2] === 'b') midi -= 1;
  const octave = Number(note.match(/-?\d+/)?.[0] ?? 4);
  midi += (octave - 4) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function makePreviewWav(chords: string[], tempo: number) {
  const sampleRate = 22050;
  const safeTempo = Math.max(60, Math.min(160, Math.round(tempo || 100)));
  const barSeconds = 240 / safeTempo;
  const duration = barSeconds * 8;
  const samples = Math.floor(sampleRate * duration);
  const pcm = Buffer.alloc(samples * 2);
  const progression = chords.length ? chords.slice(0, 4) : ['C', 'G', 'Am', 'F'];
  const melodyOffsets = [0, 4, 7, 12, 7, 4, 2, 4];
  const roots = progression.map((chord) => noteToFrequency(chord));

  for (let i = 0; i < samples; i += 1) {
    const time = i / sampleRate;
    const bar = Math.floor(time / barSeconds) % roots.length;
    const beat = Math.floor(time / (barSeconds / 4));
    const withinBeat = time % (barSeconds / 4);
    const envelope = Math.min(1, withinBeat / 0.025) * Math.max(0, 1 - withinBeat / (barSeconds / 4));
    const root = roots[bar];
    const melodyFrequency = root * Math.pow(2, melodyOffsets[beat % melodyOffsets.length] / 12);
    const chord = 0.12 * (Math.sin(2 * Math.PI * root * time) + Math.sin(2 * Math.PI * root * 1.25 * time) + Math.sin(2 * Math.PI * root * 1.5 * time));
    const melody = 0.42 * Math.sin(2 * Math.PI * melodyFrequency * time) * envelope;
    const value = Math.max(-1, Math.min(1, chord + melody));
    pcm.writeInt16LE(Math.round(value * 32767), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]).toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const prompt = typeof body?.prompt === 'string' ? body.prompt.trim().slice(0, 1500) : '';
    if (!prompt) return NextResponse.json({ error: 'Prompt obrigatório.' }, { status: 400 });
    if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: 'Configure GEMINI_API_KEY para criar a letra personalizada.' }, { status: 503 });

    const result = await askGemini([{ role: 'user', parts: [{ text: prompt }] }], 'Crie uma proposta musical original em português. Retorne JSON válido com title, lyrics, melody, chords (array de notas/acordes simples como C, Am, F, G) e tempo (BPM). Não imite artistas vivos.', true);
    const content = responseText(result);
    if (!content) throw new Error('Resposta vazia');
    const music = JSON.parse(content);
    const chords = Array.isArray(music.chords) ? music.chords.slice(0, 4).map(String) : ['C', 'G', 'Am', 'F'];
    const tempo = Number(music.tempo) || 100;
    const audioBase64 = makePreviewWav(chords, tempo);
    const audioDataUrl = `data:audio/wav;base64,${audioBase64}`;
    const response = NextResponse.json({
      title: String(music.title || 'Minha música'),
      lyrics: String(music.lyrics || ''),
      melody: String(music.melody || ''),
      chords,
      tempo,
      audioDataUrl,
      audioNote: 'Prévia instrumental sintetizada da progressão; não é voz cantada nem produção de estúdio.',
    });
    try {
      return await recordActivity(request, 'music', prompt, `${music.title || 'Minha música'}\n${music.lyrics || ''}`, response);
    } catch (error) {
      console.error('Music preview created but history could not be saved:', error);
      return response;
    }
  } catch (error) {
    console.error('Music generation failed:', error);
    return NextResponse.json({ error: 'Não foi possível criar a música. Verifique a chave, o acesso ao modelo e o faturamento.' }, { status: 500 });
  }
}
