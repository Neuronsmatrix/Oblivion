function CaseDetail({ caseData, onBack }) {
  const c = caseData;
  return (
    <div style={{ padding: '24px', maxWidth: 1440, margin: '0 auto' }}>
      <button onClick={onBack} style={{
        background: 'transparent', border: 'none', color: 'var(--ink-2)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '4px 0', marginBottom: 16,
      }}>
        <i data-lucide="chevron-left" style={{ width: 14, height: 14 }}></i>All cases
      </button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-3)' }}>Case {c.id}</span>
            <StatusPill status={c.status} />
          </div>
          <h1 style={{ fontSize: 30, margin: 0, letterSpacing: '-0.015em' }}>{c.topCandidate}</h1>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 13, color: 'var(--ink-2)' }}>
            <span>MRN <span style={{ fontFamily: 'var(--font-mono)' }}>{c.mrn}</span></span>
            <span>·</span>
            <span>{c.age} · {c.sex}</span>
            <span>·</span>
            <span>Uploaded {c.date} · 2026</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '8px 14px', background: 'transparent', border: '1px solid var(--line)', borderRadius: 8, fontSize: 14, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i data-lucide="download" style={{ width: 14, height: 14 }}></i>Export FHIR
          </button>
          <button style={{ padding: '8px 14px', background: 'var(--teal-bright)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <i data-lucide="check" style={{ width: 14, height: 14 }}></i>Finalize review
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
        {/* Main column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Landmark viewer */}
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 8, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-body)', margin: 0 }}>Landmark analysis</h3>
              <div style={{ display: 'flex', gap: 4, padding: 3, background: 'var(--paper-2)', borderRadius: 6 }}>
                {['Landmarks', 'Features', 'Both'].map((t, i) => (
                  <button key={t} style={{
                    padding: '4px 10px', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 500,
                    background: i === 0 ? '#fff' : 'transparent', color: i === 0 ? 'var(--ink)' : 'var(--ink-3)',
                    cursor: 'pointer', boxShadow: i === 0 ? '0 1px 2px rgba(21,40,47,0.06)' : 'none',
                  }}>{t}</button>
                ))}
              </div>
            </div>
            <div style={{ background: 'var(--paper-2)', borderRadius: 8, padding: 24, display: 'flex', justifyContent: 'center' }}>
              <img src="../../assets/landmarks.svg" style={{ maxHeight: 420, objectFit: 'contain' }} />
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 20, fontSize: 12, color: 'var(--ink-3)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal-bright)' }}></span>
                Landmark point
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', border: '1px solid var(--moss)' }}></span>
                Active feature
              </span>
              <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)' }}>127 landmarks · 0.8mm avg error</span>
            </div>
          </div>

          {/* Features */}
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 8, padding: 18 }}>
            <FeatureChips />
          </div>

          {/* Clinical notes */}
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 8, padding: 18 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-body)', margin: '0 0 12px' }}>Clinical notes</h3>
            <div style={{ border: '1px solid var(--line)', borderRadius: 6, padding: 12, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6, background: '#faf8f2' }}>
              Patient referred for evaluation of short stature and mild developmental delay. Family history notable for maternal cousin with congenital heart defect. Echocardiogram pending.
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SyndromePanel />

          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 8, padding: 18 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-body)', margin: '0 0 12px' }}>Next steps</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--ink-2)' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <i data-lucide="square" style={{ width: 14, height: 14, color: 'var(--ink-3)', flexShrink: 0, marginTop: 2 }}></i>
                <span>Order targeted RASopathy gene panel</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <i data-lucide="square" style={{ width: 14, height: 14, color: 'var(--ink-3)', flexShrink: 0, marginTop: 2 }}></i>
                <span>Echocardiogram follow-up</span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <i data-lucide="square" style={{ width: 14, height: 14, color: 'var(--ink-3)', flexShrink: 0, marginTop: 2 }}></i>
                <span>Genetic counseling referral</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
window.CaseDetail = CaseDetail;
