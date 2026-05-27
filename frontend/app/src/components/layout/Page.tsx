import type { ReactNode } from 'react';

export function Page({ children, max = 1280 }: { children: ReactNode; max?: number }) {
  return <div style={{ padding: '32px 24px', maxWidth: max, margin: '0 auto' }}>{children}</div>;
}

export function PageHeader({ eyebrow, title, actions }: { eyebrow?: string; title: string; actions?: ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
      <div>
        {eyebrow && <div className="eyebrow" style={{ marginBottom: 6 }}>{eyebrow}</div>}
        <h1 style={{ fontSize: 'var(--fs-36)', margin: 0, letterSpacing: '-0.015em' }}>{title}</h1>
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}

/** Short helper for formatting ISO timestamps in the warm, quiet house style. */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatAge(age?: number | null): string {
  if (age === null || age === undefined) return '—';
  return `${age}y`;
}
