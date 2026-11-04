import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'CTN.IA',
  description: 'Sistema de inteligência artificial com chat, voz, imagens, documentos e música',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="site-nav">
          <Link className="brand" href="/" aria-label="CTN.IA início">
            <span className="brand-mark">C</span><span>CTN<span className="brand-accent">.IA</span></span>
          </Link>
          <nav aria-label="Navegação principal">
            <Link href="/">Início</Link>
            <Link href="/music">Estúdio de música</Link>
            <Link href="/history">Histórico</Link>
            <Link className="nav-admin" href="/admin/login">Painel</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
