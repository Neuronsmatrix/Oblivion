import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open, onClose, title, children, footer,
}: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(21,40,47,0.32)',
        display: 'grid', placeItems: 'center', zIndex: 900, padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480, background: 'var(--bg-inset)',
          borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-2)', overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <h3 style={{ fontSize: 'var(--fs-18)', fontWeight: 600, fontFamily: 'var(--font-body)', margin: 0 }}>{title}</h3>
          <button onClick={onClose} aria-label="Close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
        {footer && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 20px', borderTop: '1px solid var(--line)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
