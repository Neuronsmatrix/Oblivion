import { useEffect, useRef, useState } from 'react';
import { ease } from './useScrollProgress';

// Double-strand reference ribbon: two offset sine curves with base-pair rungs.
// progress 0→1: calm ribbon → compresses → rungs shed downward and fade.
const RIBBON = { count: 60, ampX: 320, periodY: 2.4 };

export function DnaRibbon({ progress }: { progress: number }) {
  const t0 = useRef(performance.now());
  const tRef = useRef(performance.now());
  const [, force] = useState(0);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      tRef.current = performance.now();
      force((v) => (v + 1) % 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const t = ((tRef.current - t0.current) / 1000) * 0.6;
  const W = 1600, H = 900;
  const cx = W * 0.58, cy = H * 0.52;

  const dissolve = ease.range(progress, 0.45, 1);
  const compress = ease.inOut(ease.range(progress, 0, 0.6));
  const strandOpacity = (1 - dissolve) * 0.85;

  const strandA: { x: number; y: number }[] = [];
  const strandB: { x: number; y: number }[] = [];
  const rungs: { a: { x: number; y: number }; b: { x: number; y: number }; opacity: number }[] = [];

  for (let i = 0; i < RIBBON.count; i++) {
    const u = i / (RIBBON.count - 1);
    const alongX = (u - 0.5) * 260;
    const alongY = (u - 0.5) * (H * 0.9) * (1 - compress * 0.08);
    const twist = u * Math.PI * 2 * RIBBON.periodY + t * 0.6;
    const sway = Math.sin(t * 0.8 + u * 3.2) * 12;
    const xA = cx + alongX + Math.cos(twist) * RIBBON.ampX * (1 - compress * 0.1) + sway;
    const xB = cx + alongX - Math.cos(twist) * RIBBON.ampX * (1 - compress * 0.1) + sway;
    const y = cy + alongY;

    const sA = Math.sin(i * 12.9898) * 43758.5453;
    const rA = (sA - Math.floor(sA)) * 2 - 1;
    const sB = Math.sin(i * 78.233) * 43758.5453;
    const rB = (sB - Math.floor(sB)) * 2 - 1;
    const disp = dissolve * (20 + rA * 30);
    const dispDown = dissolve * (1200 + rB * 400);

    const pA = { x: xA + rA * disp, y: y + dispDown };
    const pB = { x: xB + rB * disp, y: y + dispDown };
    strandA.push(pA);
    strandB.push(pB);
    rungs.push({ a: pA, b: pB, opacity: (1 - dissolve) * (0.35 + 0.45 * Math.abs(Math.cos(twist))) });
  }

  const strandPath = (pts: { x: number; y: number }[]) => {
    if (!pts.length) return '';
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1], p1 = pts[i];
      d += ` Q ${((p0.x + p1.x) / 2).toFixed(1)} ${p0.y.toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return d;
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      aria-hidden
    >
      <defs>
        <linearGradient id="pg-strandFade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="white" stopOpacity="0" />
          <stop offset="20%" stopColor="white" stopOpacity="1" />
          <stop offset="80%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <mask id="pg-strandMask"><rect width={W} height={H} fill="url(#pg-strandFade)" /></mask>
      </defs>

      <g mask="url(#pg-strandMask)" style={{ opacity: strandOpacity, transition: 'opacity 300ms linear' }}>
        {rungs.map((r, i) => (
          <line key={i} x1={r.a.x} y1={r.a.y} x2={r.b.x} y2={r.b.y} stroke="rgba(21,40,47,0.22)" strokeWidth={0.8} style={{ opacity: r.opacity }} />
        ))}
        <path d={strandPath(strandA)} stroke="rgba(6,129,118,0.75)" strokeWidth={1.4} fill="none" strokeLinecap="round" />
        <path d={strandPath(strandB)} stroke="rgba(71,93,46,0.6)" strokeWidth={1.1} fill="none" strokeLinecap="round" />
      </g>

      <line x1={cx + 520} y1={H * 0.12} x2={cx + 520} y2={H * 0.88} stroke="rgba(21,40,47,0.06)" strokeDasharray="2 6" strokeWidth={0.6} />
    </svg>
  );
}
