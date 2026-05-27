function ActTitle({ progress, variant }) {
  const dark = variant === 'B';
  const p = ease.clamp(progress);

  // Headline reveal driven by progress (works in both variants)
  const headline = "Phenotype, precisely read.";
  const subhead = "Phenograph identifies morphological features from a single facial image and ranks candidate syndromes against the HPO ontology.";
  const letters = headline.split('');

  // Content fade on exit (start leaving at 0.55)
  const exitFade = 1 - ease.out(ease.range(p, 0.55, 0.95));
  const yShift = ease.range(p, 0.55, 1) * -40;

  return (
    <div className="act-sticky" data-screen-label="01 Title">
      <div className={"act-1-bg" + (dark ? " dark" : "")} />
      <div className={"grain-overlay" + (dark ? " dark" : "")} />

      {/* DNA ribbon behind */}
      <div style={{ position: 'absolute', inset: 0, opacity: 1 }}>
        <DnaRibbon progress={p} variant={variant} />
      </div>

      {/* Text column */}
      <div style={{
        position: 'absolute', inset: 0,
        maxWidth: 1200, margin: '0 auto',
        padding: '120px 64px 80px',
        display: 'grid', gridTemplateColumns: '1.1fr 1fr', alignItems: 'center',
        opacity: exitFade, transform: `translateY(${yShift}px)`,
        transition: 'opacity 200ms linear',
      }}>
        <div style={{ maxWidth: 620 }}>
          <div className="eyebrow-mono" style={{ marginBottom: 28 }}>
            <span style={{ opacity: 0.6 }}>PG · 01</span>
            <span style={{ margin: '0 10px', opacity: 0.4 }}>/</span>
            Computational dysmorphology
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 500,
            fontSize: 'clamp(48px, 6.5vw, 92px)', lineHeight: 0.98,
            letterSpacing: '-0.035em',
            color: dark ? 'var(--paper-2)' : 'var(--ink)',
            marginBottom: 32, textWrap: 'balance',
          }}>
            {headline}
          </h1>

          <p style={{
            fontSize: 18, lineHeight: 1.55, maxWidth: 520, marginBottom: 36,
            color: dark ? 'rgba(241,237,227,0.72)' : 'var(--ink-2)',
          }}>
            {subhead}
          </p>

          <div style={{
            display: 'flex', gap: 12,
          }}>
            <a href="#" style={{
              padding: '13px 22px', background: 'var(--teal-bright)', color: '#fff',
              textDecoration: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500, letterSpacing: '0.01em',
            }}>Request clinical access</a>
            <a href="#" style={{
              padding: '13px 22px', background: 'transparent',
              color: dark ? 'var(--paper-2)' : 'var(--ink)',
              textDecoration: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500,
              border: `1px solid ${dark ? 'rgba(241,237,227,0.3)' : 'var(--ink)'}`,
            }}>Read the evidence</a>
          </div>

          <div style={{
            marginTop: 44, display: 'flex', gap: 32, fontSize: 12, letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: dark ? 'rgba(241,237,227,0.45)' : 'var(--ink-3)',
            fontFamily: 'var(--font-mono)',
            opacity: 1,
          }}>
            <span>HIPAA-aligned</span>
            <span>SOC 2 Type II</span>
            <span>GDPR</span>
          </div>
        </div>

        {/* Right column: annotation block, scientific plate feel */}
        <div style={{
          justifySelf: 'end', maxWidth: 320,
          color: dark ? 'rgba(241,237,227,0.55)' : 'var(--ink-3)',
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', lineHeight: 1.8,
          borderLeft: `1px solid ${dark ? 'rgba(241,237,227,0.18)' : 'var(--line)'}`,
          paddingLeft: 20,
        }}>
          <div style={{ color: dark ? 'var(--moss)' : 'var(--teal-bright)', marginBottom: 8 }}>FIG. 01 — IDLE STATE</div>
          <div>Double-strand reference pattern.</div>
          <div>127 morphological features indexed.</div>
          <div>4,317 syndromes linked to HPO.</div>
          <div style={{ marginTop: 16, opacity: 0.7 }}>Scroll to continue →</div>
        </div>
      </div>

      {/* Scroll hint */}
      <div className={"scroll-hint" + (dark ? " dark" : "")}>
        <span>Scroll</span>
        <span className="bar" />
      </div>
    </div>
  );
}
window.ActTitle = ActTitle;
