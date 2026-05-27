function MainScreen() {
  const [variant, setVariant] = React.useState(() => {
    return localStorage.getItem('pg_variant') || 'A';
  });
  React.useEffect(() => {
    localStorage.setItem('pg_variant', variant);
    if (window.lucide) window.lucide.createIcons();
  }, [variant]);

  const ref1 = React.useRef(null);
  const ref2 = React.useRef(null);
  const ref3 = React.useRef(null);

  const p1 = useActProgress(ref1);
  const p2 = useActProgress(ref2);
  const p3 = useActProgress(ref3);

  const active = useActiveAct(React.useMemo(() => [ref1, ref2, ref3], []));

  const dark = variant === 'B';

  // Combined 0..1 timeline for particle layer:
  //   Act I  (p1: 0..1)  → combinedT: 0.0..0.5   (particles on DNA ribbon, start detaching late)
  //   Act II (p2: 0..1)  → combinedT: 0.5..1.0   (fall continues, then snap into mesh)
  const combinedT = p2 > 0
    ? 0.5 + Math.min(0.5, p2 * 0.5)
    : Math.min(0.5, p1 * 0.5);

  // Track where the ActMesh FaceMesh SVG is on screen so particles can snap there.
  const meshWrapRef = React.useRef(null);
  const [meshRect, setMeshRect] = React.useState(null);
  React.useEffect(() => {
    let raf = 0;
    const measure = () => {
      const svg = document.querySelector('[data-screen-label="02 Mesh"] svg');
      if (svg) {
        const r = svg.getBoundingClientRect();
        setMeshRect({ x: r.x, y: r.y, width: r.width, height: r.height });
      }
      raf = requestAnimationFrame(measure);
    };
    raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, []);

  React.useEffect(() => {
    document.body.style.background = dark ? '#0a1519' : 'var(--paper)';
  }, [dark]);

  return (
    <>
      {/* Cinematic shared gradient — fixed, continuous across all acts */}
      {dark && (
        <div aria-hidden style={{
          position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `
            radial-gradient(1400px 1000px at 75% 12%, rgba(6,129,118,0.25), transparent 60%),
            radial-gradient(1100px 900px at 12% 55%, rgba(162,181,104,0.10), transparent 60%),
            radial-gradient(1300px 900px at 85% 85%, rgba(17,70,67,0.28), transparent 65%),
            linear-gradient(180deg, #0d1d23 0%, #15282f 45%, #0f2229 75%, #0a1519 100%)
          `,
        }}/>
      )}

      <ParticleLayer combinedT={combinedT} actIIIProgress={p3} variant={variant} meshRect={meshRect} />

      <TopBar variant={variant} setVariant={setVariant} dark={dark} />
      <ProgressRail active={active} dark={dark} />

      <section ref={ref1} className="act" style={{ height: '200vh', position: 'relative', zIndex: 1 }}>
        <ActTitle progress={p1} variant={variant} />
      </section>

      <section ref={ref2} className="act" style={{ height: '210vh', position: 'relative', zIndex: 1 }}>
        <ActMesh progress={p2} variant={variant} />
      </section>

      <section ref={ref3} className="act" style={{ height: '170vh', position: 'relative', zIndex: 1 }}>
        <ActStats progress={p3} variant={variant} />
      </section>

      <div style={{ height: '20vh', position: 'relative', zIndex: 1 }} />
    </>
  );
}
window.MainScreen = MainScreen;
