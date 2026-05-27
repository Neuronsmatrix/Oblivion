import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { DnaRibbon } from './DnaRibbon';
import { FaceMesh } from './FaceMesh';
import { ease, useActiveAct, useActProgress } from './useScrollProgress';
import './scrollStory.css';

// ── Act I: The read ──────────────────────────────────────────────────────────
function ActTitle({ progress }: { progress: number }) {
  const p = ease.clamp(progress);
  const exitFade = 1 - ease.out(ease.range(p, 0.55, 0.95));
  const yShift = ease.range(p, 0.55, 1) * -40;

  return (
    <div className="act-sticky">
      <div className="act-1-bg" />
      <div className="grain-overlay" />
      <div style={{ position: 'absolute', inset: 0 }}><DnaRibbon progress={p} /></div>

      <div style={{ position: 'absolute', inset: 0, maxWidth: 1200, margin: '0 auto', padding: '120px 64px 80px', display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)', alignItems: 'center', opacity: exitFade, transform: `translateY(${yShift}px)`, transition: 'opacity 200ms linear' }}>
        <div style={{ maxWidth: 620 }}>
          <div className="eyebrow-mono" style={{ marginBottom: 28 }}>
            <span style={{ opacity: 0.6 }}>PG · 01</span>
            <span style={{ margin: '0 10px', opacity: 0.4 }}>/</span>
            Computational dysmorphology
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 'clamp(48px, 6.5vw, 92px)', lineHeight: 0.98, letterSpacing: '-0.035em', color: 'var(--ink)', marginBottom: 32, textWrap: 'balance' }}>
            Phenotype, precisely read.
          </h1>
          <p style={{ fontSize: 18, lineHeight: 1.55, maxWidth: 520, marginBottom: 36, color: 'var(--ink-2)' }}>
            Phenograph identifies morphological features from a single facial image and ranks candidate syndromes against the HPO ontology.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/register" style={{ padding: '13px 22px', background: 'var(--teal-bright)', color: '#fff', textDecoration: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500 }}>Request clinical access</Link>
            <a href="#evidence" style={{ padding: '13px 22px', background: 'transparent', color: 'var(--ink)', textDecoration: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, border: '1px solid var(--ink)' }}>Read the evidence</a>
          </div>
          <div style={{ marginTop: 44, display: 'flex', gap: 32, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
            <span>HIPAA-aligned</span><span>SOC 2 Type II</span><span>GDPR</span>
          </div>
        </div>

        <div style={{ justifySelf: 'end', maxWidth: 320, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', lineHeight: 1.8, borderLeft: '1px solid var(--line)', paddingLeft: 20 }}>
          <div style={{ color: 'var(--teal-bright)', marginBottom: 8 }}>FIG. 01 — IDLE STATE</div>
          <div>Double-strand reference pattern.</div>
          <div>127 morphological features indexed.</div>
          <div>4,317 syndromes linked to HPO.</div>
          <div style={{ marginTop: 16, opacity: 0.7 }}>Scroll to continue</div>
        </div>
      </div>

      <div className="scroll-hint"><span>Scroll</span><span className="bar" /></div>
    </div>
  );
}

// ── Act II: The mesh ─────────────────────────────────────────────────────────
function ActMesh({ progress }: { progress: number }) {
  const p = ease.clamp(progress);
  const stage = p < 0.22 ? '01 · ARRIVAL' : p < 0.4 ? '02 · LANDMARKING' : p < 0.72 ? '03 · TRIANGULATION' : p < 0.92 ? '04 · CONTOUR' : '05 · ANNOTATED';
  const countLandmarks = Math.round(ease.clamp(ease.range(p, 0.1, 0.4)) * 34);
  const countEdges = Math.round(ease.clamp(ease.range(p, 0.4, 0.72)) * 64);

  return (
    <div className="act-sticky">
      <div className="act-1-bg" />
      <div className="grain-overlay" />
      <div style={{ position: 'absolute', inset: 0, maxWidth: 1280, margin: '0 auto', padding: '100px 64px 60px', display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 48, alignItems: 'center' }}>
        <div style={{ opacity: ease.range(p, 0.05, 0.25), color: 'var(--ink)' }}>
          <div className="eyebrow-mono" style={{ marginBottom: 24 }}>PG · 02 / THE MESH</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 3.3vw, 52px)', lineHeight: 1.04, letterSpacing: '-0.02em', fontWeight: 500, color: 'var(--ink)', marginBottom: 20, textWrap: 'balance' }}>
            From a strand of code to a face in reference.
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.6, maxWidth: 360, color: 'var(--ink-2)' }}>
            Sub-millimeter landmarks are localized against a curated atlas of 127 morphological features, then triangulated into a reference mesh for metric analysis.
          </p>
        </div>

        <div style={{ display: 'grid', placeItems: 'center', position: 'relative' }}>
          <FaceMesh progress={p} />
        </div>

        <div style={{ opacity: ease.range(p, 0.18, 0.4), justifySelf: 'end', maxWidth: 260, width: '100%', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--ink-3)' }}>
          <div style={{ paddingBottom: 14, borderBottom: '1px solid var(--line)', marginBottom: 18, display: 'flex', justifyContent: 'space-between' }}>
            <span>STAGE</span><span style={{ color: 'var(--teal-bright)' }}>{stage}</span>
          </div>
          {[
            { k: 'Landmarks', v: String(countLandmarks).padStart(2, '0'), of: '34' },
            { k: 'Edges', v: String(countEdges).padStart(2, '0'), of: '64' },
            { k: 'Atlas', v: 'HPO v2024.4', of: null },
            { k: 'Model', v: 'pg-face-3.2', of: null },
          ].map((row) => (
            <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px dashed var(--line)' }}>
              <span style={{ textTransform: 'uppercase' }}>{row.k}</span>
              <span style={{ color: 'var(--ink)' }}>{row.v}{row.of && <span style={{ opacity: 0.4 }}> / {row.of}</span>}</span>
            </div>
          ))}
          <div style={{ marginTop: 24, fontSize: 10, lineHeight: 1.6, opacity: 0.7, textTransform: 'none', letterSpacing: '0.04em' }}>
            All imagery shown is an abstract reference mesh. Phenograph never exposes identifiable patient faces.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Act III: The record ──────────────────────────────────────────────────────
function countUp(target: number, progress: number, decimals = 0) {
  const v = target * ease.out(ease.clamp(progress));
  return decimals > 0 ? v.toFixed(decimals) : Math.round(v).toLocaleString();
}

function Sparkline({ data, progress }: { data: number[]; progress: number }) {
  const W = 140, H = 36;
  const max = Math.max(...data);
  const step = W / (data.length - 1);
  const pts = data.map((d, i) => [i * step, H - (d / max) * (H - 4) - 2] as const);
  const visCount = Math.max(2, Math.round(ease.clamp(progress) * data.length));
  const visible = pts.slice(0, visCount);
  const d = visible.map(([x, y], i) => (i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`)).join(' ');
  const lastX = visible.length ? visible[visible.length - 1][0] : 0;
  return (
    <svg width={W} height={H} style={{ display: 'block' }} aria-hidden>
      <path d={`${d} L ${lastX} ${H} L 0 ${H} Z`} fill="#068176" fillOpacity="0.12" />
      <path d={d} stroke="#068176" strokeWidth="1.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {visible.length > 0 && <circle cx={visible[visible.length - 1][0]} cy={visible[visible.length - 1][1]} r="2.4" fill="#068176" />}
    </svg>
  );
}

function MiniBars({ values, progress }: { values: number[]; progress: number }) {
  const W = 140, H = 36, gap = 3;
  const bw = (W - gap * (values.length - 1)) / values.length;
  const max = Math.max(...values);
  return (
    <svg width={W} height={H} aria-hidden>
      {values.map((v, i) => {
        const t = ease.out(ease.range(progress, i * 0.04, i * 0.04 + 0.4));
        const rh = (v / max) * (H - 2) * t;
        return <rect key={i} x={i * (bw + gap)} y={H - rh} width={bw} height={rh} fill="#068176" fillOpacity={0.85} />;
      })}
    </svg>
  );
}

function ActStats({ progress }: { progress: number }) {
  const p = ease.clamp(progress);
  const t = [0.1, 0.18, 0.26, 0.34].map((s) => ease.range(p, s, s + 0.55));
  const stats = [
    { value: countUp(92, t[0]), suffix: '%', label: 'Top-5 accuracy on blind validation', sub: 'n = 12,400 genetically confirmed cases', chart: <Sparkline data={[52, 58, 64, 71, 76, 81, 85, 89, 91, 92]} progress={t[0]} />, chartLabel: '2018 — 2025' },
    { value: countUp(4317, t[1]), label: 'Syndromes linked in knowledge graph', sub: 'HPO-aligned · updated quarterly', chart: <MiniBars values={[800, 1500, 2400, 3100, 3800, 4317]} progress={t[1]} />, chartLabel: '6 releases' },
    { value: countUp(127, t[2]), label: 'Morphological features scored', sub: 'Each with calibrated uncertainty', chart: <Sparkline data={[24, 41, 58, 72, 89, 104, 118, 127]} progress={t[2]} />, chartLabel: 'Atlas growth' },
    { value: countUp(17, t[3]), label: 'Peer-reviewed publications', sub: 'Nature Genetics · AJHG · JAMA Pediatrics', chart: <MiniBars values={[1, 2, 3, 2, 4, 5]} progress={t[3]} />, chartLabel: 'by year' },
  ];

  return (
    <div className="act-sticky" id="evidence">
      <div className="grain-overlay" style={{ opacity: 0.03 }} />
      <div style={{ position: 'absolute', inset: 0, maxWidth: 1280, margin: '0 auto', padding: '110px 64px 60px', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 36 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', opacity: ease.range(p, 0, 0.15), gap: 16 }}>
          <div>
            <div className="eyebrow-mono" style={{ marginBottom: 20 }}>PG · 03 / THE RECORD</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 5vw, 72px)', fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.02, color: 'var(--ink)', maxWidth: 860, textWrap: 'balance' }}>
              Validated evidence, quietly compounding.
            </h2>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)', textAlign: 'right', lineHeight: 1.9 }}>
            As of Apr 2026<br /><span style={{ color: 'var(--teal-bright)' }}>● LIVE DATASET</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 40, alignContent: 'center' }}>
          {stats.map((s, i) => (
            <div key={i} className="stat-card" style={{ opacity: ease.clamp(t[i]), transform: `translateY(${(1 - ease.clamp(t[i])) * 16}px)`, transition: 'opacity 300ms linear, transform 400ms var(--ease-out)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 10 }}>0{i + 1}</div>
              <div className="stat-num" style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                <span>{s.value}</span>{s.suffix && <span style={{ fontSize: 44, opacity: 0.8 }}>{s.suffix}</span>}
              </div>
              <div style={{ marginTop: 20, marginBottom: 14 }}>{s.chart}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-4)', textTransform: 'uppercase', marginBottom: 16 }}>{s.chartLabel}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 28, borderTop: '1px solid var(--line)', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', color: 'var(--ink-3)', opacity: ease.range(p, 0.4, 0.7), gap: 16, flexWrap: 'wrap' }}>
          <span>Not a diagnostic device. Clinical decision support only.</span>
          <div style={{ display: 'flex', gap: 24 }}>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px solid currentColor', paddingBottom: 2 }}>Publications</a>
            <a href="#" style={{ color: 'inherit', textDecoration: 'none', borderBottom: '1px solid currentColor', paddingBottom: 2 }}>Validation report</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProgressRail({ active }: { active: number }) {
  const items = [['01', 'The read'], ['02', 'The mesh'], ['03', 'The record']];
  return (
    <nav className="pg-progress-rail" aria-label="Section progress">
      {items.map(([n, label], i) => (
        <div key={n} className={'rail-item' + (active === i ? ' active' : '')}>
          <span>{n} — {label}</span>
          <span className="tick" />
        </div>
      ))}
    </nav>
  );
}

export function ScrollStory() {
  const ref1 = useRef<HTMLElement>(null);
  const ref2 = useRef<HTMLElement>(null);
  const ref3 = useRef<HTMLElement>(null);
  const p1 = useActProgress(ref1);
  const p2 = useActProgress(ref2);
  const p3 = useActProgress(ref3);
  const refs = useMemo(() => [ref1, ref2, ref3], []);
  const active = useActiveAct(refs);

  return (
    <div className="pg-story">
      <ProgressRail active={active} />
      <section ref={ref1} className="act" style={{ height: '200vh' }}><ActTitle progress={p1} /></section>
      <section ref={ref2} className="act" style={{ height: '210vh' }}><ActMesh progress={p2} /></section>
      <section ref={ref3} className="act" style={{ height: '170vh' }}><ActStats progress={p3} /></section>
    </div>
  );
}
