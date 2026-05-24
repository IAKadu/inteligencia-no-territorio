'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Dashboard' },
  { href: '/pacientes', label: 'Pacientes' },
  { href: '/agenda', label: 'Agenda' },
  { href: '/chat', label: 'Chat IA' },
];

export function Topbar() {
  const path = usePathname();
  return (
    <header>
      <div
        style={{ background: 'var(--grey-bar)' }}
        className="text-white px-6 py-2 flex items-center text-[11px] font-bold uppercase tracking-[0.15em]"
      >
        <span className="opacity-70">Prefeitura.Rio</span>
        <span className="ml-auto opacity-60">Hackathon Claude Impact 2026</span>
      </div>
      <div
        style={{ background: 'var(--blue-primary)' }}
        className="text-white px-6 py-4 flex items-center justify-between"
      >
        <div className="flex items-baseline gap-3">
          <span className="text-xl font-black">
            Prefeitura <span style={{ color: 'var(--green-accent)' }}>RIO</span>
          </span>
          <span className="opacity-80 text-base">· Saúde · ACS Inteligente</span>
        </div>
        <nav className="flex gap-6">
          {NAV.map(n => (
            <Link
              key={n.href}
              href={n.href}
              className="t-nav-link transition-opacity"
              style={{
                color: '#ffffff',
                opacity: path === n.href ? 1 : 0.65,
              }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
