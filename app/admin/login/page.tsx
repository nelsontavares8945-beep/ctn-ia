"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Não foi possível entrar.');
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao entrar.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="container"><section className="card auth-card"><span className="tag">CTN.IA</span><h1>Área administrativa</h1><p className="muted">Entre com as credenciais definidas no servidor.</p><form onSubmit={submit} className="auth-form"><label>E-mail<input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} /></label><label>Senha<input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>{error && <div className="result-box" role="alert">{error}</div>}<button className="primary-button" disabled={busy}>{busy ? 'Entrando...' : 'Entrar'}</button></form><a href="/">Voltar ao início</a></section></main>;
}
