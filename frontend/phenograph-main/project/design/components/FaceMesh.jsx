// FaceMesh — Act II.
// Staged by `progress` (0..1):
//   0.00 – 0.20  : particles drift in from the right (coming from the DNA strand), scattered
//   0.20 – 0.45  : particles snap to landmark coordinates (small spring-like easing)
//   0.45 – 0.70  : mesh triangulation lines draw in between landmarks
//   0.70 – 0.90  : face contour silhouette fades in around the mesh
//   0.90 – 1.00  : feature labels tick in

// Canonical landmark layout (abstract face in 3/4 front).
// Coordinates in a 560x720 logical space, centered.
const LANDMARKS = [
  // Forehead / hairline (top arc)
  { id: 'f1', x: 200, y: 110, label: null },
  { id: 'f2', x: 260, y: 90,  label: null },
  { id: 'f3', x: 320, y: 95,  label: null },
  { id: 'f4', x: 380, y: 120, label: null },
  // Temples
  { id: 't1', x: 160, y: 175, label: null },
  { id: 't2', x: 420, y: 180, label: null },
  // Brows
  { id: 'b1', x: 195, y: 235, label: 'Supraorbital ridge' },
  { id: 'b2', x: 245, y: 220, label: null },
  { id: 'b3', x: 305, y: 220, label: null },
  { id: 'b4', x: 355, y: 235, label: null },
  // Eyes
  { id: 'e1', x: 215, y: 275, label: null },
  { id: 'e2', x: 255, y: 270, label: 'Palpebral fissure' },
  { id: 'e3', x: 305, y: 270, label: null },
  { id: 'e4', x: 345, y: 275, label: null },
  // Nasal bridge
  { id: 'n1', x: 280, y: 310, label: null },
  { id: 'n2', x: 280, y: 345, label: null },
  { id: 'n3', x: 280, y: 380, label: 'Nasal tip' },
  // Nostrils/ala
  { id: 'nl', x: 255, y: 395, label: null },
  { id: 'nr', x: 305, y: 395, label: null },
  // Philtrum
  { id: 'p1', x: 280, y: 430, label: 'Philtrum' },
  // Mouth
  { id: 'm1', x: 235, y: 465, label: null },
  { id: 'm2', x: 275, y: 460, label: null },
  { id: 'm3', x: 305, y: 460, label: null },
  { id: 'm4', x: 325, y: 465, label: null },
  { id: 'm5', x: 280, y: 490, label: null },
  // Chin
  { id: 'ch',  x: 280, y: 560, label: 'Gnathion' },
  // Jaw
  { id: 'j1', x: 200, y: 495, label: null },
  { id: 'j2', x: 220, y: 540, label: null },
  { id: 'j3', x: 245, y: 570, label: null },
  { id: 'j4', x: 315, y: 570, label: null },
  { id: 'j5', x: 340, y: 540, label: null },
  { id: 'j6', x: 360, y: 495, label: null },
  // Cheeks
  { id: 'ck1', x: 215, y: 395, label: 'Malar eminence' },
  { id: 'ck2', x: 345, y: 395, label: null },
];

// Triangulation — hand-picked edges that describe the face mesh.
const EDGES = [
  // top arc
  ['f1','f2'],['f2','f3'],['f3','f4'],['f1','t1'],['f4','t2'],
  // temples to brows
  ['t1','b1'],['t2','b4'],['f2','b2'],['f3','b3'],
  // brow line
  ['b1','b2'],['b2','b3'],['b3','b4'],
  // brow to eye
  ['b1','e1'],['b2','e2'],['b3','e3'],['b4','e4'],
  // eye line
  ['e1','e2'],['e2','e3'],['e3','e4'],
  // eyes to nose
  ['e2','n1'],['e3','n1'],['n1','n2'],['n2','n3'],
  ['n3','nl'],['n3','nr'],['nl','nr'],
  // eyes to cheeks
  ['e1','ck1'],['e4','ck2'],['ck1','n2'],['ck2','n2'],
  // nose to mouth
  ['nl','p1'],['nr','p1'],['p1','m2'],['p1','m3'],
  // mouth
  ['m1','m2'],['m2','m3'],['m3','m4'],['m1','m5'],['m4','m5'],['m2','m5'],['m3','m5'],
  // cheeks to mouth
  ['ck1','m1'],['ck2','m4'],
  // jaw
  ['t1','j1'],['j1','j2'],['j2','j3'],['j3','ch'],['ch','j4'],['j4','j5'],['j5','j6'],['j6','t2'],
  ['ck1','j1'],['ck2','j6'],['m1','j2'],['m4','j5'],['m5','ch'],
  // cross braces for triangulation density
  ['ck1','b1'],['ck2','b4'],['e1','n1'],['e4','n1'],
  ['j2','j3'],['j3','j4'],['ck1','m2'],['ck2','m3'],
];

// Soft face contour (bezier path around the outer landmarks).
// Rendered as a smoothed closed curve.
const CONTOUR_IDS = ['f1','f2','f3','f4','t2','j6','j5','ch','j2','j1','t1','f1'];

