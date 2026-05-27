const { useState } = React;

function Nav() {
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px 48px', borderBottom: '1px solid var(--line)',
      position: 'sticky', top: 0, zIndex: 10,
      background: 'rgba(250,248,242,0.82)', backdropFilter: 'blur(10px) saturate(140%)',
      WebkitBackdropFilter: 'blur(10px) saturate(140%)',
    }}>
      <a href="#" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
        <img src="../../assets/logo.svg" style={{ height: 30 }} alt="Phenograph" />
      </a>
      <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        {['Product', 'Evidence', 'For clinicians', 'Research'].map(l => (
          <a key={l} href="#" style={{
            color: 'var(--ink-2)', textDecoration: 'none', fontSize: 14, fontWeight: 500,
          }}>{l}</a>
        ))}
        <a href="#" style={{
          color: 'var(--ink)', textDecoration: 'none', fontSize: 14, fontWeight: 500,
          padding: '8px 14px', border: '1px solid var(--line)', borderRadius: 8,
        }}>Sign in</a>
        <a href="#" style={{
          color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 500,
          padding: '8px 14px', background: 'var(--teal-bright)', borderRadius: 8,
        }}>Request access</a>
      </div>
    </nav>
  );
}
window.Nav = Nav;
