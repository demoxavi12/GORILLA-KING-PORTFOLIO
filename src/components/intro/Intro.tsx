"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger } from "@/motion/gsap";
import { site } from "@/data/site";
import { archive } from "@/data/archive";
import { lqip } from "@/data/lqip";
import { heroStage, prefersReducedMotion, scroller, scrollToTarget, setHeroAssemble, setHeroMoon, ui } from "@/lib/store";

/**
 * Opening — the original V2 sequence (restored from commit 4088ca2), docs/18 §4.
 *  Arrival:        a wall of archive photographs flipping, accelerating, bleeding ember.
 *  Recognition:    the name slams in as a knockout — the photographs flip inside the letters.
 *  Tension:        the letters flood solid. Silence. Black. A moon rises.
 *  Return:         (replaces the runner) the moon travels back to its place in the hero
 *                  sky and settles; the hero then reveals type → text → environment →
 *                  character (Hero.tsx).
 *
 * No black first frame: the wall is server-rendered with the same geometry V2 measured
 * in JS (CSS grid, 3/4/6 columns, 1:1.28 cells), each cell carries an inline 12px
 * placeholder of its photograph, and the timeline starts on hydration.
 */

/** QA-only: scripts set this to get the short cut on "/" (the app itself never sets it). */
const QA_SHORT = "kage:qa-short";
const FRAMES = archive.map((f) => f.src);
const CELLS = 42; // 6 × 7 covers a portrait desktop; extra rows are clipped

const MOON_BG =
  "radial-gradient(circle at 34% 30%, rgba(255,255,255,.65), transparent 38%), radial-gradient(circle at 62% 58%, rgba(170,160,140,.35) 0 6%, transparent 7%), radial-gradient(circle at 30% 64%, rgba(170,160,140,.28) 0 4%, transparent 5%), radial-gradient(circle at 70% 30%, rgba(170,160,140,.25) 0 3%, transparent 4%), var(--color-moon)";

