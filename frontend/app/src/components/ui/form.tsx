import { forwardRef } from 'react';
import type {
  InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode,
} from 'react';

const baseField = {
  width: '100%', padding: '8px 12px', fontSize: 'var(--fs-14)',
  fontFamily: 'var(--font-body)', color: 'var(--ink)', background: 'var(--bg-inset)',
  border: '1px solid var(--line)', borderRadius: 'var(--radius-sm)', outline: 'none',
} as const;

export function Field({
  label, hint, error, htmlFor, children, required,
}: {
  label: string; hint?: string; error?: string; htmlFor?: string;
  children: ReactNode; required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block' }}>
      <div style={{ fontSize: 'var(--fs-13)', fontWeight: 500, color: 'var(--ink-2)', marginBottom: 6 }}>
        {label}{required && <span style={{ color: 'var(--danger)' }}> *</span>}
      </div>
      {children}
      {error
        ? <div style={{ fontSize: 'var(--fs-12)', color: 'var(--danger)', marginTop: 5 }}>{error}</div>
        : hint
          ? <div style={{ fontSize: 'var(--fs-12)', color: 'var(--ink-3)', marginTop: 5 }}>{hint}</div>
          : null}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ invalid, style, ...rest }, ref) {
    return (
      <input
        ref={ref}
        style={{ ...baseField, borderColor: invalid ? 'var(--danger)' : 'var(--line)', ...style }}
        {...rest}
      />
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ style, ...rest }, ref) {
    return <textarea ref={ref} style={{ ...baseField, resize: 'vertical', minHeight: 88, ...style }} {...rest} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ style, children, ...rest }, ref) {
    return (
      <select ref={ref} style={{ ...baseField, cursor: 'pointer', ...style }} {...rest}>
        {children}
      </select>
    );
  },
);
