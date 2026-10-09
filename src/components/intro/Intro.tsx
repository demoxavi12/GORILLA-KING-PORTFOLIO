"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "@/motion/gsap";
import { site } from "@/data/site";
import { archive } from "@/data/archive";
import { prefersReducedMotion, scroller, scrollToTarget, ui } from "@/lib/store";
import { ScrollTrigger } from "@/motion/gsap";
import { drawNinja, runPose, FIGURE_HEIGHT } from "@/anime/ninja";

/**
 * Opening — docs/18_CREATIVE_DIRECTION_V2.md §4.
 *  Arrival:        a wall of archive photographs flipping, accelerating, bleeding ember.
 *  Recognition:    the name slams in as a knockout — the photographs flip inside the letters.
 *  Tension:        the letters flood solid. Silence. Black. A moon rises.
 *  Transformation: the shadow runner crosses the moon; the intro tears away behind him.
 */

/** QA-only: scripts set this to get the short cut on "/" (the app itself never sets it). */
const QA_SHORT = "kage:qa-short";
const FRAMES = archive.map((f) => f.src);

function gridFor(w: number, h: number) {
  const cols = w < 640 ? 3 : w < 1024 ? 4 : 6;
  const cw = w / cols;
  const ch = cw * 1.28;
  const rows = Math.ceil(h / ch) + 1;
  return { cols, rows, cw, ch };
}

