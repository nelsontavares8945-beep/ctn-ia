"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Activity = { id: string; category: string; prompt: string; content: string; createdAt: string };

export default function HistoryPage() {
  const [items, setItems] = useState<Activity[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);

  async function loadHistory() {
    setBusy(true);
    try {
      const response = await fetch('/api/history', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível carregar o histórico.');
      setItems(data.items || []);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico.');
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void loadHistory(); }, []);

  async function clearHistory() {
    if (!window.confirm('Apagar todo o histórico deste navegador?')) return;
    const response = await fetch('/api/history', { method: 'DELETE' });
    if (response.ok) setItems([]);
    else setError('Não foi possível apagar o histórico.');
  }

  return <main className="container admin-container">
    <section className="admin-welcome"><div><span className="eyebrow">DADOS NA NUVEM</span><h1>Histórico</h1><p>Atividades salvas na base de dados da sua sessão neste navegador.</p></div><div className="admin-actions"><Link className="secondary-button" href="/">Voltar ao app</Link><button className="secondary-button" onClick={clearHistory} disabled={!items.length}>Apagar histórico</button></div></section>
    {error && <div className="result-box" role="alert">{error}</div>}
    {busy && <p className="muted">Carregando...</p>}
    {!busy && !error && !items.length && <section className="card"><p className="muted">Ainda não há registros. Converse com a CTN.IA ou crie uma proposta musical depois de configurar a base de dados.</p></section>}
    <section className="cloud-history-list">{items.map((item) => <article className="card cloud-history-item" key={item.id}><div className="history-item-heading"><span className="eyebrow">{item.category.toUpperCase()}</span><time>{new Date(item.createdAt).toLocaleString('pt-BR')}</time></div><strong>{item.prompt}</strong><p>{item.content}</p></article>)}</section>
  </main>;
}
