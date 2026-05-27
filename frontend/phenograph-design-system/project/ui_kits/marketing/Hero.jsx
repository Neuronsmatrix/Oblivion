function Hero() {
  return (
    <section style={{
      maxWidth: 1200, margin: '0 auto', padding: '96px 48px 64px',
      display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 64, alignItems: 'center',
    }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 20 }}>Computational dysmorphology</div>
        <h1 style={{ fontSize: 60, lineHeight: 1.05, letterSpacing: '-0.025em', marginBottom: 20 }}>
          Phenotype,<br/>precisely read.
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--ink-2)', maxWidth: 520, marginBottom: 28 }}>
          Phenograph identifies morphological features from a frontal facial image and ranks
          candidate syndromes against the HPO ontology. Built for clinical geneticists and
          rare-disease specialists.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <a href="#" style={{
            padding: '12px 20px', background: 'var(--teal-bright)', color: '#fff',
            textDecoration: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500,
          }}>Request clinical access</a>
          <a href="#" style={{
            padding: '12px 20px', background: 'transparent', color: 'var(--ink)',
            textDecoration: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500,
            border: '1px solid var(--ink)',
          }}>Read the evidence</a>
        </div>
        <div style={{ marginTop: 36, display: 'flex', gap: 32, fontSize: 13, color: 'var(--ink-3)' }}>
          <span>HIPAA-aligned</span>
          <span>SOC 2 Type II</span>
          <span>GDPR compliant</span>
        </div>
      </div>
      <div style={{
        background: '#f1ede3', borderRadius: 16, padding: 24, border: '1px solid var(--line)',
        aspectRatio: '4/5',
      }}>
        <img src="../../assets/landmarks.svg" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
      </div>
    </section>
  );
}
window.Hero = Hero;
