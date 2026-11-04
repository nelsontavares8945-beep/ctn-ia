"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, ArrowLeft, KeyRound, LogOut, ShieldCheck, Sparkles } from 'lucide-react';

type AdminStatus = {
  appName: string;
  geminiConfigured: boolean;
  model: string;
  adminConfigured: boolean;
  note: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [error, setError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch('/api/admin/status', { cache: 'no-store' })
      .then(async (response) => {
        if (response.status === 401) {
          router.replace('/admin/login');
          return;
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao carregar painel.');
        setStatus(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar painel.'));
  }, [router]);

  async function logout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
  }

  return (
    <main className="container admin-container">
      <section className="admin-welcome">
        <div>
          <span className="eyebrow"><ShieldCheck size={15} /> ÁREA PROTEGIDA</span>
          <h1>Painel de controle</h1>
          <p>Gerencie a configuração da CTN.IA e confira o estado dos serviços.</p>
        </div>
        <div className="admin-actions">
          <a className="secondary-button" href="/"><ArrowLeft size={17} /> Voltar ao app</a>
          <button className="secondary-button" onClick={logout} disabled={loggingOut}><LogOut size={17} /> {loggingOut ? 'Saindo...' : 'Sair'}</button>
        </div>
      </section>

      {error && <div className="result-box" role="alert">{error}</div>}
      {!status && !error && <section className="card"><p className="muted">Carregando configurações seguras...</p></section>}

      {status && <>
        <section className="admin-status-grid" aria-label="Estado dos serviços">
          <article className="admin-status-card">
            <span className="admin-status-icon"><Activity size={20} /></span>
            <span className="status-label">Aplicação</span>
            <strong>{status.appName}</strong>
            <small>Serviço ativo</small>
          </article>
          <article className="admin-status-card">
            <span className="admin-status-icon"><Sparkles size={20} /></span>
            <span className="status-label">Inteligência artificial</span>
            <strong>{status.geminiConfigured ? 'Conectada' : 'Pendente'}</strong>
            <small>{status.geminiConfigured ? `Modelo: ${status.model}` : 'Adicione GEMINI_API_KEY no servidor'}</small>
          </article>
          <article className="admin-status-card">
            <span className="admin-status-icon"><ShieldCheck size={20} /></span>
            <span className="status-label">Proteção administrativa</span>
            <strong>{status.adminConfigured ? 'Configurada' : 'Incompleta'}</strong>
            <small>Credenciais e segredo ficam no servidor</small>
          </article>
        </section>

        <section className="card admin-guide">
          <div className="card-header"><KeyRound /><h2>Configurar a chave Gemini</h2></div>
          <p className="muted">A chave é um segredo privado: não a envie pelo chat, não a coloque no navegador e não a salve no repositório.</p>
          <ol className="instructions">
            <li>Gere uma chave em <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noreferrer">Google AI Studio</a>. Escolha o modelo e a cota gratuita do Google AI Studio; há limites de uso.</li>
            <li><strong>Para rodar localmente:</strong> crie `.env.local` na raiz e adicione `GEMINI_API_KEY=sua_chave`. Reinicie `npm run dev`.</li>
            <li><strong>Na Vercel:</strong> abra o projeto em Settings → Environment Variables, adicione `GEMINI_API_KEY` e faça um novo deploy.</li>
            <li>Configure também `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `AUTH_SECRET` no ambiente do servidor. Use uma senha forte e um segredo aleatório com pelo menos 32 caracteres.</li>
          </ol>
          <div className="security-note"><ShieldCheck size={18} /><span>O painel mostra apenas se a chave está configurada; o valor nunca é enviado para esta página.</span></div>
        </section>
      </>}
    </main>
  );
}
