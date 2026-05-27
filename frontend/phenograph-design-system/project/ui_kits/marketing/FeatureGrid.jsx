function FeatureGrid() {
  const features = [
    {
      icon: 'scan-face',
      title: 'Landmark phenotyping',
      body: 'Sub-millimeter facial landmarking against a curated atlas of 127 morphological features, scored with uncertainty.',
    },
    {
      icon: 'dna',
      title: 'Syndrome ranking',
      body: 'Bayesian ranking across 4,300+ syndromes linked to the Human Phenotype Ontology. Clinicians see posterior probabilities, not black-box scores.',
    },
    {
      icon: 'file-search',
      title: 'Clinical workflow',
      body: 'Case notes, features, and candidate panels export to FHIR. Integrates with existing EHRs without forcing a rebuild.',
    },
  ];
  return (
    <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 48px', borderTop: '1px solid var(--line)' }}>
      <div className="eyebrow" style={{ marginBottom: 12 }}>What it does</div>
      <h2 style={{ fontSize: 36, letterSpacing: '-0.015em', marginBottom: 48, maxWidth: 640 }}>
        A quiet tool that extends clinical expertise — not a replacement for it.
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
        {features.map(f => (
          <div key={f.title}>
            <i data-lucide={f.icon} style={{ width: 28, height: 28, color: 'var(--teal-bright)', strokeWidth: 1.5 }}></i>
            <h3 style={{ fontSize: 22, fontWeight: 500, marginTop: 18, marginBottom: 10 }}>{f.title}</h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)', margin: 0 }}>{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
window.FeatureGrid = FeatureGrid;
