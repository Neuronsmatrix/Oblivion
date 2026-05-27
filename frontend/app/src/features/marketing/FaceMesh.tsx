import { ease } from './useScrollProgress';

// Abstract landmark layout (no identifiable face) in a 560x720 space.
const LANDMARKS: { id: string; x: number; y: number; label: string | null }[] = [
  { id: 'f1', x: 200, y: 110, label: null }, { id: 'f2', x: 260, y: 90, label: null },
  { id: 'f3', x: 320, y: 95, label: null }, { id: 'f4', x: 380, y: 120, label: null },
  { id: 't1', x: 160, y: 175, label: null }, { id: 't2', x: 420, y: 180, label: null },
  { id: 'b1', x: 195, y: 235, label: 'Supraorbital ridge' }, { id: 'b2', x: 245, y: 220, label: null },
  { id: 'b3', x: 305, y: 220, label: null }, { id: 'b4', x: 355, y: 235, label: null },
  { id: 'e1', x: 215, y: 275, label: null }, { id: 'e2', x: 255, y: 270, label: 'Palpebral fissure' },
  { id: 'e3', x: 305, y: 270, label: null }, { id: 'e4', x: 345, y: 275, label: null },
  { id: 'n1', x: 280, y: 310, label: null }, { id: 'n2', x: 280, y: 345, label: null },
  { id: 'n3', x: 280, y: 380, label: 'Nasal tip' }, { id: 'nl', x: 255, y: 395, label: null },
  { id: 'nr', x: 305, y: 395, label: null }, { id: 'p1', x: 280, y: 430, label: 'Philtrum' },
  { id: 'm1', x: 235, y: 465, label: null }, { id: 'm2', x: 275, y: 460, label: null },
  { id: 'm3', x: 305, y: 460, label: null }, { id: 'm4', x: 325, y: 465, label: null },
  { id: 'm5', x: 280, y: 490, label: null }, { id: 'ch', x: 280, y: 560, label: 'Gnathion' },
  { id: 'j1', x: 200, y: 495, label: null }, { id: 'j2', x: 220, y: 540, label: null },
  { id: 'j3', x: 245, y: 570, label: null }, { id: 'j4', x: 315, y: 570, label: null },
  { id: 'j5', x: 340, y: 540, label: null }, { id: 'j6', x: 360, y: 495, label: null },
  { id: 'ck1', x: 215, y: 395, label: 'Malar eminence' }, { id: 'ck2', x: 345, y: 395, label: null },
];

const EDGES: [string, string][] = [
  ['f1', 'f2'], ['f2', 'f3'], ['f3', 'f4'], ['f1', 't1'], ['f4', 't2'],
  ['t1', 'b1'], ['t2', 'b4'], ['f2', 'b2'], ['f3', 'b3'],
  ['b1', 'b2'], ['b2', 'b3'], ['b3', 'b4'],
  ['b1', 'e1'], ['b2', 'e2'], ['b3', 'e3'], ['b4', 'e4'],
  ['e1', 'e2'], ['e2', 'e3'], ['e3', 'e4'],
  ['e2', 'n1'], ['e3', 'n1'], ['n1', 'n2'], ['n2', 'n3'],
  ['n3', 'nl'], ['n3', 'nr'], ['nl', 'nr'],
  ['e1', 'ck1'], ['e4', 'ck2'], ['ck1', 'n2'], ['ck2', 'n2'],
  ['nl', 'p1'], ['nr', 'p1'], ['p1', 'm2'], ['p1', 'm3'],
  ['m1', 'm2'], ['m2', 'm3'], ['m3', 'm4'], ['m1', 'm5'], ['m4', 'm5'], ['m2', 'm5'], ['m3', 'm5'],
  ['ck1', 'm1'], ['ck2', 'm4'],
  ['t1', 'j1'], ['j1', 'j2'], ['j2', 'j3'], ['j3', 'ch'], ['ch', 'j4'], ['j4', 'j5'], ['j5', 'j6'], ['j6', 't2'],
  ['ck1', 'j1'], ['ck2', 'j6'], ['m1', 'j2'], ['m4', 'j5'], ['m5', 'ch'],
  ['ck1', 'b1'], ['ck2', 'b4'], ['e1', 'n1'], ['e4', 'n1'],
  ['j3', 'j4'], ['ck1', 'm2'], ['ck2', 'm3'],
];

