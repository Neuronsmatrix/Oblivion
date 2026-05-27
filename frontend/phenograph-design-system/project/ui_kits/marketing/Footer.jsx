function Footer() {
  const cols = [
    { title: 'Product', links: ['Overview', 'Clinical workflow', 'Integrations', 'Security', 'Changelog'] },
    { title: 'Evidence', links: ['Publications', 'Validation', 'HPO alignment', 'Limitations'] },
    { title: 'Company', links: ['About', 'Research ethics', 'Careers', 'Contact'] },
    { title: 'Legal', links: ['Privacy', 'Terms', 'DPA', 'Responsible use'] },
  ];
  return (
    <footer style={{ borderTop: '1px solid var(--line)', padding: '64px 48px 32px', background: 'var(--paper)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr repeat(4, 1fr)', gap: 48 }}>
          <div>
            <img src="../../assets/logo.svg" style={{ height: 30 }} />
            <p style={{ fontSize: 13, color: 'var(--ink-3)', maxWidth: 260, marginTop: 14, lineHeight: 1.5 }}>
              Computational dysmorphology for clinical genetics.
            </p>
          </div>
          {cols.map(col => (
            <div key={col.title}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>{col.title}</div>
              {col.links.map(l => (
                <div key={l} style={{ marginBottom: 10 }}>
                  <a href="#" style={{ fontSize: 14, color: 'var(--ink-2)', textDecoration: 'none' }}>{l}</a>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 56, paddingTop: 24, borderTop: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)',
        }}>
          <div>© 2026 Phenograph, Inc. Not a diagnostic device. For clinical decision support only.</div>
          <div>SOC 2 · HIPAA · GDPR</div>
        </div>
      </div>
    </footer>
  );
}
window.Footer = Footer;
