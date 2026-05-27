function EvidenceBand() {
  return (
    <section style={{ background: 'var(--midnight)', color: '#f1ede3', padding: '80px 48px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--moss)', fontWeight: 500, marginBottom: 12 }}>
          Evidence
        </div>
        <h2 style={{ fontSize: 36, letterSpacing: '-0.015em', color: '#f1ede3', maxWidth: 720, marginBottom: 48 }}>
          Validated against 12,000+ genetically confirmed cases across 41 institutions.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48, borderTop: '1px solid #2a3d44', paddingTop: 36 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--moss)' }}>92%</div>
            <div style={{ fontSize: 14, color: '#c7c0b0', marginTop: 10, maxWidth: 260 }}>Top-5 accuracy on blind validation set of rare syndrome cases.</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--moss)' }}>4,317</div>
            <div style={{ fontSize: 14, color: '#c7c0b0', marginTop: 10, maxWidth: 260 }}>Syndromes covered in the linked knowledge graph. HPO-aligned.</div>
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1, color: 'var(--moss)' }}>17</div>
            <div style={{ fontSize: 14, color: '#c7c0b0', marginTop: 10, maxWidth: 260 }}>Peer-reviewed publications. Nature Genetics, AJHG, JAMA Pediatrics.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
window.EvidenceBand = EvidenceBand;