const CONTOUR_IDS = ['f1', 'f2', 'f3', 'f4', 't2', 'j6', 'j5', 'ch', 'j2', 'j1', 't1', 'f1'];

export function FaceMesh({ progress }: { progress: number }) {
  const W = 560, H = 720;
  const p = ease.clamp(progress);
  const pSnap = ease.inOut(ease.range(p, 0.0, 0.4));
  const pMesh = ease.out(ease.range(p, 0.4, 0.72));
  const pFace = ease.out(ease.range(p, 0.68, 0.92));
  const pLabels = ease.out(ease.range(p, 0.86, 1.0));

  const byId = Object.fromEntries(LANDMARKS.map((l) => [l.id, l]));

  let contourD = '';
  const cpts = CONTOUR_IDS.map((id) => byId[id]).filter(Boolean);
  if (cpts.length) {
    contourD = `M ${cpts[0].x} ${cpts[0].y}`;
    for (let i = 1; i < cpts.length; i++) {
      const p0 = cpts[i - 1], p1 = cpts[i];
      contourD += ` Q ${p0.x} ${p0.y} ${((p0.x + p1.x) / 2).toFixed(1)} ${((p0.y + p1.y) / 2).toFixed(1)}`;
    }
    contourD += ' Z';
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" style={{ width: 'min(58vh, 520px)', height: 'min(76vh, 680px)', overflow: 'visible' }} aria-hidden>
      <defs>
        <radialGradient id="pg-faceGlow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#068176" stopOpacity="0.10" />
          <stop offset="70%" stopColor="#068176" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx={W / 2} cy={H * 0.48} rx={W * 0.48} ry={H * 0.42} fill="url(#pg-faceGlow)" opacity={pFace} />

      {contourD && <path d={contourD} fill="none" stroke="rgba(21,40,47,0.35)" strokeWidth={0.9} opacity={pFace * 0.7} strokeLinejoin="round" />}

      {EDGES.map(([a, b], i) => {
        const A = byId[a], B = byId[b];
        if (!A || !B) return null;
        const L = Math.hypot(A.x - B.x, A.y - B.y);
        const offset = (i % 5) * 0.03;
        const tEdge = ease.out(ease.range(pMesh, offset, offset + 0.55));
        return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="rgba(6,129,118,0.55)" strokeWidth={0.7} strokeDasharray={L} strokeDashoffset={L * (1 - tEdge)} opacity={0.95} />;
      })}

      {/* Landmark points: scatter in, then settle (snap). */}
      {LANDMARKS.map((lm, i) => {
        const seed = Math.sin(i * 91.7) * 1000;
        const jx = ((seed - Math.floor(seed)) * 2 - 1) * 40 * (1 - pSnap);
        const jy = ((Math.sin(i * 33.1) - Math.floor(Math.sin(i * 33.1))) * 2 - 1) * 40 * (1 - pSnap);
        return (
          <g key={lm.id} opacity={pSnap}>
            <circle cx={lm.x + jx} cy={lm.y + jy} r={4.5} fill="rgba(6,129,118,0.2)" />
            <circle cx={lm.x + jx} cy={lm.y + jy} r={2.2} fill="#068176" />
          </g>
        );
      })}

      {LANDMARKS.filter((l) => l.label).map((lm, idx) => {
        const tShown = ease.range(pLabels, idx * 0.08, idx * 0.08 + 0.5);
        const side = lm.x < W / 2 ? -1 : 1;
        const lx = lm.x + side * 90;
        const ly = lm.y + (idx % 2 === 0 ? -6 : 10);
        return (
          <g key={lm.id} opacity={tShown}>
            <line x1={lm.x} y1={lm.y} x2={lx - side * 4} y2={ly - 2} stroke="rgba(21,40,47,0.4)" strokeWidth={0.6} strokeDasharray="2 2" />
            <text x={lx} y={ly} textAnchor={side === -1 ? 'end' : 'start'} fill="rgba(21,40,47,0.85)" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.04em' }}>{lm.label}</text>
          </g>
        );
      })}
    </svg>
  );
}
