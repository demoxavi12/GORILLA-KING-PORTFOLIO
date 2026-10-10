"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger } from "@/motion/gsap";
import { site } from "@/data/site";
import { archive } from "@/data/archive";
import { heroStage, prefersReducedMotion, scroller, scrollToTarget, setHeroAssemble, setHeroMoon, ui } from "@/lib/store";
import { paintMoon } from "@/anime/paint";

/**
 * Opening — docs/18_CREATIVE_DIRECTION_V2.md §4 (V2.2).
 *
 *  Arrival      the photo wall is server-rendered: it IS the first painted frame, no
 *               blank screen. It starts flipping the moment the page hydrates.
 *  Recognition  SABYA / SACHIN / MOHANTA slam in as a knockout over the flipping wall.
 *  Tension      silence; black; a moon rises and holds.
 *  Return       the moon travels on an arc back to its place in the sky and lands
 *               exactly on the 3D moon; the night assembles around it; the name
 *               descends (Hero.tsx).
 *
 * Every full load plays from frame 0. Any key/click skips to the moon.
 */

/** QA-only: scripts set this to get the short cut on "/" (the app itself never sets it). */
const QA_SHORT = "kage:qa-short";
const FRAMES = archive.map((f) => f.src);
const CELLS = 42; // 6 × 7 covers a portrait desktop; extra rows are clipped on phones

