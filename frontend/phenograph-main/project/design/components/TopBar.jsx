function TopBar({ variant, setVariant, dark }) {
  return (
    <header className={"topbar" + (dark ? " dark" : "")}>
      <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <img src={dark ? 'assets/logo-mark.svg' : 'assets/logo.svg'} alt="Phenograph"
             style={{ height: 26, filter: dark ? 'invert(92%) sepia(9%) saturate(200%) hue-rotate(12deg) brightness(100%)' : 'none' }} />
        {dark && (
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 18, color: 'var(--paper-2)', letterSpacing: '-0.01em' }}>
            Phenograph
          </span>
        )}
      </a>

      <div className="nav-links" style={{ gap: 32 }}>
        {['Product', 'Evidence', 'For clinicians', 'Research'].map(l => (
          <a key={l} href="#" className="nav-link muted">{l}</a>
        ))}

        <div className="variant-toggle" role="tablist" aria-label="Visual direction">
          <button className={variant === 'A' ? 'active' : ''} onClick={() => setVariant('A')}>A · Editorial</button>
          <button className={variant === 'B' ? 'active' : ''} onClick={() => setVariant('B')}>B · Cinematic</button>
        </div>

        <a href="#" className="nav-link" style={{
          padding: '8px 14px',
          borderRadius: 8,
          background: 'var(--teal-bright)',
          color: '#fff',
        }}>Request access</a>
      </div>
    </header>
  );
}
window.TopBar = TopBar;
