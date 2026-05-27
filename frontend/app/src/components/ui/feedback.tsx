import type { CSSProperties, ReactNode } from 'react';
import { Inbox, TriangleAlert } from 'lucide-react';
import type { CaseStatus } from '../../lib/api/types';

// ── StatusPill ────────────────────────────────────────────────────────────
const statusStyle: Record<CaseStatus, { bg: string; fg: string; label: string; pulse?: boolean }> = {
  pending: { bg: 'var(--paper-2)', fg: 'var(--ink-3)', label: 'Pending' },
  processing: { bg: 'var(--info-bg)', fg: 'var(--info)', label: 'Processing', pulse: true },
  completed: { bg: 'var(--success-bg)', fg: 'var(--success)', label: 'Completed' },
  failed: { bg: 'var(--danger-bg)', fg: 'var(--danger)', label: 'Failed' },
};

export function StatusPill({ status }: { status: CaseStatus }) {
  const s = statusStyle[status] ?? statusStyle.pending;
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 'var(--fs-12)', fontWeight: 500, padding: '2px 9px',
        background: s.bg, color: s.fg, borderRadius: 'var(--radius-full)',
        animation: s.pulse ? 'pg-pulse 1.6s var(--ease-in-out) infinite' : undefined,
      }}
    >
      {s.label}
    </span>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'mono' }) {
  const tones: Record<string, CSSProperties> = {
    neutral: { background: 'var(--paper-2)', color: 'var(--ink-2)' },
    accent: { background: 'var(--info-bg)', color: 'var(--info)' },
    mono: { background: 'transparent', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', border: '1px solid var(--line)' },
  };
  return (
    <span style={{ fontSize: 'var(--fs-12)', padding: '2px 8px', borderRadius: 'var(--radius-full)', ...tones[tone] }}>
      {children}
    </span>
  );
}

// ── ConfidenceBar ───────────────────────────────────────────────────────────
export function ConfidenceBar({ value, top = false, height = 4 }: { value: number; top?: boolean; height?: number }) {
  return (
    <div style={{ height, background: 'var(--paper-2)', borderRadius: 2, overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.min(100, Math.max(0, value * 100))}%`, height: '100%',
          background: top ? 'var(--teal-bright)' : 'var(--moss)',
          transition: 'width var(--dur-slow) var(--ease-out)',
        }}
      />
    </div>
  );
}

// ── Spinner ─────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, label }: { size?: number; label?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: 'var(--ink-3)' }} role="status">
      <span
        aria-hidden
        style={{
          width: size, height: size, borderRadius: '50%',
          border: '2px solid var(--line)', borderTopColor: 'var(--teal-bright)',
          display: 'inline-block', animation: 'pg-spin 0.7s linear infinite',
        }}
      />
      {label && <span style={{ fontSize: 'var(--fs-13)' }}>{label}</span>}
    </span>
  );
}

export function FullPageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--paper)' }}>
      <Spinner size={28} label={label} />
    </div>
  );
}

// ── Empty / Error states ──────────────────────────────────────────────────
function StateBlock({ icon, title, message, action }: { icon: ReactNode; title: string; message?: string; action?: ReactNode }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 24px', color: 'var(--ink-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>{icon}</div>
      <div style={{ fontSize: 'var(--fs-16)', fontWeight: 500, color: 'var(--ink-2)', marginBottom: 6 }}>{title}</div>
      {message && <p style={{ fontSize: 'var(--fs-14)', maxWidth: 380, margin: '0 auto 16px' }}>{message}</p>}
      {action}
    </div>
  );
}

export function EmptyState({ title, message, action }: { title: string; message?: string; action?: ReactNode }) {
  return <StateBlock icon={<Inbox size={28} strokeWidth={1.5} color="var(--ink-4)" />} title={title} message={message} action={action} />;
}

export function ErrorState({ title = 'Something went wrong', message, action }: { title?: string; message?: string; action?: ReactNode }) {
  return <StateBlock icon={<TriangleAlert size={28} strokeWidth={1.5} color="var(--danger)" />} title={title} message={message} action={action} />;
}
