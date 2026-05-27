const MOCK_SYNDROMES = [
  { name: 'Noonan syndrome',      gene: 'PTPN11', prob: 0.41, matched: 12, total: 18 },
  { name: 'Costello syndrome',    gene: 'HRAS',   prob: 0.18, matched: 8,  total: 16 },
  { name: 'Cardiofaciocutaneous', gene: 'BRAF',   prob: 0.14, matched: 7,  total: 15 },
  { name: 'Williams syndrome',    gene: 'ELN',    prob: 0.09, matched: 6,  total: 14 },
  { name: 'Kabuki syndrome',      gene: 'KMT2D',  prob: 0.06, matched: 5,  total: 19 },
  { name: 'Aarskog syndrome',     gene: 'FGD1',   prob: 0.04, matched: 4,  total: 12 },
];

function SyndromePanel() {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 8, padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-body)', margin: 0 }}>Candidate syndromes</h3>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-3)' }}>posterior</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {MOCK_SYNDROMES.map((s, i) => (
          <div key={s.name} style={{ padding: '12px 0', borderBottom: i < MOCK_SYNDROMES.length - 1 ? '1px solid var(--line)' : 'none' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                  <em style={{ fontFamily: 'var(--font-mono)', fontStyle: 'italic' }}>{s.gene}</em> · {s.matched}/{s.total} features
                </div>
              </div>
              <div style={{ flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: i === 0 ? 'var(--teal-bright)' : 'var(--ink-2)' }}>
                {s.prob.toFixed(2)}
              </div>
            </div>
            <div style={{ height: 3, background: 'var(--paper-2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, (s.prob / 0.41) * 100)}%`, height: '100%', background: i === 0 ? 'var(--teal-bright)' : 'var(--moss)' }} />
            </div>
          </div>
        ))}
      </div>
      <button style={{ marginTop: 16, width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--line)', borderRadius: 6, fontSize: 13, color: 'var(--ink-2)', cursor: 'pointer' }}>
        View all 23 candidates
      </button>
    </div>
  );
}
window.SyndromePanel = SyndromePanel;