export function Intro() {
  const pathname = usePathname();
  const home = pathname === "/";
  const root = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLDivElement>(null);
  const moon = useRef<HTMLDivElement>(null);
  const [gone, setGone] = useState(false);
  // Skip intent is captured from the very first frame (layout.tsx catches pre-hydration keys).
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

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      ui.set({ introDone: true });
      const id = requestAnimationFrame(() => setGone(true));
      return () => cancelAnimationFrame(id);
    }
    const q = gsap.utils.selector(el);
    // Every full load plays from frame 0. Deep links (/work/…) get the short cut.
    let seen = !home;
    try {
      if (sessionStorage.getItem(QA_SHORT) === "1") seen = true;
    } catch {}
    const W = window.innerWidth;
    const H = window.innerHeight;
    // Pin the page to the top while the intro owns the screen.
    const hash = window.location.hash;
    const toTop = () => {
      window.scrollTo(0, 0);
      scroller.lenis?.scrollTo(0, { immediate: true, force: true });
    };
    toTop();
    setHeroAssemble(0);
    setHeroMoon(0);

    // ── flip wall: flips only use photographs that have loaded ──
    const loaded: string[] = [];
    FRAMES.forEach((src) => {
      const im = new Image();
      im.onload = () => loaded.push(src);
      im.src = src;
    });
    const cells = q<HTMLElement>("[data-cell]");
    const imgs = cells.map((c) => c.querySelector("img")!);
    const cadence = { ms: 230 };
    let flipTimer = 0;
    let wallOn = true;
    const flip = () => {
      if (!wallOn) return;
      if (loaded.length > 2) {
        cells.forEach((c, i) => {
          if (Math.random() > 0.55) return;
          imgs[i].src = loaded[(Math.random() * loaded.length) | 0];
          gsap.fromTo(c, { rotateY: -88 }, { rotateY: 0, duration: Math.max(0.07, cadence.ms / 1300), ease: "power2.out", overwrite: true });
        });
      }
      flipTimer = window.setTimeout(flip, cadence.ms);
    };

    // Intro handed over: honour a #hash from the address bar, otherwise stay at the top.
    const finish = () => {
      toTop();
      if (hash && document.querySelector(hash)) {
        window.setTimeout(() => {
          ScrollTrigger.refresh();
          scrollToTarget(hash);
        }, 2200);
      }
    };

    // ── choreography (V2) ───────────────────────────────
    const tl = gsap.timeline({ paused: true, onComplete: () => setGone(true) });
    const shake = (at: number | string) =>
      tl.to(plate.current, { keyframes: { x: [0, -14, 11, -6, 3, 0], y: [0, 8, -6, 3, 0] }, duration: 0.32, ease: "none" }, at);

    tl.call(toTop, [], 0).fromTo(q("[data-i-meta]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, stagger: 0.06 }, 0);

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

    // Moon geometry: from its centred rise to the hero moon's exact place in the sky
    const from = { x: W / 2, y: H / 2, d: Math.min(H * 0.7, W * 0.86) };
    const to = { x: W * 0.66, y: H * 0.36, d: H * 0.36 };
    const fly = { t: 0 };
    const build = { p: 0 };
    const placeMoon = () => {
      const t = fly.t;
      const x = from.x + (to.x - from.x) * t;
      // an arc: up and over, settling into its orbit
      const y = from.y + (to.y - from.y) * t - Math.sin(Math.PI * t) * H * 0.08;
      const s = (from.d + (to.d - from.d) * gsap.parseEase("power2.inOut")(t)) / from.d;
      gsap.set(moon.current, { x: x - W / 2, y: y - H / 2, scale: s });
    };

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
      // Moon (V2: rises into the centre)
      .addLabel("moon", "out+=0.45")
      .fromTo(moon.current, { xPercent: -50, yPercent: -10, scale: 0.75, autoAlpha: 0 }, { xPercent: -50, yPercent: -50, scale: 1, autoAlpha: 1, duration: 0.75, ease: "power3.out" }, "moon")
      // …and returns to its place in the hero sky
      .addLabel("return", "moon+=0.85")
      .call(
        () => {
          const world = heroStage.world;
          if (world) {
            const m = world.moonScreen();
            to.x = m.x;
            to.y = m.y;
            to.d = m.d;
          }
          from.d = moon.current!.getBoundingClientRect().width;
        },
        [],
        "return",
      );

    if (home) {
      tl.to(fly, { t: 1, duration: 1.3, ease: "power3.inOut", onUpdate: placeMoon }, "return")
        // the black gives way to the night sky (only the sky — the rest is revealed by the hero)
        .to(plate.current, { backgroundColor: "rgba(8,8,8,0)", duration: 0.9, ease: "power2.inOut" }, "return+=0.25")
        .to(build, { p: 0.36, duration: 1.2, ease: "power2.out", onUpdate: () => setHeroAssemble(build.p) }, "return+=0.2")
        // settle: the 3D moon takes over in place
        .call(() => setHeroMoon(1), [], "return+=1.25")
        .to(moon.current, { autoAlpha: 0, duration: 0.45, ease: "power1.inOut" }, "return+=1.28")
        .call(
          () => {
            ui.set({ introDone: true });
            finish();
          },
          [],
          "return+=1.45",
        )
        .to({}, { duration: 0.2 }, "return+=1.73");
    } else {
      // inner pages have no sky to return to: the moon sets and the page is revealed
      tl.to(moon.current, { y: H * 0.35, autoAlpha: 0, scale: 0.85, duration: 0.8, ease: "power2.in" }, "return")
        .to(plate.current, { autoAlpha: 0, duration: 0.6 }, "return+=0.3")
        .call(() => {
          ui.set({ introDone: true });
          finish();
        }, [], "return+=0.3");
    }

    const skip = () => {
      if (tl.time() < tl.labels.out) {
        wallOn = false;
        tl.seek("out");
      }
    };
    skipNow.current = () => skip();
    tl.play();
    if (skipWanted.current) skip();

    // Never trap the visitor.
    const failsafe = window.setTimeout(() => {
      ui.set({ introDone: true });
      setHeroMoon(1);
      setGone(true);
    }, 14000);

    return () => {
      tl.kill();
      window.clearTimeout(flipTimer);
      window.clearTimeout(failsafe);
      skipNow.current = null;
    };
  }, [home]);

  if (gone) return null;

  return (
    <div ref={root} data-intro className="fixed inset-0 overflow-hidden" style={{ zIndex: "var(--z-loader)" }} aria-hidden>
      <p className="sr-only" role="status">
        Loading {site.name}&rsquo;s portfolio
      </p>

      <div ref={plate} className="absolute inset-0 overflow-hidden" style={{ backgroundColor: "#080808" }}>
        {/* Base the letters flood to once the wall is gone */}
        <div data-knock className="absolute inset-0 bg-bone" />

        {/* The flip wall — V2 geometry, server-rendered so it is the first painted frame */}
        {home && (
          <div
            data-wall
            className="absolute inset-0 grid grid-cols-3 content-start sm:grid-cols-4 lg:grid-cols-6"
            style={{ perspective: "900px", transform: "scale(1.42) rotate(-2.5deg)" }}
          >
            {Array.from({ length: CELLS }).map((_, i) => {
              const src = FRAMES[i % FRAMES.length];
              return (
                <div
                  key={i}
                  data-cell
                  className="relative aspect-[1/1.28] overflow-hidden bg-ink bg-cover bg-center"
                  style={{ transformOrigin: i % 2 ? "left center" : "right center", backgroundImage: lqip[src] ? `url(${lqip[src]})` : undefined }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    loading="eager"
                    fetchPriority={i < 6 ? "high" : "auto"}
                    decoding="async"
                    className="h-full w-full object-cover [filter:brightness(1.35)_contrast(1.08)_saturate(1.15)]"
                  />
                </div>
              );
            })}
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

      {/* The moon (V2) — outside the plate so it survives the plate dissolving */}
      <div
        ref={moon}
        className="absolute left-1/2 top-1/2 aspect-square w-[min(70vh,86vw)] rounded-full"
        style={{
          visibility: "hidden",
          background: MOON_BG,
          boxShadow: "0 0 120px 30px rgba(236,230,214,.18), 0 0 260px 80px rgba(224,72,44,.08)",
        }}
      />
    </div>
  );
}
