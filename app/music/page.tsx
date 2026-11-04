"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Download, Music2, Play, Sparkles } from 'lucide-react';

type MusicResult = { title: string; lyrics: string; melody: string; chords: string[]; tempo: number; audioDataUrl: string; audioNote: string };

export default function MusicStudioPage() {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState<MusicResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function createMusic() {
    if (!prompt.trim()) return;
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/music/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível gerar a música.');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado ao gerar música.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="container admin-container">
    <section className="admin-welcome"><div><span className="eyebrow"><Music2 size={15} /> ESTÚDIO DE MÚSICA</span><h1>Crie sua ideia musical</h1><p>Gere uma letra e ouça uma prévia instrumental sintetizada.</p></div><Link className="secondary-button" href="/">Voltar ao app</Link></section>
    <section className="card music-studio-card">
      <div className="card-header"><Sparkles /><h2>Descreva a música</h2></div>
      <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ex.: pop brasileiro sobre recomeço, clima esperançoso, andamento médio..." />
      <button className="primary-button" onClick={createMusic} disabled={busy || !prompt.trim()}>{busy ? 'Compondo...' : 'Criar letra e prévia'}</button>
      {error && <div className="result-box" role="alert">{error}</div>}
    </section>
    {result && <section className="card music-result-card">
      <span className="eyebrow">PRÉVIA GERADA</span><h2>{result.title}</h2>
      <div className="music-metadata"><span>{result.tempo} BPM</span><span>{result.chords.join(' · ')}</span><span>{result.melody}</span></div>
      <label className="audio-label">Prévia instrumental (WAV)<audio controls preload="metadata" src={result.audioDataUrl}>Seu navegador não suporta áudio.</audio></label>
      <a className="secondary-button audio-download" href={result.audioDataUrl} download={`${result.title.replace(/[^\w-]+/g, '_')}.wav`}><Download size={17} /> Baixar prévia</a>
      <p className="muted">{result.audioNote}</p>
      <h3>Letra</h3><pre className="music-lyrics">{result.lyrics}</pre>
      <h3>Guia de melodia</h3><p className="muted">{result.melody}</p>
    </section>}
  </main>;
}
