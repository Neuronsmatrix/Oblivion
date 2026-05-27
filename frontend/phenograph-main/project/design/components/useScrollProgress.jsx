// Scroll progress utilities. Each Act is a sticky section whose outer wrapper
// determines how long you scroll while the sticky content is pinned.
// progress: 0 at the moment the section's top reaches the viewport top,
//           1 at the moment it releases the pin (bottom - 100vh).

const { useState, useEffect, useRef, useLayoutEffect } = React;

function useActProgress(ref) {
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
      const vh = window.innerHeight;
      const scrollable = el.offsetHeight - vh;
      if (scrollable <= 0) { target = 0; return; }
      const scrolled = Math.min(Math.max(-rect.top, 0), scrollable);
      target = scrolled / scrollable;
    };

    const tick = () => {
      // Smooth chase — 0.12 per frame ≈ ~12-frame settle
      current += (target - current) * 0.12;
      if (Math.abs(target - current) < 0.0005) current = target;
      setP(current);
      if (Math.abs(target - current) > 0.0001) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
        raf = 0;
      }
    };

    const onScroll = () => {
      read();
      if (!running) {
        running = true;
        raf = requestAnimationFrame(tick);
      }
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

// Which act index (0/1/2) is currently "owning" the viewport.
function useActiveAct(refs) {
  const [active, setActive] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const vh = window.innerHeight;
        const mid = window.scrollY + vh * 0.5;
        let best = 0;
        refs.forEach((r, i) => {
          const el = r.current; if (!el) return;
          const top = el.offsetTop;
          const bot = top + el.offsetHeight;
          if (mid >= top && mid < bot) best = i;
        });
        setActive(best);
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [refs]);
  return active;
}

// Simple easing helpers.
const ease = {
  out: t => 1 - Math.pow(1 - t, 3),
  inOut: t => t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2) / 2,
  clamp: (t, lo=0, hi=1) => Math.min(hi, Math.max(lo, t)),
  // Map v from [a,b] to [0,1], clamped.
  range: (v, a, b) => Math.min(1, Math.max(0, (v - a) / (b - a))),
  lerp: (a, b, t) => a + (b - a) * t,
};

Object.assign(window, { useActProgress, useActiveAct, ease });
