const MOCK_CASES = [
  { id: '2026-0481', mrn: '20481', age: '4y 2m', sex: 'F', date: 'Apr 17', status: 'complete', topCandidate: 'Noonan syndrome', prob: 0.41 },
  { id: '2026-0480', mrn: '17293', age: '11y',   sex: 'M', date: 'Apr 17', status: 'review',   topCandidate: 'Williams syndrome', prob: 0.58 },
  { id: '2026-0479', mrn: '20114', age: '2y 8m', sex: 'F', date: 'Apr 16', status: 'complete', topCandidate: 'Kabuki syndrome', prob: 0.33 },
  { id: '2026-0478', mrn: '18821', age: '6y 5m', sex: 'M', date: 'Apr 16', status: 'low-res',  topCandidate: '—', prob: null },
  { id: '2026-0477', mrn: '19003', age: '1y 3m', sex: 'F', date: 'Apr 15', status: 'complete', topCandidate: 'CHARGE syndrome', prob: 0.29 },
  { id: '2026-0476', mrn: '16442', age: '8y',    sex: 'M', date: 'Apr 15', status: 'complete', topCandidate: 'Cornelia de Lange', prob: 0.52 },
  { id: '2026-0475', mrn: '21010', age: '3y 1m', sex: 'F', date: 'Apr 14', status: 'review',   topCandidate: 'Rubinstein–Taybi', prob: 0.37 },
  { id: '2026-0474', mrn: '19887', age: '5y 7m', sex: 'M', date: 'Apr 14', status: 'complete', topCandidate: 'Smith–Magenis', prob: 0.44 },
];
window.MOCK_CASES = MOCK_CASES;

const statusStyle = {
  'complete': { bg: '#e8efdd', fg: '#3f7a3a', label: 'Complete' },
  'review':   { bg: '#dde8e7', fg: '#3a4a50', label: 'In review' },
  'low-res':  { bg: '#f5ecd0', fg: '#8a6a1f', label: 'Low resolution' },
  'failed':   { bg: '#f4dad3', fg: '#8a3a2e', label: 'Failed' },
};

function StatusPill({ status }) {
  const s = statusStyle[status] || statusStyle.complete;
  return <span style={{ fontSize: 12, fontWeight: 500, padding: '2px 9px', background: s.bg, color: s.fg, borderRadius: 9999 }}>{s.label}</span>;
}
window.StatusPill = StatusPill;

function CaseList({ onOpen }) {
  const [filter, setFilter] = React.useState('all');
  const filters = [
    { id: 'all',      label: 'All cases', count: 248 },
    { id: 'mine',     label: 'My cases',  count: 42 },
    { id: 'review',   label: 'Needs review', count: 6 },
    { id: 'flagged',  label: 'Flagged',  count: 3 },
  ];
  return (
    <div style={{ padding: '32px 24px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>Workspace</div>
          <h1 style={{ fontSize: 36, margin: 0, letterSpacing: '-0.015em' }}>Cases</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '8px 12px', background: 'transparent', border: '1px solid var(--line)', borderRadius: 8, fontSize: 14, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i data-lucide="filter" style={{ width: 14, height: 14 }}></i>Filter
          </button>
          <button style={{ padding: '8px 12px', background: 'transparent', border: '1px solid var(--line)', borderRadius: 8, fontSize: 14, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i data-lucide="download" style={{ width: 14, height: 14 }}></i>Export
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--line)' }}>
        {filters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)} style={{
            padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: 500,
            color: filter === f.id ? 'var(--ink)' : 'var(--ink-3)',
            borderBottom: filter === f.id ? '2px solid var(--teal-bright)' : '2px solid transparent',
            marginBottom: -1,
          }}>
            {f.label}<span style={{ marginLeft: 6, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-4)' }}>{f.count}</span>
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '140px 100px 70px 60px 1fr 140px 120px 40px', gap: 16, padding: '10px 16px', background: '#faf8f2', fontSize: 12, color: 'var(--ink-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid var(--line)' }}>
          <div>Case ID</div><div>MRN</div><div>Age</div><div>Sex</div><div>Top candidate</div><div>Status</div><div>Date</div><div></div>
        </div>
        {MOCK_CASES.map(c => (
          <div key={c.id} onClick={() => onOpen(c)} style={{
            display: 'grid', gridTemplateColumns: '140px 100px 70px 60px 1fr 140px 120px 40px', gap: 16,
            padding: '14px 16px', borderBottom: '1px solid var(--line)', alignItems: 'center',
            cursor: 'pointer', fontSize: 14, transition: 'background 150ms',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#faf8f2'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{c.id}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-2)' }}>{c.mrn}</div>
            <div style={{ color: 'var(--ink-2)' }}>{c.age}</div>
            <div style={{ color: 'var(--ink-2)' }}>{c.sex}</div>
            <div>
              <div style={{ color: 'var(--ink)' }}>{c.topCandidate}</div>
              {c.prob !== null && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal-bright)' }}>p = {c.prob.toFixed(2)}</div>}
            </div>
            <div><StatusPill status={c.status} /></div>
            <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>{c.date}</div>
            <div style={{ color: 'var(--ink-3)', display: 'flex', justifyContent: 'flex-end' }}>
              <i data-lucide="chevron-right" style={{ width: 16, height: 16 }}></i>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
window.CaseList = CaseList;
