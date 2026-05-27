const MOCK_FEATURES = [
  { hpo: 'HP:0000316', label: 'Hypertelorism',             confidence: 0.94 },
  { hpo: 'HP:0000463', label: 'Anteverted nares',           confidence: 0.88 },
  { hpo: 'HP:0000601', label: 'Hypotonic facies',           confidence: 0.81 },
  { hpo: 'HP:0000286', label: 'Epicanthus',                 confidence: 0.77 },
  { hpo: 'HP:0009748', label: 'Downslanted palpebral fissures', confidence: 0.72 },
  { hpo: 'HP:0000322', label: 'Short philtrum',             confidence: 0.64 },
  { hpo: 'HP:0000175', label: 'Cleft palate',               confidence: 0.22 },
];

function FeatureChips() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-body)', margin: 0 }}>Matched features</h3>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-3)' }}>7 of 127 in atlas</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {MOCK_FEATURES.map(f => (
          <div key={f.hpo} style={{
            display: 'grid', gridTemplateColumns: '120px 1fr 120px 60px', gap: 12,
            padding: '10px 12px', background: '#fff', border: '1px solid var(--line)', borderRadius: 6,
            alignItems: 'center', fontSize: 13,
          }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-2)' }}>{f.hpo}</div>
            <div style={{ color: 'var(--ink)' }}>{f.label}</div>
            <div style={{ height: 4, background: 'var(--paper-2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${f.confidence * 100}%`, height: '100%', background: 'var(--teal-bright)' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal-bright)', textAlign: 'right' }}>{f.confidence.toFixed(2)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
window.FeatureChips = FeatureChips;
