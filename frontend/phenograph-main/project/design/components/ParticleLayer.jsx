// Unified particle layer — spans Act I and Act II.
// Renders 34 particles (one per face landmark) in fixed viewport coords.
// combinedT (0..1) is a continuous timeline:
//   0.0 - 0.5   — particles are on the DNA ribbon (mapped across the 34 rung positions in Act I)
//   0.5 - 0.7   — particles detach and fall
//   0.7 - 1.0   — particles snap into face-mesh landmark positions (translated to screen coords)

// Shared time origin — both ParticleLayer and DnaRibbon read it so their wave equations stay in lock-step.
window.__PG_T0 = window.__PG_T0 || performance.now();
const PARTICLE_T0 = window.__PG_T0;
//
// We receive the ActMesh element's screen rect to know where to place the mesh anchors.

const PARTICLE_LANDMARKS = [
  { id: 'f1', x: 200, y: 110 },{ id: 'f2', x: 260, y: 90 },{ id: 'f3', x: 320, y: 95 },{ id: 'f4', x: 380, y: 120 },
  { id: 't1', x: 160, y: 175 },{ id: 't2', x: 420, y: 180 },
  { id: 'b1', x: 195, y: 235 },{ id: 'b2', x: 245, y: 220 },{ id: 'b3', x: 305, y: 220 },{ id: 'b4', x: 355, y: 235 },
  { id: 'e1', x: 215, y: 275 },{ id: 'e2', x: 255, y: 270 },{ id: 'e3', x: 305, y: 270 },{ id: 'e4', x: 345, y: 275 },
  { id: 'n1', x: 280, y: 310 },{ id: 'n2', x: 280, y: 345 },{ id: 'n3', x: 280, y: 380 },
  { id: 'nl', x: 255, y: 395 },{ id: 'nr', x: 305, y: 395 },{ id: 'p1', x: 280, y: 430 },
  { id: 'm1', x: 235, y: 465 },{ id: 'm2', x: 275, y: 460 },{ id: 'm3', x: 305, y: 460 },{ id: 'm4', x: 325, y: 465 },{ id: 'm5', x: 280, y: 490 },
  { id: 'ch',  x: 280, y: 560 },
  { id: 'j1', x: 200, y: 495 },{ id: 'j2', x: 220, y: 540 },{ id: 'j3', x: 245, y: 570 },
  { id: 'j4', x: 315, y: 570 },{ id: 'j5', x: 340, y: 540 },{ id: 'j6', x: 360, y: 495 },
  { id: 'ck1', x: 215, y: 395 },{ id: 'ck2', x: 345, y: 395 },
];

