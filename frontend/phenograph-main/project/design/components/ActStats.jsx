// Count up to a target value based on progress 0..1.
function useCountUp(target, progress, decimals = 0) {
  const p = ease.out(ease.clamp(progress));
  const v = target * p;
  return decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString();
}

// Tiny inline sparkline, animates fill based on progress.
function Sparkline({ data, progress, color }) {
  const W = 140, H = 36;
  const max = Math.max(...data);
  const step = W / (data.length - 1);
  const pts = data.map((d, i) => [i * step, H - (d / max) * (H - 4) - 2]);
  // Visible up to (progress * data.length) points.
  const visCount = Math.max(2, Math.round(ease.clamp(progress) * data.length));
  const visible = pts.slice(0, visCount);
  const d = visible.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
  const lastX = visible.length ? visible[visible.length - 1][0] : 0;
  const fillD = d + ` L ${lastX} ${H} L 0 ${H} Z`;
  return (
    <svg width={W} height={H} style={{ display: 'block' }}>
      <path d={fillD} fill={color} fillOpacity="0.12" />
      <path d={d} stroke={color} strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      {visible.length > 0 && (
        <circle cx={visible[visible.length-1][0]} cy={visible[visible.length-1][1]} r="2.4" fill={color}/>
      )}
    </svg>
  );
}

// Mini bar chart
function MiniBars({ values, progress, color }) {
  const W = 140, H = 36, gap = 3;
  const bw = (W - gap * (values.length - 1)) / values.length;
  const max = Math.max(...values);
  return (
    <svg width={W} height={H}>
      {values.map((v, i) => {
        const h = (v / max) * (H - 2);
        const t = ease.out(ease.range(progress, i * 0.04, i * 0.04 + 0.4));
        const rh = h * t;
        return (
          <rect key={i} x={i * (bw + gap)} y={H - rh} width={bw} height={rh}
                fill={color} fillOpacity={0.85} />
        );
      })}
    </svg>
  );
}

function ActStats({ progress, variant }) {
  const dark = variant === 'B';
  const p = ease.clamp(progress);

  // Staggered stat reveals
  const tStats = [0.1, 0.18, 0.26, 0.34].map(s => ease.range(p, s, s + 0.55));

  const stats = [
    {
      value: useCountUp(92, tStats[0]),
      suffix: '%',
      label: 'Top-5 accuracy on blind validation',
      sub: 'n = 12,400 genetically confirmed cases',
      chart: <Sparkline data={[52,58,64,71,76,81,85,89,91,92]} progress={tStats[0]} color={dark ? '#a2b568' : '#068176'} />,
      chartLabel: '2018 — 2025',
    },
    {
      value: useCountUp(4317, tStats[1]),
      label: 'Syndromes linked in knowledge graph',
      sub: 'HPO-aligned · updated quarterly',
      chart: <MiniBars values={[800, 1500, 2400, 3100, 3800, 4317]} progress={tStats[1]} color={dark ? '#a2b568' : '#068176'} />,
      chartLabel: '6 releases',
    },
    {
      value: useCountUp(127, tStats[2]),
      label: 'Morphological features scored',
      sub: 'Each with calibrated uncertainty',
      chart: <Sparkline data={[24, 41, 58, 72, 89, 104, 118, 127]} progress={tStats[2]} color={dark ? '#a2b568' : '#068176'} />,
      chartLabel: 'Atlas growth',
    },
    {
      value: useCountUp(17, tStats[3]),
      label: 'Peer-reviewed publications',
      sub: 'Nature Genetics · AJHG · JAMA Pediatrics',
      chart: <MiniBars values={[1, 2, 3, 2, 4, 5]} progress={tStats[3]} color={dark ? '#a2b568' : '#068176'} />,
      chartLabel: 'by year',
    },
  ];

  // Transparent stage — body bg handles the continuous base.
  return (
    <div className="act-sticky" data-screen-label="03 Stats">
      <div className={"grain-overlay" + (dark ? " dark" : "")} style={{ opacity: dark ? 0.06 : 0.03 }}/>

      <div style={{
        position: 'absolute', inset: 0,
        maxWidth: 1280, margin: '0 auto',
        padding: '110px 64px 60px',
        display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 36,
      }}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end',
          opacity: ease.range(p, 0, 0.15),
        }}>
          <div>
            <div className="eyebrow-mono" style={{ color: dark ? 'var(--moss)' : 'var(--teal-bright)', marginBottom: 20 }}>
              PG · 03 / THE RECORD
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 5vw, 72px)',
              fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.02,
              color: dark ? 'var(--paper-2)' : 'var(--ink)', maxWidth: 860, textWrap: 'balance',
            }}>
              Validated evidence,<br/>quietly compounding.
            </h2>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
            color: dark ? 'rgba(241,237,227,0.5)' : 'var(--ink-3)',
            textAlign: 'right', lineHeight: 1.9,
          }}>
            As of Apr 2026<br/>
            <span style={{ color: dark ? 'var(--moss)' : 'var(--teal-bright)' }}>● LIVE DATASET</span>
          </div>
        </div>

        {/* Stat grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40,
          alignContent: 'center',
        }}>
          {stats.map((s, i) => (
            <div key={i} className={"stat-card" + (dark ? " dark" : "")}
                 style={{
                   opacity: ease.clamp(tStats[i]),
                   transform: `translateY(${(1 - ease.clamp(tStats[i])) * 16}px)`,
                   transition: 'opacity 300ms linear, transform 400ms var(--ease-out)',
                 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: dark ? 'rgba(241,237,227,0.4)' : 'var(--ink-3)', marginBottom: 10 }}>
                0{i+1}
              </div>
              <div className={"stat-num" + (dark ? " dark" : "")} style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <span>{s.value}</span>
                {s.suffix && <span style={{ fontSize: 44, opacity: 0.8 }}>{s.suffix}</span>}
              </div>
              <div style={{ marginTop: 20, marginBottom: 14 }}>{s.chart}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em',
                            color: dark ? 'rgba(241,237,227,0.4)' : 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 16 }}>
                {s.chartLabel}
              </div>
              <div className={"stat-label" + (dark ? " dark" : "")}
                   style={{ fontSize: 14, fontWeight: 500,
                            color: dark ? 'var(--paper-2)' : 'var(--ink)', marginTop: 0, marginBottom: 6 }}>
                {s.label}
              </div>
              <div style={{ fontSize: 12, color: dark ? 'rgba(241,237,227,0.5)' : 'var(--ink-3)', lineHeight: 1.5 }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Footer strip */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          paddingTop: 28, borderTop: `1px solid ${dark ? 'rgba(241,237,227,0.14)' : 'var(--line)'}`,
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
          color: dark ? 'rgba(241,237,227,0.5)' : 'var(--ink-3)',
          opacity: ease.range(p, 0.4, 0.7),
        }}>
          <span>Not a diagnostic device. Clinical decision support only.</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px solid currentColor', paddingBottom: 2 }}>Publications →</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px solid currentColor', paddingBottom: 2 }}>Validation report →</a>
          </div>
        </div>
      </div>
    </div>
  );
}
window.ActStats = ActStats;