function FaceMesh({ progress, variant }) {
  const W = 560, H = 720;
  const darkMode = variant === 'B';

  const p = ease.clamp(progress);
  // Stage progresses
  const pArrive = ease.out(ease.range(p, 0.00, 0.25));     // particles drifting in
  const pSnap   = ease.inOut(ease.range(p, 0.20, 0.48));   // snap to position
  const pMesh   = ease.out(ease.range(p, 0.45, 0.72));     // mesh draw-in
  const pFace   = ease.out(ease.range(p, 0.68, 0.92));     // face contour
  const pLabels = ease.out(ease.range(p, 0.88, 1.00));     // labels in

  // Landmark positions are now STATIC at their final viewBox coords.
  // The shared ParticleLayer owns the incoming motion (DNA ribbon → mesh).
  // FaceMesh just renders edges, contour and labels at fixed positions, fading them in.
  const landmarkPoints = LANDMARKS.map((lm, i) => ({ ...lm, x: lm.x, y: lm.y, r: 2.5, arrived: 1 }));

  // Hide FaceMesh's own landmark points — shared ParticleLayer owns them now.
  // Only render mesh edges, contour, labels.
  const lmById = Object.fromEntries(landmarkPoints.map(p => [p.id, p]));

  const strokeMuted = darkMode ? 'rgba(231,225,212,0.18)' : 'rgba(21,40,47,0.18)';
  const strokeMesh = darkMode ? 'rgba(162,181,104,0.55)' : 'rgba(6,129,118,0.55)';
  const strokeContour = darkMode ? 'rgba(241,237,227,0.55)' : 'rgba(21,40,47,0.35)';
  const pointColor = darkMode ? '#a2b568' : '#068176';
  const pointHalo = darkMode ? 'rgba(162,181,104,0.25)' : 'rgba(6,129,118,0.2)';

  // Contour path
  const contourPts = CONTOUR_IDS.map(id => lmById[id]).filter(Boolean);
  let contourD = '';
  if (contourPts.length) {
    contourD = `M ${contourPts[0].x.toFixed(1)} ${contourPts[0].y.toFixed(1)}`;
    for (let i = 1; i < contourPts.length; i++) {
      const p0 = contourPts[i-1], p1 = contourPts[i];
      const mx = (p0.x + p1.x)/2, my = (p0.y + p1.y)/2;
      contourD += ` Q ${p0.x.toFixed(1)} ${p0.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
    }
    contourD += ' Z';
  }

  // Mesh edge total length (used for strokeDasharray draw-in)
  const edgeLens = EDGES.map(([a,b]) => {
    const A = lmById[a], B = lmById[b];
    if (!A || !B) return 0;
    return Math.hypot(A.x - B.x, A.y - B.y);
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
         style={{ width: 'min(62vh, 560px)', height: 'min(80vh, 720px)', overflow: 'visible' }}>
      <defs>
        <radialGradient id="faceGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor={darkMode ? '#068176' : '#068176'} stopOpacity="0.10"/>
          <stop offset="70%" stopColor="#068176" stopOpacity="0"/>
        </radialGradient>
      </defs>

      {/* Allow particles to render outside the viewBox so they look continuous with the falling DNA */}
      <g style={{ overflow: 'visible' }}>

      {/* Soft glow behind face, grows with pFace */}
      <ellipse cx={W/2} cy={H*0.48} rx={W*0.48} ry={H*0.42}
               fill="url(#faceGlow)" opacity={pFace} />

      {/* Face contour (drawn after mesh for layering — subtle) */}
      {contourD && (
        <path d={contourD} fill="none" stroke={strokeContour} strokeWidth={0.9}
              opacity={pFace * 0.7} strokeLinejoin="round"/>
      )}

      {/* Mesh edges */}
      <g>
        {EDGES.map(([a, b], i) => {
          const A = lmById[a], B = lmById[b];
          if (!A || !B) return null;
          const L = edgeLens[i];
          // Stagger draw: earlier edges (shorter, near-center) draw first.
          const offset = (i % 5) * 0.03;
          const tEdge = ease.out(ease.range(pMesh, offset, offset + 0.55));
          const dash = L;
          return (
            <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                  stroke={strokeMesh} strokeWidth={0.7}
                  strokeDasharray={dash} strokeDashoffset={dash * (1 - tEdge)}
                  opacity={Math.min(A.arrived, B.arrived) * 0.95} />
          );
        })}
      </g>

      {/* Landmark points owned by shared ParticleLayer — omitted here */}

      {/* Feature labels */}
      <g>
        {landmarkPoints.filter(l => l.label).map((lm, idx) => {
          const tShown = ease.range(pLabels, idx * 0.08, idx * 0.08 + 0.5);
          // Offset label to the side; alternate left/right by x position.
          const side = lm.x < W/2 ? -1 : 1;
          const lx = lm.x + side * 90;
          const ly = lm.y + (idx % 2 === 0 ? -6 : 10);
          const color = darkMode ? 'rgba(241,237,227,0.85)' : 'rgba(21,40,47,0.85)';
          const line = darkMode ? 'rgba(241,237,227,0.4)' : 'rgba(21,40,47,0.4)';
          return (
            <g key={lm.id} opacity={tShown} style={{ transition: 'opacity 200ms linear' }}>
              <line x1={lm.x} y1={lm.y} x2={lx - side * 4} y2={ly - 2}
                    stroke={line} strokeWidth={0.6} strokeDasharray="2 2"/>
              <text x={lx} y={ly}
                    textAnchor={side === -1 ? 'end' : 'start'}
                    fill={color}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.04em' }}>
                {lm.label}
              </text>
            </g>
          );
        })}
      </g>
      </g>
    </svg>
  );
}
window.FaceMesh = FaceMesh;
