import type { CSSProperties, ReactNode } from 'react';

export function Card({ children, style, padding = 18 }: { children: ReactNode; style?: CSSProperties; padding?: number }) {
  return (
    <div
      style={{
        background: 'var(--bg-inset)', border: '1px solid var(--line)',
        borderRadius: 'var(--radius-md)', padding, ...style,
      }}
    >
      {children}
    </div>
  );
}

export function SectionCard({
  title, aside, children, style,
}: {
  title: string; aside?: ReactNode; children: ReactNode; style?: CSSProperties;
}) {
  return (
    <Card style={style}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
        <h3 style={{ fontSize: 'var(--fs-18)', fontWeight: 600, fontFamily: 'var(--font-body)', margin: 0 }}>{title}</h3>
        {aside}
      </div>
      {children}
    </Card>
  );
}
