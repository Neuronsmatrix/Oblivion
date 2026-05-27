function AppShell({ children, activeView, onNav }) {
  const nav = [
    { id: 'cases',     label: 'Cases',        icon: 'folder' },
    { id: 'analyze',   label: 'New analysis', icon: 'scan-face' },
    { id: 'atlas',     label: 'Feature atlas',icon: 'microscope' },
    { id: 'syndromes', label: 'Syndromes',    icon: 'dna' },
    { id: 'exports',   label: 'Exports',      icon: 'download' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '232px 1fr', minHeight: '100vh', background: 'var(--paper)' }}>
      <aside style={{
        borderRight: '1px solid var(--line)', padding: '20px 14px',
        display: 'flex', flexDirection: 'column', gap: 4, background: '#faf8f2',
      }}>
        <div style={{ padding: '6px 10px 18px' }}>
          <img src="../../assets/logo.svg" style={{ height: 26 }} />
        </div>
        {nav.map(n => (
          <button key={n.id} onClick={() => onNav(n.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
            borderRadius: 6, border: 'none', cursor: 'pointer', textAlign: 'left',
            background: activeView === n.id ? 'rgba(6,129,118,0.10)' : 'transparent',
            color: activeView === n.id ? 'var(--teal-bright)' : 'var(--ink-2)',
            fontFamily: 'var(--font-body)', fontSize: 14, fontWeight: 500,
            position: 'relative',
          }}>
            {activeView === n.id && <div style={{ position: 'absolute', left: -14, top: 6, bottom: 6, width: 2, background: 'var(--teal-bright)', borderRadius: 1 }} />}
            <i data-lucide={n.icon} style={{ width: 16, height: 16, strokeWidth: 1.75 }}></i>
            {n.label}
          </button>
        ))}
        <div style={{ marginTop: 'auto', padding: '12px 10px', fontSize: 12, color: 'var(--ink-3)', borderTop: '1px solid var(--line)' }}>
          <div style={{ fontWeight: 500, color: 'var(--ink-2)' }}>Dr. E. Okafor</div>
          <div style={{ fontFamily: 'var(--font-mono)' }}>Boston Children's · Clinical Genetics</div>
        </div>
      </aside>
      <main>
        <div style={{
          borderBottom: '1px solid var(--line)', padding: '12px 24px', background: 'rgba(250,248,242,0.8)',
          backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 5,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 360, border: '1px solid var(--line)', borderRadius: 8, padding: '6px 10px', background: '#fff' }}>
            <i data-lucide="search" style={{ width: 14, height: 14, color: 'var(--ink-3)' }}></i>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Search cases, syndromes, HPO terms…</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-4)', border: '1px solid var(--line)', borderRadius: 4, padding: '1px 5px' }}>⌘K</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button style={{ padding: '8px 14px', background: 'var(--teal-bright)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
              <i data-lucide="plus" style={{ width: 14, height: 14 }}></i>New case
            </button>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
window.AppShell = AppShell;
