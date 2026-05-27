// DNA ribbon: two offset sine curves in a 3D-ish "twisted ladder" projection,
// with rung points as the base pairs. Parameterized by `progress` (0..1):
//   0.0  — calm, fully-formed ribbon, slow drift
//   0.5  — ribbon compresses slightly, hints of motion
//   1.0  — rungs shed outward + upward, the strand fades
//
// Note: NOT a blue helix. Teal-bright + moss strokes on off-white (or on midnight),
// low-weight lines, paper-grain layered over it in the parent.

const RIBBON = {
  // 420 columns along x, offset so the ribbon drifts right→left a bit with time.
  // Using y-sinusoid with phase offset between strand A and B to simulate twist.
  count: 60,        // rungs
  ampX: 320,        // horizontal amplitude (the strand width)
  ampY: 140,        // vertical wave
  periodY: 2.4,     // how many full sine waves across length
};

function DnaRibbon({ progress, variant }) {
  const ref = React.useRef(null);
  const tRef = React.useRef(performance.now());
  const [, force] = React.useState(0);

  // Animate a time cursor independently for idle "breathing" motion.
  React.useEffect(() => {
    let raf;
    const loop = () => {
      tRef.current = performance.now();
      force(v => (v + 1) % 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Use shared wall-clock origin (set by ParticleLayer) so wave phases match exactly.
  const T0 = window.__PG_T0 || (window.__PG_T0 = performance.now());
  const t = (tRef.current - T0) / 1000 * 0.6;
  const W = 1600, H = 900;
  const cx = W * 0.58; // center of the ribbon shifts right so text breathes left
  const cy = H * 0.52;

  // Master "dissolve" driver: ribbon starts dispersing past 0.45
  const dissolve = ease.range(progress, 0.45, 1);
  // Ribbon pull-in effect: slight compression as we scroll
  const compress = ease.inOut(ease.range(progress, 0, 0.6));
  // Opacity of the strand itself
  const strandOpacity = (1 - dissolve) * 0.85;

  // Compute rungs + strand points.
  const rungs = [];
  const strandA = [];
  const strandB = [];
  for (let i = 0; i < RIBBON.count; i++) {
    const u = i / (RIBBON.count - 1); // 0..1 along length
    // The ribbon runs vertically-ish, slanted. We parameterize along a diagonal.
    const alongX = (u - 0.5) * 260;      // slight x-drift along the length
    const alongY = (u - 0.5) * (H * 0.9) * (1 - compress * 0.08); // length shrinks a hair

    // Twist angle: as we move along u, strands rotate.
    const twist = u * Math.PI * 2 * RIBBON.periodY + t * 0.6;

    // Each strand sits at +/- ampX * cos(twist), y is the length axis.
    // Subtle sway from time:
    const sway = Math.sin(t * 0.8 + u * 3.2) * 12;

    const xA = cx + alongX + Math.cos(twist) * RIBBON.ampX * (1 - compress * 0.1) + sway;
    const xB = cx + alongX - Math.cos(twist) * RIBBON.ampX * (1 - compress * 0.1) + sway;
    // Depth cue via z-ish: we map sin(twist) to scale/opacity later.
    const depth = Math.sin(twist); // -1..1 (nearer when >0)

    // Vertical position (the long axis).
    const y = cy + alongY;

    // Dissolve: push rung endpoints outward along their normal (mostly horizontal),
    // with a randomish upward drift.
    const seedA = Math.sin(i * 12.9898) * 43758.5453;
    const rA = (seedA - Math.floor(seedA)) * 2 - 1; // -1..1 jitter
    const seedB = Math.sin(i * 78.233) * 43758.5453;
    const rB = (seedB - Math.floor(seedB)) * 2 - 1;

    const disp = dissolve * (20 + rA * 30);
    const dispDown = dissolve * (1200 + rB * 400); // fall way down, past the next act boundary

    const pA = { x: xA + rA * disp, y: y + dispDown, depth };
    const pB = { x: xB + rB * disp, y: y + dispDown, depth: -depth };

    strandA.push(pA);
    strandB.push(pB);

    rungs.push({
      a: pA, b: pB, u, depth,
      // Rung fades as dissolve grows; nearer rungs linger slightly.
      opacity: (1 - dissolve) * (0.35 + 0.45 * Math.abs(Math.cos(twist))),
    });
  }

  // Build strand paths.
  const strandPath = (pts) => {
    if (!pts.length) return '';
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1]; const p1 = pts[i];
      // Smooth with a cubic using a simple midpoint handle.
      const mx = (p0.x + p1.x) / 2;
      d += ` Q ${mx.toFixed(1)} ${p0.y.toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return d;
  };

  const darkMode = variant === 'B';
  const strandColorA = darkMode ? 'rgba(162,181,104,0.75)' : 'rgba(6,129,118,0.75)';
  const strandColorB = darkMode ? 'rgba(6,129,118,0.7)' : 'rgba(71,93,46,0.6)';
  const rungColor = darkMode ? 'rgba(241,237,227,0.32)' : 'rgba(21,40,47,0.22)';
  const pointColor = darkMode ? '#a2b568' : '#068176';

  // Particle rendering moved to shared ParticleLayer. Keep strands + rungs only.
  // Hide all base-pair points here since ParticleLayer now owns them.
  const showOwnPoints = false;
  return (
    <svg ref={ref} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice"
         style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="strandFade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0"/>
          <stop offset="20%" stopColor="white" stopOpacity="1"/>
          <stop offset="80%" stopColor="white" stopOpacity="1"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
        <mask id="strandMask">
          <rect width={W} height={H} fill="url(#strandFade)"/>
        </mask>
      </defs>

      <g mask="url(#strandMask)" style={{ opacity: strandOpacity, transition: 'opacity 300ms linear' }}>
        {/* Rungs (base pairs) */}
        <g>
          {rungs.map((r, i) => (
            <g key={i} style={{ opacity: r.opacity }}>
              <line x1={r.a.x} y1={r.a.y} x2={r.b.x} y2={r.b.y}
                    stroke={rungColor} strokeWidth={0.8} />
            </g>
          ))}
        </g>
        {/* Strand A */}
        <path d={strandPath(strandA)} stroke={strandColorA} strokeWidth={1.4} fill="none" strokeLinecap="round"/>
        {/* Strand B */}
        <path d={strandPath(strandB)} stroke={strandColorB} strokeWidth={1.1} fill="none" strokeLinecap="round"/>
      </g>

      {/* Base-pair points now owned by the shared ParticleLayer across both acts. */}

      {/* A thin vertical guide — evokes a scientific plate margin */}
      <line x1={cx + 520} y1={H*0.12} x2={cx + 520} y2={H*0.88}
            stroke={darkMode ? 'rgba(231,225,212,0.08)' : 'rgba(21,40,47,0.06)'}
            strokeDasharray="2 6" strokeWidth={0.6}/>
    </svg>
  );
}
window.DnaRibbon = DnaRibbon;
