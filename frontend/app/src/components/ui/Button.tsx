import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, CSSProperties } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
}

const sizeStyle: Record<Size, CSSProperties> = {
  sm: { padding: '6px 12px', fontSize: 'var(--fs-13)' },
  md: { padding: '8px 16px', fontSize: 'var(--fs-14)' },
  lg: { padding: '12px 20px', fontSize: 'var(--fs-16)' },
};

const variantStyle: Record<Variant, CSSProperties> = {
  primary: { background: 'var(--teal-bright)', color: '#fff', border: '1px solid var(--teal-bright)' },
  secondary: { background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--line)' },
  ghost: { background: 'transparent', color: 'var(--ink-2)', border: '1px solid transparent' },
  danger: { background: 'var(--danger)', color: '#fff', border: '1px solid var(--danger)' },
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, block, disabled, style, children, ...rest },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      disabled={isDisabled}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontFamily: 'var(--font-body)', fontWeight: 500, borderRadius: 'var(--radius-md)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.55 : 1,
        transition: 'background var(--dur-fast) var(--ease-out), opacity var(--dur-fast)',
        width: block ? '100%' : undefined,
        ...sizeStyle[size], ...variantStyle[variant], ...style,
      }}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden
          style={{
            width: 14, height: 14, borderRadius: '50%',
            border: '2px solid currentColor', borderTopColor: 'transparent',
            display: 'inline-block', animation: 'pg-spin 0.7s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  );
});
