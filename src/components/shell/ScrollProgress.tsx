"use client";

import { useEffect, useRef } from "react";

/** "00%" page progress. Writes straight to the DOM — no React renders on scroll. */
export function ScrollProgress({ className }: { className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    let last = -1;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.min(99, Math.round((window.scrollY / max) * 100)) : 0;
      if (pct !== last && ref.current) {
        last = pct;
        ref.current.textContent = `${String(pct).padStart(2, "0")}%`;
      }
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`} aria-hidden>
      00%
    </span>
  );
}
