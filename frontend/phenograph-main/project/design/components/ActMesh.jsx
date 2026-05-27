function ActMesh({ progress, variant }) {
  const dark = variant === 'B';
  const p = ease.clamp(progress);

  // Stage label ticks through phases
  const stage =
    p < 0.22 ? '01 · ARRIVAL'
    : p < 0.48 ? '02 · LANDMARKING'
    : p < 0.72 ? '03 · TRIANGULATION'
    : p < 0.92 ? '04 · CONTOUR'
    : '05 · ANNOTATED';

  const countLandmarks = Math.round(ease.clamp(ease.range(p, 0.18, 0.45)) * 34);
  const countEdges     = Math.round(ease.clamp(ease.range(p, 0.45, 0.72)) * 64);

  return (
    <div className="act-sticky" data-screen-label="02 Mesh">
      <div className={"act-1-bg" + (dark ? " dark" : "")} />
      <div className={"grain-overlay" + (dark ? " dark" : "")} />

      {/* Center stage */}
      <div style={{
        position: 'absolute', inset: 0,
        maxWidth: 1280, margin: '0 auto',
        padding: '100px 64px 60px',
        display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 48, alignItems: 'center',
      }}>
        {/* Left column: phase narrative */}
        <div style={{
          opacity: ease.range(p, 0.05, 0.25),
          color: dark ? 'rgba(241,237,227,0.8)' : 'var(--ink)',
        }}>
          <div className="eyebrow-mono" style={{ marginBottom: 24, color: dark ? 'var(--moss)' : 'var(--teal-bright)' }}>
            PG · 02 / THE MESH
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 3.3vw, 52px)',
            lineHeight: 1.04, letterSpacing: '-0.02em', fontWeight: 500,
            color: dark ? 'var(--paper-2)' : 'var(--ink)',
            marginBottom: 20, textWrap: 'balance',
          }}>
            From a strand of code<br/>to a face in reference.
          </h2>
          <p style={{
            fontSize: 16, lineHeight: 1.6, maxWidth: 360,
            color: dark ? 'rgba(241,237,227,0.6)' : 'var(--ink-2)',
          }}>
            Sub-millimeter landmarks are localized against a curated atlas of 127 morphological features, then triangulated into a reference mesh for metric analysis.
          </p>
        </div>

        {/* Center stage: the mesh itself */}
        <div style={{ display: 'grid', placeItems: 'center', position: 'relative' }}>
          <FaceMesh progress={p} variant={variant} />
        </div>

        {/* Right column: live counters */}
        <div style={{
          opacity: ease.range(p, 0.18, 0.4),
          justifySelf: 'end', maxWidth: 260, width: '100%',
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em',
          color: dark ? 'rgba(241,237,227,0.55)' : 'var(--ink-3)',
        }}>
          <div style={{
            paddingBottom: 14, borderBottom: `1px solid ${dark ? 'rgba(241,237,227,0.14)' : 'var(--line)'}`,
            marginBottom: 18, display: 'flex', justifyContent: 'space-between',
          }}>
            <span>STAGE</span>
            <span style={{ color: dark ? 'var(--moss)' : 'var(--teal-bright)' }}>{stage}</span>
          </div>

          {[
            { k: 'Landmarks', v: String(countLandmarks).padStart(2, '0'), of: '34' },
            { k: 'Edges',     v: String(countEdges).padStart(2, '0'),     of: '64' },
            { k: 'Atlas',     v: 'HPO v2024.4', of: null },
            { k: 'Model',     v: 'pg-face-3.2', of: null },
          ].map((row, i) => (
            <div key={row.k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px dashed ${dark ? 'rgba(241,237,227,0.1)' : 'var(--line)'}` }}>
              <span style={{ textTransform: 'uppercase' }}>{row.k}</span>
              <span style={{ color: dark ? 'var(--paper-2)' : 'var(--ink)' }}>
                {row.v}{row.of && <span style={{ opacity: 0.4 }}> / {row.of}</span>}
              </span>
            </div>
          ))}

          <div style={{ marginTop: 24, fontSize: 10, lineHeight: 1.6, opacity: 0.7, textTransform: 'none', letterSpacing: '0.04em' }}>
            All imagery shown is an abstract reference mesh. Phenograph never exposes identifiable patient faces.
          </div>
        </div>
      </div>

      <div className={"scroll-hint" + (dark ? " dark" : "")} style={{ opacity: ease.range(1 - p, 0, 0.2) }}>
        <span>Continue</span>
        <span className="bar" />
      </div>
    </div>
  );
}
window.ActMesh = ActMesh;
