import { createContext, useCallback, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { Check, TriangleAlert, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';
interface Toast { id: number; tone: ToastTone; message: string }

interface ToastApi {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const toneStyle: Record<ToastTone, { bg: string; fg: string; icon: ReactNode }> = {
  success: { bg: 'var(--success-bg)', fg: 'var(--success)', icon: <Check size={16} strokeWidth={2} /> },
  error: { bg: 'var(--danger-bg)', fg: 'var(--danger)', icon: <TriangleAlert size={16} strokeWidth={2} /> },
  info: { bg: 'var(--info-bg)', fg: 'var(--info)', icon: <Check size={16} strokeWidth={2} /> },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, tone, message }]);
    setTimeout(() => remove(id), 4500);
  }, [remove]);

  const api: ToastApi = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 1000 }}>
        {toasts.map((t) => {
          const s = toneStyle[t.tone];
          return (
            <div
              key={t.id}
              role="status"
              style={{
                display: 'flex', alignItems: 'center', gap: 10, minWidth: 260, maxWidth: 380,
                padding: '12px 14px', background: 'var(--bg-inset)', border: '1px solid var(--line)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-2)', fontSize: 'var(--fs-14)',
                color: 'var(--ink)',
              }}
            >
              <span style={{ display: 'inline-flex', width: 24, height: 24, borderRadius: '50%', background: s.bg, color: s.fg, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {s.icon}
              </span>
              <span style={{ flex: 1 }}>{t.message}</span>
              <button onClick={() => remove(t.id)} aria-label="Dismiss" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
