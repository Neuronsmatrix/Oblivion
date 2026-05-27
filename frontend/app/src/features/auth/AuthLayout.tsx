import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function AuthLayout({ title, subtitle, children, footer }: {
  title: string; subtitle: string; children: ReactNode; footer: ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--paper)', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <Link to="/" style={{ display: 'inline-flex', marginBottom: 28 }}>
          <img src="/assets/logo.svg" alt="Phenograph" style={{ height: 30 }} />
        </Link>
        <h1 style={{ fontSize: 'var(--fs-30)', marginBottom: 8 }}>{title}</h1>
        <p style={{ fontSize: 'var(--fs-15, 0.95rem)', color: 'var(--ink-2)', marginBottom: 28 }}>{subtitle}</p>
        <div style={{ background: 'var(--bg-inset)', border: '1px solid var(--line)', borderRadius: 'var(--radius-lg)', padding: 28 }}>
          {children}
        </div>
        <div style={{ marginTop: 20, fontSize: 'var(--fs-14)', color: 'var(--ink-2)', textAlign: 'center' }}>
          {footer}
        </div>
      </div>
    </div>
  );
}