function ParticleLayer({ combinedT, actIIIProgress = 0, variant, meshRect }) {
  const [size, setSize] = React.useState({ w: window.innerWidth, h: window.innerHeight });
  const tRef = React.useRef(performance.now());
  const [, force] = React.useState(0);

  React.useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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

  // Use wall-clock seconds so it stays in sync with DnaRibbon's tRef regardless of frame timing.
  const t = (tRef.current - PARTICLE_T0) / 1000 * 0.6; // scaled so 1 unit ≈ matches DnaRibbon's drift
  const vw = size.w, vh = size.h;
  const dark = variant === 'B';

  // The DnaRibbon is rendered in an SVG with viewBox 1600x900 and preserveAspectRatio="xMidYMid slice"
  // covering the full viewport. Replicate that projection so our ribbon coords line up exactly.
  const RIBBON_VB_W = 1600, RIBBON_VB_H = 900;
  const rScale = Math.max(vw / RIBBON_VB_W, vh / RIBBON_VB_H); // "slice" uses max
  const rScaledW = RIBBON_VB_W * rScale;
  const rScaledH = RIBBON_VB_H * rScale;
  const rOffsetX = (vw - rScaledW) / 2;
  const rOffsetY = (vh - rScaledH) / 2;
  // Project ribbon viewBox coords (0..1600, 0..900) → viewport pixels.
  const projRibbon = (vbX, vbY) => ({
    x: rOffsetX + vbX * rScale,
    y: rOffsetY + vbY * rScale,
  });

  // Ribbon layout (must match DnaRibbon.jsx exactly):
  //   count: 60, ampX: 320, periodY: 2.4, cx: W*0.58, cy: H*0.52, alongX span 260, alongY span H*0.9
  // We map our 34 particles across those 60 rungs evenly.
  const R_COUNT = 60, R_AMPX = 320, R_PERIOD = 2.4;
  const rCx = RIBBON_VB_W * 0.58;
  const rCy = RIBBON_VB_H * 0.52;

  // Mesh target on screen: track the live FaceMesh SVG bounding rect via meshRect prop,
  // BUT clamp y to viewport — when Act II isn't visible, fallback to viewport center.
  const meshSize = Math.min(vh * 0.62, 560);
  const meshDefaultCx = vw * 0.5;
  const meshDefaultCy = vh * 0.5;
  const meshDefaultScale = meshSize / 560;
  let meshCx = meshDefaultCx, meshCy = meshDefaultCy, meshScale = meshDefaultScale;
  if (meshRect) {
    const rcx = meshRect.x + meshRect.width / 2;
    const rcy = meshRect.y + meshRect.height / 2;
    // Only use live rect if it's reasonably on-screen vertically (Act II is pinned).
    if (rcy > -200 && rcy < vh + 200) {
      meshCx = rcx;
      meshCy = rcy;
      meshScale = meshRect.height / 720;
    }
  }

  // Phase driver
  const p = ease.clamp(combinedT);
  const pRibbon = 1 - ease.clamp(ease.range(p, 0.35, 0.55)); // ribbon visibility fades here
  const pFall   = ease.clamp(ease.range(p, 0.35, 0.55));     // brief disperse from ribbon
  const pSnap   = ease.out(ease.clamp(ease.range(p, 0.50, 0.95))); // snap to mesh — starts overlapping fall

  // Fade out particles at the END of Act II (before Act III starts) and through Act III's start.
  // Uses BOTH combinedT (end of Act II) and actIIIProgress so the fade begins slightly before the
  // sticky boundary releases — avoids the "mesh dots still showing over Act III heading" gap.
  const endOfActIIFade = ease.clamp(ease.range(p, 0.92, 1.0));           // last 8% of Act II
  const actIIIFade     = ease.clamp(ease.range(actIIIProgress, 0.0, 0.08));
  const layerOpacity   = (1 - endOfActIIFade) * (1 - actIIIFade);

  const pointColor = dark ? '#a2b568' : '#068176';
  const pointHalo = dark ? 'rgba(162,181,104,0.25)' : 'rgba(6,129,118,0.2)';

  const particles = PARTICLE_LANDMARKS.map((lm, i) => {
    // Map our 34 particles onto the 60 rungs, picking alternating strand sides.
    const rungIndex = Math.round((i / (PARTICLE_LANDMARKS.length - 1)) * (R_COUNT - 1));
    const u = rungIndex / (R_COUNT - 1);
    const twist = u * Math.PI * 2 * R_PERIOD + t * 0.6;
    const sway = Math.sin(t * 0.8 + u * 3.2) * 12;
    const alongX = (u - 0.5) * 260;
    const alongY = (u - 0.5) * (RIBBON_VB_H * 0.9);
    const strandSide = i % 2 === 0 ? 1 : -1;
    // In viewBox coords:
    const ribbonVbX = rCx + alongX + Math.cos(twist) * R_AMPX * strandSide + sway;
    const ribbonVbY = rCy + alongY;
    // Project to screen
    const rp = projRibbon(ribbonVbX, ribbonVbY);
    const ribbonX = rp.x;
    const ribbonY = rp.y;

    // Mesh target on screen — must match exactly where FaceMesh draws its edges.
    // FaceMesh draws at (lm.x, lm.y) inside viewBox 0..560 × 0..720 with preserveAspectRatio="xMidYMid meet".
    // So: screen_x = svgRect.left + lm.x * (svgRect.width/560)
    //              = (svgRect.cx - 280) + lm.x * scale
    //              = meshCx + (lm.x - 280) * scale
    const meshLocalX = lm.x - 280;
    const meshLocalY = lm.y - 360;
    const meshX = meshCx + meshLocalX * meshScale;
    const meshY = meshCy + meshLocalY * meshScale;

    // Seeded jitter
    const seed = Math.sin(i * 91.19) * 43758.5453;
    const jit = seed - Math.floor(seed);
    const fallJitter = (jit - 0.5) * 60;

    // Intermediate "scattered" position: small disperse, NOT off-screen.
    const fallenX = ribbonX + fallJitter * 2;
    const fallenY = ribbonY + 80 + jit * 120;

    // Position during fall phase (ribbon → fallen)
    const fallT = ease.out(pFall);
    const fx = ease.lerp(ribbonX, fallenX, fallT);
    const fy = ease.lerp(ribbonY, fallenY, fallT);

    // Position during snap phase (fallen → mesh target)
    const sx = ease.lerp(fx, meshX, pSnap);
    const sy = ease.lerp(fy, meshY, pSnap);

    // Opacity: keep visible throughout transition (no off-screen fade — they go to mesh, not off-screen).
    const offScreen = 1;

    // Radius
    const r = 2 + pSnap * 1.4;

    return { id: lm.id, x: sx, y: sy, r, opacity: offScreen };
  });

  return (
    <svg className="particle-layer" width={vw} height={vh} viewBox={`0 0 ${vw} ${vh}`}
         style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 5, opacity: layerOpacity }}>
      {particles.map((pt, i) => (
        <g key={pt.id} opacity={pt.opacity}>
          <circle cx={pt.x} cy={pt.y} r={pt.r + 3 * pSnap} fill={pointHalo}/>
          <circle cx={pt.x} cy={pt.y} r={pt.r} fill={pointColor}/>
        </g>
      ))}
    </svg>
  );
}
window.ParticleLayer = ParticleLayer;