export function Intro() {
  const pathname = usePathname();
  const home = pathname === "/";
  const root = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLDivElement>(null);
  const moon = useRef<HTMLCanvasElement>(null);
  const [gone, setGone] = useState(false);
  const skipWanted = useRef(false);
  const skipNow = useRef<(() => void) | null>(null);

  // Skip intent is captured from the very first frame (layout.tsx catches pre-hydration keys).
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
    let short = !home;
    try {
      if (sessionStorage.getItem(QA_SHORT) === "1") short = true;
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

    // The intro's moon is painted with the same painter as the 3D moon — the handoff is seamless.
    const mc = moon.current!;
    const painted = paintMoon(1024);
    mc.width = 1024;
    mc.height = 1024;
    mc.getContext("2d")!.drawImage(painted, 0, 0);

    // ── photo wall: flip only what has loaded ───────────
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

    // ── choreography ────────────────────────────────────
    const tl = gsap.timeline({ paused: true, onComplete: () => setGone(true) });
    const shake = (at: number | string) =>
      tl.to(plate.current, { keyframes: { x: [0, -14, 11, -6, 3, 0], y: [0, 8, -6, 3, 0] }, duration: 0.32, ease: "none" }, at);

    if (!short) {
      tl.call(() => flip(), [], 0)
        .fromTo(q("[data-wall]"), { scale: 1.42, rotate: -2.5 }, { scale: 1, rotate: 0, duration: 2.7, ease: "power2.inOut" }, 0)
        .to(cadence, { ms: 55, duration: 2.3, ease: "power2.in" }, 0.1)
        .fromTo(q("[data-jp] span"), { yPercent: 110 }, { yPercent: 0, duration: 0.9, stagger: 0.08, ease: "expo.out" }, 0.25)
        .fromTo(q("[data-ember]"), { opacity: 0 }, { opacity: 0.62, duration: 0.9, ease: "power1.in" }, 1.65)
        .addLabel("name", 2.55);
    } else {
      tl.set(q("[data-wall], [data-jp]"), { autoAlpha: 0 }, 0).addLabel("name", 0.1);
    }

    // Recognition — cut to black, then slam each line
    tl.to(q("[data-kbg]"), { opacity: 1, duration: 0.12, ease: "none" }, "name");
    q<HTMLElement>("[data-i-line]").forEach((line, i) => {
      const at = `name+=${i * 0.16}`;
      tl.fromTo(line, { scale: 2.3, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.42, ease: "expo.out" }, at);
      if (!short) shake(at);
    });

    // Moon handoff geometry, measured when the moon starts to travel
    const from = { x: W / 2, y: H / 2, d: mc.getBoundingClientRect().width || Math.min(H * 0.7, W * 0.86) };
    // the painted disc is 96% of its canvas, so sizes are compared as element widths
    const to = { x: W * 0.66, y: H * 0.36, d: (H * 0.36) / 0.96 };
    const fly = { t: 0 };
    const build = { p: 0 };
    const placeMoon = () => {
      const t = fly.t;
      const x = from.x + (to.x - from.x) * t;
      // an arc — up and over, settling into its orbit
      const y = from.y + (to.y - from.y) * t - Math.sin(Math.PI * t) * H * 0.1;
      const s = (from.d + (to.d - from.d) * gsap.parseEase("power2.inOut")(t)) / from.d;
      gsap.set(mc, { x: x - W / 2, y: y - H / 2, scale: s, rotate: -9 * (1 - t) });
    };

    tl.addLabel("flood", short ? "name+=0.6" : "name+=0.85")
      .call(() => {
        wallOn = false;
      }, [], "flood")
      .to(q("[data-wall]"), { autoAlpha: 0, duration: 0.5, ease: "power2.in" }, "flood")
      .to(q("[data-ember]"), { opacity: 0, duration: 0.5 }, "flood")
      // Tension — hold, then black
      .addLabel("out", short ? "flood+=0.5" : "flood+=0.8")
      .to(q("[data-i-line] > span"), { yPercent: -110, duration: 0.42, ease: "power3.in", stagger: 0.04 }, "out")
      .to(q("[data-i-meta], [data-jp]"), { autoAlpha: 0, duration: 0.3 }, "out")
      .to(q("[data-knock]"), { autoAlpha: 0, duration: 0.2 }, "out+=0.4")
      // The moon rises… and holds
      .addLabel("moon", "out+=0.45")
      .fromTo(mc, { yPercent: 0, y: H * 0.22, scale: 0.78, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.8, ease: "power3.out" }, "moon")
      // …then returns to its place in the sky
      .addLabel("travel", "moon+=1.05")
      .call(
        () => {
          const world = heroStage.world;
          if (world) {
            const m = world.moonScreen();
            to.x = m.x;
            to.y = m.y;
            to.d = m.d / 0.96;
          }
          const r = mc.getBoundingClientRect();
          from.d = r.width;
        },
        [],
        "travel",
      );

    if (home) {
      tl.to(fly, { t: 1, duration: 1.35, ease: "power3.inOut", onUpdate: placeMoon }, "travel")
        // the night assembles around the returning moon
        .to(plate.current, { backgroundColor: "rgba(8,8,8,0)", duration: 0.9, ease: "power2.inOut" }, "travel+=0.25")
        .to(build, { p: 1, duration: 2.1, ease: "power2.out", onUpdate: () => setHeroAssemble(build.p) }, "travel+=0.15")
        .call(() => setHeroMoon(1), [], "travel+=1.3")
        .to(mc, { autoAlpha: 0, duration: 0.35 }, "travel+=1.32")
        .call(
          () => {
            ui.set({ introDone: true });
            toTop();
            if (hash && document.querySelector(hash)) {
              window.setTimeout(() => {
                ScrollTrigger.refresh();
                scrollToTarget(hash);
              }, 1200);
            }
          },
          [],
          "travel+=1.15",
        )
        .to({}, { duration: 0.9 }, "travel+=1.35");
    } else {
      // no sky to return to on inner pages — the moon sets and the page is revealed
      tl.to(mc, { y: H * 0.35, autoAlpha: 0, scale: 0.85, duration: 0.8, ease: "power2.in" }, "travel")
        .to(plate.current, { autoAlpha: 0, duration: 0.6 }, "travel+=0.3")
        .call(() => ui.set({ introDone: true }), [], "travel+=0.3");
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

        {/* The photo wall — server-rendered, so it is the first painted frame */}
        {home && (
          <div data-wall className="absolute inset-0 grid grid-cols-3 content-start sm:grid-cols-4 lg:grid-cols-6" style={{ perspective: "900px" }}>
            {Array.from({ length: CELLS }).map((_, i) => (
              <div
                key={i}
                data-cell
                className="relative aspect-[1/1.28] overflow-hidden bg-[#121214]"
                style={{ transformOrigin: i % 2 ? "left center" : "right center" }}
              >
                <span className="meta absolute left-2 top-2 text-[0.6rem] text-ash/60">{archive[i % archive.length].id}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={FRAMES[i % FRAMES.length]}
                  alt=""
                  loading={i < 18 ? "eager" : "lazy"}
                  fetchPriority={i < 6 ? "high" : "auto"}
                  decoding="async"
                  className="relative h-full w-full object-cover [filter:brightness(1.35)_contrast(1.08)_saturate(1.15)]"
                />
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

        {/* 影の記録 — "record of shadows": the archive's title, set vertically over the wall */}
        <p
          data-jp
          className="absolute right-[var(--pad)] top-1/2 -translate-y-1/2 overflow-hidden text-[clamp(2.4rem,6vh,4.6rem)] font-bold leading-[1.05] text-bone mix-blend-difference [writing-mode:vertical-rl]"
        >
          {"影の記録".split("").map((c, i) => (
            <span key={i} className="inline-block">
              {c}
            </span>
          ))}
        </p>

        {/* micro typography */}
        <div className="meta absolute inset-x-0 top-0 flex h-[var(--header-h)] items-center justify-between px-pad text-bone mix-blend-difference">
          <span data-i-meta>影 — {site.initials}</span>
          <span data-i-meta>Press any key to skip</span>
        </div>
      </div>

      {/* The moon — outside the plate so it survives the plate dissolving */}
      <canvas
        ref={moon}
        className="absolute left-1/2 top-1/2 aspect-square w-[min(70vh,86vw)] rounded-full"
        style={{ visibility: "hidden", marginLeft: "calc(min(70vh, 86vw) / -2)", marginTop: "calc(min(70vh, 86vw) / -2)", filter: "drop-shadow(0 0 60px rgba(236,230,214,.22))" }}
      />
    </div>
  );
}
