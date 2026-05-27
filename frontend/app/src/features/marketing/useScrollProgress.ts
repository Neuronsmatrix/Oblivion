import { useEffect, useState } from 'react';
import type { RefObject } from 'react';

/**
 * Progress (0..1) of a sticky section: 0 when its top reaches the viewport top,
 * 1 when the pin releases. Smoothly chased for a cinematic feel.
 */
export function useActProgress(ref: RefObject<HTMLElement | null>): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    let target = 0;
    let current = 0;
    let running = false;

    const read = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const scrollable = el.offsetHeight - window.innerHeight;
      if (scrollable <= 0) { target = 0; return; }
      target = Math.min(Math.max(-rect.top, 0), scrollable) / scrollable;
    };

    const tick = () => {
      current += (target - current) * 0.12;
      if (Math.abs(target - current) < 0.0005) current = target;
      setP(current);
      if (Math.abs(target - current) > 0.0001) raf = requestAnimationFrame(tick);
      else { running = false; raf = 0; }
    };

    const onScroll = () => {
      read();
      if (!running) { running = true; raf = requestAnimationFrame(tick); }
    };

    read();
    current = target;
    setP(current);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref]);
  return p;
}

/** Which act index (0/1/2) owns the viewport mid-line. */
export function useActiveAct(refs: RefObject<HTMLElement | null>[]): number {
  const [active, setActive] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const mid = window.scrollY + window.innerHeight * 0.5;
        let best = 0;
        refs.forEach((r, i) => {
          const el = r.current;
          if (!el) return;
          if (mid >= el.offsetTop && mid < el.offsetTop + el.offsetHeight) best = i;
        });
        setActive(best);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs);
  return active;
}

export const ease = {
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  inOut: (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  clamp: (t: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, t)),
  range: (v: number, a: number, b: number) => Math.min(1, Math.max(0, (v - a) / (b - a))),
  lerp: (a: number, b: number, t: number) => a + (b - a) * t,
};
