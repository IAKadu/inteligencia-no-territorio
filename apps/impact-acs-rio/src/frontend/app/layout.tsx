import type { Metadata } from 'next';
import './globals.css';
import { Topbar } from '@/components/topbar';

export const metadata: Metadata = {
  title: 'ACS Inteligente — SMS Rio',
  description: 'Apoio à decisão para Agentes Comunitários de Saúde',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Topbar />
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
