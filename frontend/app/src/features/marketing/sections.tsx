// Calmer marketing-kit sections, ported from phenograph-design-system.
import { Link } from 'react-router-dom';
import { Dna, FileSearch, ScanFace } from 'lucide-react';

export function MarketingNav() {
  return (
    <nav
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 48px', borderBottom: '1px solid var(--line)',
        position: 'sticky', top: 0, zIndex: 10,
        background: 'rgba(250,248,242,0.82)', backdropFilter: 'blur(10px) saturate(140%)',
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/assets/logo.svg" style={{ height: 30 }} alt="Phenograph" />
      </Link>
      <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
        {['Product', 'Evidence', 'For clinicians', 'Research'].map((l) => (
          <a key={l} href="#" style={{ color: 'var(--ink-2)', textDecoration: 'none', fontSize: 'var(--fs-14)', fontWeight: 500 }}>{l}</a>
        ))}
        <Link to="/login" style={{ color: 'var(--ink)', textDecoration: 'none', fontSize: 'var(--fs-14)', fontWeight: 500, padding: '8px 14px', border: '1px solid var(--line)', borderRadius: 'var(--radius-md)' }}>Sign in</Link>
        <Link to="/register" style={{ color: '#fff', textDecoration: 'none', fontSize: 'var(--fs-14)', fontWeight: 500, padding: '8px 14px', background: 'var(--teal-bright)', borderRadius: 'var(--radius-md)' }}>Request access</Link>
      </div>
    </nav>
  );
}

export function FeatureGrid() {
  const features = [
    { icon: ScanFace, title: 'Landmark phenotyping', body: 'Sub-millimeter facial landmarking against a curated atlas of 127 morphological features, scored with uncertainty.' },
    { icon: Dna, title: 'Syndrome ranking', body: 'Bayesian ranking across 4,300+ syndromes linked to the Human Phenotype Ontology. Clinicians see posterior probabilities, not black-box scores.' },
    { icon: FileSearch, title: 'Clinical workflow', body: 'Case notes, features, and candidate panels export to FHIR. Integrates with existing EHRs without forcing a rebuild.' },
  ];
  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 48px', borderTop: '1px solid var(--line)' }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>What it does</div>
      <h2 style={{ fontSize: 'var(--fs-36)', letterSpacing: '-0.015em', marginBottom: 48, maxWidth: 640 }}>
        A quiet tool that extends clinical expertise — not a replacement for it.
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title}>
              <Icon size={28} strokeWidth={1.5} color="var(--teal-bright)" />
              <h3 style={{ fontSize: 'var(--fs-20)', fontWeight: 500, marginTop: 18, marginBottom: 10 }}>{f.title}</h3>
              <p style={{ fontSize: 'var(--fs-15, 0.95rem)', lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>{f.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function EvidenceBand() {
  const stats = [
    ['92%', 'Top-5 accuracy on blind validation set of rare syndrome cases.'],
    ['4,317', 'Syndromes covered in the linked knowledge graph. HPO-aligned.'],
    ['17', 'Peer-reviewed publications. Nature Genetics, AJHG, JAMA Pediatrics.'],
  ];
  return (
    <section style={{ background: 'var(--midnight)', color: '#f1ede3', padding: '80px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 'var(--fs-12)', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--moss)', fontWeight: 500, marginBottom: 12 }}>Evidence</div>
        <h2 style={{ fontSize: 'var(--fs-36)', letterSpacing: '-0.015em', color: '#f1ede3', maxWidth: 720, marginBottom: 48 }}>
          Validated against 12,000+ genetically confirmed cases across 41 institutions.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 48, borderTop: '1px solid #2a3d44', paddingTop: 36 }}>
          {stats.map(([n, label]) => (
            <div key={n}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--moss)' }}>{n}</div>
              <div style={{ fontSize: 'var(--fs-14)', color: '#c7c0b0', marginTop: 10, maxWidth: 260 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function MarketingFooter() {
  const cols = [
    { title: 'Product', links: ['Overview', 'Clinical workflow', 'Integrations', 'Security', 'Changelog'] },
    { title: 'Evidence', links: ['Publications', 'Validation', 'HPO alignment', 'Limitations'] },
    { title: 'Company', links: ['About', 'Research ethics', 'Careers', 'Contact'] },
    { title: 'Legal', links: ['Privacy', 'Terms', 'DPA', 'Responsible use'] },
  ];
  return (
    <footer style={{ borderTop: '1px solid var(--line)', padding: '64px 48px 32px', background: 'var(--paper)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.4fr) repeat(auto-fit, minmax(120px, 1fr))', gap: 48 }}>
          <div>
            <img src="/assets/logo.svg" style={{ height: 30 }} alt="Phenograph" />
            <p style={{ fontSize: 'var(--fs-13)', color: 'var(--ink-3)', maxWidth: 260, marginTop: 14, lineHeight: 1.5 }}>
              Computational dysmorphology for clinical genetics.
            </p>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <div className="eyebrow" style={{ marginBottom: 16 }}>{col.title}</div>
              {col.links.map((l) => (
                <div key={l} style={{ marginBottom: 10 }}>
                  <a href="#" style={{ fontSize: 'var(--fs-14)', color: 'var(--ink-2)', textDecoration: 'none' }}>{l}</a>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', fontSize: 'var(--fs-12)', color: 'var(--ink-3)' }}>
          <div>© 2026 Phenograph, Inc. Not a diagnostic device. For clinical decision support only.</div>
          <div>SOC 2 · HIPAA · GDPR</div>
        </div>
      </div>
    </footer>
  );
}
