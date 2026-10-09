"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger } from "@/motion/gsap";
import { scrollToTarget, ui } from "@/lib/store";
import { drawNinja, runPose, FIGURE_HEIGHT } from "@/anime/ninja";

/**
 * Route transitions — the shadow dash (signature, docs/18 §3).
 * Cover:  the runner sprints across; a black curtain is dragged in behind him.
 * Swap:   the route changes beneath the curtain (project title held on it).
 * Reveal: he crosses again and the curtain tears away behind his heels.
 */

type GoOptions = { from?: HTMLElement | null; label?: { index: string; title: string } };
type Ctx = { go: (href: string, opts?: GoOptions) => void; busy: boolean };

const TransitionCtx = createContext<Ctx>({ go: () => {}, busy: false });
export const useTransition = () => useContext(TransitionCtx);

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const overlay = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const runner = useRef<HTMLCanvasElement>(null);
  const pending = useRef<{ path: string; hash: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [label, setLabel] = useState<GoOptions["label"]>();

  const reduce = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** Sprint across the screen once. `mode` decides which side of him is curtain. */
  const dash = useCallback((mode: "cover" | "reveal", duration: number) => {
    return new Promise<void>((resolve) => {
      const c = runner.current!;
      const el = overlay.current!;
      const ctx = c.getContext("2d")!;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const W = window.innerWidth;
      const H = window.innerHeight;
      c.width = W * dpr;
      c.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.style.visibility = "visible";
      const scale = Math.min(H * 0.36, W * 0.5) / FIGURE_HEIGHT;
      const ground = H * 0.7;
      const s = { x: -0.25 * W };
      const lines: { x: number; y: number; len: number; a: number }[] = [];
      const t0 = performance.now();
      gsap.set(el, { autoAlpha: 1 });
      let raf = 0;
      const frame = () => {
        raf = requestAnimationFrame(frame);
        const t = (performance.now() - t0) / 1000;
        ctx.clearRect(0, 0, W, H);
        const heel = s.x - 30 * scale;
        el.style.clipPath = mode === "cover" ? `inset(0 ${Math.max(0, W - heel)}px 0 0)` : `inset(0 0 0 ${Math.max(0, heel)}px)`;
        for (let i = 0; i < 3; i++)
          lines.push({ x: s.x - Math.random() * 80 * scale, y: ground - Math.random() * FIGURE_HEIGHT * scale * 1.1, len: 60 + Math.random() * 300, a: 0.5 });
        ctx.lineWidth = 1;
        for (let i = lines.length - 1; i >= 0; i--) {
          const l = lines[i];
          l.a -= 0.03;
          l.x -= 10;
          if (l.a <= 0) {
            lines.splice(i, 1);
            continue;
          }
          ctx.strokeStyle = `rgba(241,239,232,${l.a})`;
          ctx.beginPath();
          ctx.moveTo(l.x, l.y);
          ctx.lineTo(l.x - l.len, l.y);
          ctx.stroke();
        }
        const p = t * Math.PI * 2 * 3.4;
        [2, 1].forEach((k) =>
          drawNinja(ctx, runPose(p - k * 0.45), { x: s.x - k * 60 * scale, y: ground, scale, t: t - k * 0.04, color: "#e0482c", alpha: 0.3 / k }),
        );
        // He runs over both the curtain (black) and the page — a bone rim keeps him visible on black.
        drawNinja(ctx, runPose(p), { x: s.x, y: ground, scale, t, color: "#050505", rim: "rgba(241,239,232,0.85)" });
      };
      frame();
      gsap.to(s, {
        x: W * 1.3,
        duration,
        ease: "power1.in",
        onComplete: () => {
          cancelAnimationFrame(raf);
          ctx.clearRect(0, 0, W, H);
          c.style.visibility = "hidden";
          el.style.clipPath = mode === "cover" ? "inset(0 0 0 0)" : `inset(0 0 0 100%)`;
          resolve();
        },
      });
    });
  }, []);

  const go = useCallback(
    (href: string, opts: GoOptions = {}) => {
      const url = new URL(href, window.location.href);
      const hash = url.hash || null;
      const path = url.pathname;

      if (path === window.location.pathname) {
        if (hash) scrollToTarget(hash);
        else scrollToTarget(0);
        return;
      }
      if (busy) return;
      const el = overlay.current;
      if (!el) {
        router.push(path);
        return;
      }
      setBusy(true);
      setLabel(opts.label);
      pending.current = { path, hash };
      ui.set({ menuOpen: false });

      if (reduce()) {
        gsap.set(el, { clipPath: "inset(0 0 0 0)", autoAlpha: 0 });
        gsap.to(el, { autoAlpha: 1, duration: 0.2, onComplete: () => router.push(path) });
        return;
      }
      gsap.fromTo(titleRef.current, { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.5, delay: 0.35 });
      dash("cover", 0.85).then(() => router.push(path));
    },
    [busy, router, dash],
  );

  // Route committed → settle layout under the curtain, then reveal.
  useEffect(() => {
    const p = pending.current;
    const el = overlay.current;
    if (!p || !el || p.path !== pathname) return;
    pending.current = null;

    let raf = 0;
    let timer = 0;
    const settle = (tries: number, done: () => void) => {
      ScrollTrigger.refresh();
      const target = p.hash ? document.querySelector<HTMLElement>(p.hash) : null;
      if (!target) return done();
      const top = target.getBoundingClientRect().top;
      if (Math.abs(top) < 2 || tries <= 0) return done();
      scrollToTarget(window.scrollY + top, true);
      timer = window.setTimeout(() => settle(tries - 1, done), 90);
    };
    const finish = () => {
      gsap.set(el, { autoAlpha: 0, clipPath: "inset(0 0 0 100%)" });
      setBusy(false);
      setLabel(undefined);
    };
    const reveal = () => {
      if (reduce()) {
        gsap.to(el, { autoAlpha: 0, duration: 0.25, onComplete: finish });
        return;
      }
      gsap.to(titleRef.current, { autoAlpha: 0, y: -24, duration: 0.3, delay: 0.15 });
      timer = window.setTimeout(() => dash("reveal", 0.95).then(finish), 260);
    };
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => settle(6, reveal));
    });
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [pathname, dash]);

  return (
    <TransitionCtx.Provider value={{ go, busy }}>
      {children}
      <div
        ref={overlay}
        aria-hidden
        className="fixed inset-0 bg-ink"
        style={{ zIndex: "var(--z-transition)", visibility: "hidden", clipPath: "inset(0 0 0 100%)" }}
      >
        <div ref={titleRef} className="absolute inset-0 flex flex-col justify-end px-pad pb-[8vh]" style={{ visibility: "hidden" }}>
          {label && (
            <>
              <span className="meta text-ember">Cut {label.index}</span>
              <span className="font-display mt-3 text-[clamp(3.5rem,13vw,15rem)]">{label.title}</span>
            </>
          )}
        </div>
      </div>
      <canvas
        ref={runner}
        aria-hidden
        className="pointer-events-none fixed inset-0 h-full w-full"
        style={{ zIndex: "var(--z-transition)", visibility: "hidden" }}
      />
    </TransitionCtx.Provider>
  );
}
