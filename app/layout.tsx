import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CTN.IA',
  description: 'Sistema de inteligência artificial com chat, voz, imagens, documentos e música',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