export function Intro() {
  const root = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLDivElement>(null);
  const runner = useRef<HTMLCanvasElement>(null);
  const [grid, setGrid] = useState<{ cols: number; rows: number; cw: number; ch: number } | null>(null);
  const [gone, setGone] = useState(false);
  // Skip intent is captured from the very first frame — before the timeline exists.
  const skipWanted = useRef(false);
  const skipNow = useRef<(() => void) | null>(null);

  useEffect(() => {
    if ((window as Window & { __kageSkip?: number }).__kageSkip) skipWanted.current = true;
    const want = () => {
      skipWanted.current = true;
      skipNow.current?.();
    };
    window.addEventListener("keydown", want);
    window.addEventListener("pointerdown", want);
    return () => {
      window.removeEventListener("keydown", want);
      window.removeEventListener("pointerdown", want);
    };
  }, []);

  // Size the wall to the viewport once.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (prefersReducedMotion()) {
        ui.set({ introDone: true });
        setGone(true);
        return;
      }
      setGrid(gridFor(window.innerWidth, window.innerHeight));
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!grid || !root.current) return;
    const el = root.current;
    const q = gsap.utils.selector(el);
    // Every full load plays from frame 0. Deep links (/work/…) get the short cut —
    // name → moon → runner — so a shared case-study link isn't held for 8 s.
    let seen = window.location.pathname !== "/";
    try {
      if (sessionStorage.getItem(QA_SHORT) === "1") seen = true;
    } catch {}
    // Pin the page to the top while the intro owns the screen.
    const hash = window.location.hash;
    const toTop = () => {
      window.scrollTo(0, 0);
      scroller.lenis?.scrollTo(0, { immediate: true, force: true });
    };
    toTop();

    // ── preload ─────────────────────────────────────────
    let cancelled = false;
    const preload = Promise.race([
      Promise.all(
        FRAMES.map(
          (src) =>
            new Promise<void>((res) => {
              const im = new Image();
              im.onload = im.onerror = () => res();
              im.src = src;
            }),
        ),
      ),
      new Promise<void>((r) => setTimeout(r, 2500)),
    ]);

    // ── runner canvas ───────────────────────────────────
    const canvas = runner.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    const run = { x: -0.3 * W, on: false, start: 0 };
    const scale = (Math.min(H * 0.44, W * 0.55)) / FIGURE_HEIGHT;
    const ground = H * 0.66;
    const lines: { x: number; y: number; len: number; v: number; a: number }[] = [];
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      ctx.clearRect(0, 0, W, H);
      if (!run.on) return;
      const t = (now - run.start) / 1000;
      // speed lines
      if (lines.length < 70) {
        for (let i = 0; i < 4; i++)
          lines.push({
            x: run.x - Math.random() * 120 * scale,
            y: ground - Math.random() * FIGURE_HEIGHT * scale * 1.2 - 10,
            len: 80 + Math.random() * 380,
            v: 0.6 + Math.random() * 0.8,
            a: 0.25 + Math.random() * 0.5,
          });
      }
      ctx.lineCap = "round";
      for (let i = lines.length - 1; i >= 0; i--) {
        const l = lines[i];
        l.a -= 0.018;
        l.x -= 12 * l.v;
        if (l.a <= 0) {
          lines.splice(i, 1);
          continue;
        }
        ctx.strokeStyle = `rgba(241,239,232,${l.a})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(l.x, l.y);
        ctx.lineTo(l.x - l.len, l.y);
        ctx.stroke();
      }
      const p = t * Math.PI * 2 * 3.3;
      // afterimages
      [3, 2, 1].forEach((k) =>
        drawNinja(ctx, runPose(p - k * 0.45), {
          x: run.x - k * 62 * scale,
          y: ground,
          scale,
          t: t - k * 0.04,
          color: "#e0482c",
          alpha: 0.32 / k,
        }),
      );
      drawNinja(ctx, runPose(p), { x: run.x, y: ground, scale, t, color: "#050505" });
    };
    raf = requestAnimationFrame(loop);

    // ── flip wall cadence ───────────────────────────────
    const cells = q<HTMLElement>("[data-cell]");
    const imgs = cells.map((c) => c.querySelector("img")!);
    const cadence = { ms: 230 };
    let flipTimer = 0;
    let wallOn = true;
    const flip = () => {
      if (!wallOn) return;
      cells.forEach((c, i) => {
        if (Math.random() > 0.55) return;
        imgs[i].src = FRAMES[(Math.random() * FRAMES.length) | 0];
        gsap.fromTo(c, { rotateY: -88 }, { rotateY: 0, duration: Math.max(0.07, cadence.ms / 1300), ease: "power2.out", overwrite: true });
      });
      flipTimer = window.setTimeout(flip, cadence.ms);
    };

    // ── choreography ────────────────────────────────────
    // Intro handed over: honour a #hash from the address bar, otherwise stay at the top.
    const finish = () => {
      toTop();
      if (hash && document.querySelector(hash)) {
        window.setTimeout(() => {
          ScrollTrigger.refresh();
          scrollToTarget(hash);
        }, 900);
      }
    };

    const tl = gsap.timeline({ paused: true, onComplete: () => setGone(true) });
    const shake = (at: number | string) =>
      tl.to(plate.current, { keyframes: { x: [0, -14, 11, -6, 3, 0], y: [0, 8, -6, 3, 0] }, duration: 0.32, ease: "none" }, at);

    tl.call(toTop, [], 0).set(el, { autoAlpha: 1 }).from(q("[data-i-meta]"), { autoAlpha: 0, duration: 0.4, stagger: 0.06 }, 0);

    if (!seen) {
      tl.call(() => flip(), [], 0.05)
        .fromTo(q("[data-wall]"), { scale: 1.42, rotate: -2.5 }, { scale: 1, rotate: 0, duration: 2.7, ease: "power2.inOut" }, 0)
        .to(cadence, { ms: 55, duration: 2.3, ease: "power2.in" }, 0.1)
        .fromTo(q("[data-ember]"), { opacity: 0 }, { opacity: 0.62, duration: 0.9, ease: "power1.in" }, 1.65)
        .addLabel("name", 2.55);
    } else {
      tl.set(q("[data-wall]"), { autoAlpha: 0 }, 0).addLabel("name", 0.15);
    }

    // Recognition — cut to black, then slam each line
    tl.to(q("[data-kbg]"), { opacity: 1, duration: 0.12, ease: "none" }, "name");
    q<HTMLElement>("[data-i-line]").forEach((line, i) => {
      const at = `name+=${i * 0.16}`;
      tl.fromTo(line, { scale: 2.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.42, ease: "expo.out" }, at);
      if (!seen) shake(at);
    });
    tl.addLabel("flood", seen ? "name+=0.6" : "name+=0.85")
      .call(() => {
        wallOn = false;
      }, [], "flood")
      .to(q("[data-wall]"), { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "flood")
      .to(q("[data-ember]"), { opacity: 0, duration: 0.5 }, "flood")
      .fromTo(q("[data-i-cap]"), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.5 }, "flood+=0.25")
      // Tension — hold, then black
      .addLabel("out", seen ? "flood+=0.55" : "flood+=0.8")
      .to(q("[data-i-line] > span"), { yPercent: -110, duration: 0.42, ease: "power3.in", stagger: 0.04 }, "out")
      .to(q("[data-i-cap], [data-i-meta]"), { autoAlpha: 0, duration: 0.3 }, "out")
      .to(q("[data-knock]"), { autoAlpha: 0, duration: 0.2 }, "out+=0.4")
      // Moon
      .addLabel("moon", "out+=0.45")
      .fromTo(q("[data-moon]"), { xPercent: -50, yPercent: -10, scale: 0.75, autoAlpha: 0 }, { xPercent: -50, yPercent: -50, scale: 1, autoAlpha: 1, duration: 0.75, ease: "power3.out" }, "moon")
      // Transformation — the run
      .addLabel("run", "moon+=0.5")
      .call(
        () => {
          run.on = true;
          run.start = performance.now();
          ui.set({ introDone: true });
          finish();
        },
        [],
        "run",
      )
      .to(
        run,
        {
          x: W * 1.35,
          duration: seen ? 0.95 : 1.15,
          ease: "power1.in",
          // the curtain trails just behind the runner's heels
          onUpdate: () => {
            if (plate.current) plate.current.style.clipPath = `inset(0% 0% 0% ${Math.max(0, run.x - 40 * scale)}px)`;
          },
        },
        "run",
      )
      .to({}, { duration: 0.15 });

    const skip = () => {
      if (tl.time() < tl.labels.out) {
        wallOn = false;
        tl.seek("out");
      }
    };
    // A skipped intro doesn't need the photographs: start the short cut immediately.
    let started = false;
    const begin = () => {
      if (started || cancelled) return;
      started = true;
      tl.play();
      if (skipWanted.current) skip();
    };
    skipNow.current = () => {
      if (started) skip();
      else begin();
    };
    if (skipWanted.current) begin();
    else preload.then(begin);

    // Never trap the visitor.
    const failsafe = window.setTimeout(() => {
      ui.set({ introDone: true });
      setGone(true);
    }, 14000);

    return () => {
      cancelled = true;
      tl.kill();
      cancelAnimationFrame(raf);
      window.clearTimeout(flipTimer);
      window.clearTimeout(failsafe);
      skipNow.current = null;
    };
  }, [grid]);

  if (gone) return null;

  return (
    <div ref={root} className="fixed inset-0" style={{ zIndex: "var(--z-loader)", visibility: "hidden" }} aria-hidden>
      <p className="sr-only" role="status">
        Loading {site.name}&rsquo;s portfolio
      </p>

      <div ref={plate} className="absolute inset-0 overflow-hidden bg-ink" style={{ clipPath: "inset(0% 0% 0% 0px)" }}>
        {/* Base the letters flood to once the wall is gone */}
        <div data-knock className="absolute inset-0 bg-bone" />

        {/* The flip wall */}
        {grid && (
          <div
            data-wall
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: `repeat(${grid.cols}, ${grid.cw}px)`, gridAutoRows: `${grid.ch}px`, perspective: "900px" }}
          >
            {Array.from({ length: grid.cols * grid.rows }).map((_, i) => (
              <div key={i} data-cell className="relative overflow-hidden bg-ink" style={{ transformOrigin: i % 2 ? "left center" : "right center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={FRAMES[i % FRAMES.length]} alt="" className="h-full w-full object-cover [filter:brightness(1.35)_contrast(1.08)_saturate(1.15)]" decoding="async" />
              </div>
            ))}
          </div>
        )}
        <div data-ember className="absolute inset-0 bg-ember opacity-0 mix-blend-multiply" />

        {/* Knockout name: white letters on black, multiplied over the wall */}
        <div data-knock className="absolute inset-0 isolate flex flex-col items-center justify-center mix-blend-multiply">
          <div data-kbg className="absolute inset-0 bg-ink opacity-0" />
          {[site.firstName, site.middleName, site.lastName].map((w) => (
            <div key={w} data-i-line className="relative overflow-hidden" style={{ visibility: "hidden" }}>
              <span className="font-display block text-center text-[clamp(4rem,min(21vw,25vh),20rem)] leading-[0.86] text-white">{w}</span>
            </div>
          ))}
        </div>
        <p data-i-cap className="meta absolute inset-x-0 bottom-[12vh] text-center text-bone" style={{ visibility: "hidden" }}>
          {site.role} — {site.focus}
        </p>

        {/* Moon */}
        <div
          data-moon
          className="absolute left-1/2 top-1/2 aspect-square w-[min(70vh,86vw)] rounded-full"
          style={{
            visibility: "hidden",
            background:
              "radial-gradient(circle at 34% 30%, rgba(255,255,255,.65), transparent 38%), radial-gradient(circle at 62% 58%, rgba(170,160,140,.35) 0 6%, transparent 7%), radial-gradient(circle at 30% 64%, rgba(170,160,140,.28) 0 4%, transparent 5%), radial-gradient(circle at 70% 30%, rgba(170,160,140,.25) 0 3%, transparent 4%), var(--color-moon)",
            boxShadow: "0 0 120px 30px rgba(236,230,214,.18), 0 0 260px 80px rgba(224,72,44,.08)",
          }}
        />

        {/* micro typography */}
        <div className="meta absolute inset-x-0 top-0 flex h-[var(--header-h)] items-center justify-between px-pad text-bone mix-blend-difference">
          <span data-i-meta>影 — {site.initials}</span>
          <span data-i-meta>Archive · {String(FRAMES.length).padStart(3, "0")} frames</span>
        </div>
        <div className="meta absolute inset-x-0 bottom-0 flex items-center justify-between px-pad pb-5 text-bone mix-blend-difference">
          <span data-i-meta>● Rec</span>
          <span data-i-meta>Press any key to skip</span>
        </div>
      </div>

      {/* The runner lives outside the curtain so he is never clipped */}
      <canvas ref={runner} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
