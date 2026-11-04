"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type AdminStatus = { appName: string; openaiConfigured: boolean; model: string; adminConfigured: boolean; note: string };

export default function AdminPage() {
  const router = useRouter();
  const [status, setStatus] = useState<AdminStatus | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/status').then(async (response) => {
      if (response.status === 401) { router.replace('/admin/login'); return; }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao carregar painel.');
      setStatus(data);
    }).catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar painel.'));
  }, [router]);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
  }

  return <main className="container"><section className="card"><div className="admin-heading"><div><span className="tag">CTN.IA</span><h1>Painel administrativo</h1></div><button className="secondary-button" onClick={logout}>Sair</button></div>{error && <div className="result-box">{error}</div>}{!status && !error && <p className="muted">Carregando configurações...</p>}{status && <><p className="muted">Estado das integrações do servidor. Chaves secretas nunca são exibidas aqui.</p><div className="status-grid"><div className="result-box"><strong>OpenAI</strong><br />{status.openaiConfigured ? 'Configurada' : 'Falta configurar OPENAI_API_KEY'}</div><div className="result-box"><strong>Modelo de chat</strong><br />{status.model}</div><div className="result-box"><strong>Autenticação administrativa</strong><br />{status.adminConfigured ? 'Configurada' : 'Incompleta'}</div></div><h2>Como adicionar sua chave OpenAI</h2><ol className="instructions"><li>Crie uma chave na plataforma OpenAI: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer">platform.openai.com/api-keys</a>.</li><li>No computador, abra o arquivo <code>.env.local</code> na pasta do projeto e defina <code>OPENAI_API_KEY=sua_chave</code>.</li><li>Se publicou o site, cadastre <code>OPENAI_API_KEY</code> nas variáveis de ambiente do serviço de hospedagem e faça novo deploy.</li><li>Reinicie o servidor local com <code>npm run dev</code>. Nunca cole ou publique a chave no chat, no código do navegador ou no GitHub.</li></ol><p className="muted">A chave é cobrada conforme o uso e o modelo. Voz do navegador funciona sem OpenAI. A geração de áudio musical exige um provedor de música separado; a chave OpenAI gera letra e arranjo, não uma música cantada pronta.</p></>}</section></main>;
}
