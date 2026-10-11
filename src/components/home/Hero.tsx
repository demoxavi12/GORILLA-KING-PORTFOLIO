"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/motion/gsap";
import { site } from "@/data/site";
import { heroStage, prefersReducedMotion, setHeroAssemble, setHeroCharacter, setHeroMoon, useUI } from "@/lib/store";
import type { NightScene } from "@/anime/NightScene";

/**
 * Hero — the night. A live 3D world behind a name that is physically in it:
 * every letter lifts toward you as the cursor approaches, the shadow on the pole
 * turns to watch you, embers swirl away from your hand.
 * Scroll: the camera dives through rooftops into the moon; the letters scatter
 * into space; the moon whites out into the next scene.
 */

const LINES = [
  { word: site.firstName, outline: false },
  { word: site.middleName, outline: true },
  { word: site.lastName, outline: false },
];

export function Hero() {
  const root = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const scene = useRef<NightScene | null>(null);
  const [webgl, setWebgl] = useState(true);
  const introDone = useUI((s) => s.introDone);
  const introRef = useRef(false);

  // ── 3D world lifecycle ───────────────────────────────
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let io: IntersectionObserver | null = null;
    const reduce = prefersReducedMotion();
    const mobile = window.matchMedia("(max-width: 767.98px)").matches;

    import("@/anime/NightScene")
      .then(({ NightScene }) => {
        if (disposed) return;
        let s: NightScene;
        try {
          s = new NightScene(el, {
            particles: reduce ? 0 : mobile ? 260 : 720,
            dpr: Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.75),
          });
        } catch {
          setWebgl(false);
          return;
        }
        scene.current = s;
        heroStage.world = s;
        if (reduce) {
          s.setAssemble(1);
          s.setMoonPresence(1);
          s.setCharacterPresence(1);
          s.still();
          return;
        }
        // apply whatever the intro has already asked for
        s.setAssemble(heroStage.assemble);
        s.setMoonPresence(heroStage.moon);
        s.setCharacterPresence(heroStage.character);
        io = new IntersectionObserver(([e]) => (e.isIntersecting && !document.hidden ? s.start() : s.stop()));
        io.observe(el);
      })
      .catch(() => setWebgl(false));

    const onVis = () => {
      if (document.hidden) scene.current?.stop();
      else if (root.current && root.current.getBoundingClientRect().bottom > 0) scene.current?.start();
    };
    const onResize = () => scene.current?.resize();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", onResize);
      heroStage.world = null;
      scene.current?.dispose();
      scene.current = null;
    };
  }, []);

  // ── Entry: the intro's moon has landed; the world assembles, then the name descends ──
  useGSAP(
    () => {
      if (!introDone) return;
      if (prefersReducedMotion()) {
        setHeroAssemble(1);
        setHeroMoon(1);
        setHeroCharacter(1);
        gsap.set("[data-hl], [data-hf]", { autoAlpha: 1 });
        return;
      }
      introRef.current = false;
      if (heroStage.moon < 1) setHeroMoon(1);
      // Order: the moon has settled → the name comes down → supporting text →
      // the night around it assembles → Itachi appears on the post, last.
      const world = { p: Math.min(heroStage.assemble, 0.36) };
      const figure = { p: heroStage.character };
      gsap
        .timeline({ delay: 0.15 })
        // V2's original descent: one continuous letter-by-letter stagger
        .fromTo(
          "[data-hl]",
          { yPercent: -125, rotateX: 75, autoAlpha: 0 },
          { yPercent: 0, rotateX: 0, autoAlpha: 1, duration: 1.2, ease: "expo.out", stagger: 0.035 },
          0,
        )
        .fromTo("[data-hf]", { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.07 }, 0.95)
        .to(world, { p: 1, duration: 1.6, ease: "power2.out", onUpdate: () => setHeroAssemble(world.p) }, 1.2)
        .to(figure, { p: 1, duration: 0.9, ease: "power2.out", onUpdate: () => setHeroCharacter(figure.p) }, 2.45)
        .call(() => {
          introRef.current = true;
        }, [], 2.6);
    },
    { scope: root, dependencies: [introDone] },
  );

  // ── The name is alive, not animated ──────────────────
  // One loop drives every letter's resting life + cursor response. Values are
  // spring-smoothed toward targets each frame, so nothing accumulates and the
  // letters behave identically after hours. Runs only while the hero is visible.
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const letters = Array.from(el.querySelectorAll<HTMLElement>("[data-hl-wrap]"));
    const glyphs = letters.map((l) => l.querySelector<HTMLElement>("[data-hl]")!);
    const solid = glyphs.map((g) => !g.classList.contains("outline-type"));
    const set = letters.map((l) => ({
      x: gsap.quickSetter(l, "x", "px"),
      y: gsap.quickSetter(l, "y", "px"),
      z: gsap.quickSetter(l, "z", "px"),
      rx: gsap.quickSetter(l, "rotationX", "deg"),
      ry: gsap.quickSetter(l, "rotationY", "deg"),
    }));
    const cur = letters.map(() => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, lx: 0, ly: 0, glow: 0 }));
    const phase = letters.map((_, i) => ({ a: i * 1.37, b: i * 2.11, s: 0.55 + ((i * 7) % 5) * 0.06 }));
    let centers: { x: number; y: number }[] = [];
    const measure = () => {
      // measure the un-transformed scatter layer so cursor maths ignores the letters' own motion
      centers = letters.map((l) => {
        const r = (l.parentElement as HTMLElement).getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    };
    measure();
    const ptr = { x: -9999, y: -9999, on: false };
    let vel = 0;
    let visible = true;
    const t0 = performance.now();

    const tick = () => {
      if (!visible || !introRef.current) return;
      const t = (performance.now() - t0) / 1000;
      const R = Math.max(200, window.innerWidth * 0.17);
      vel *= 0.92;
      const sv = Math.min(1, Math.abs(vel) / 2500);
      for (let i = 0; i < letters.length; i++) {
        const c = centers[i];
        const ph = phase[i];
        // resting life — tiny, slow, never in sync
        let tz = Math.sin(t * ph.s + ph.a) * 7 + sv * Math.sin(t * 9 + ph.b) * 30;
        const ty = Math.sin(t * ph.s * 0.7 + ph.b) * 1.6;
        let trx = Math.sin(t * ph.s * 0.8 + ph.b) * 1.4 + sv * 6;
        let tryy = Math.cos(t * ph.s * 0.6 + ph.a) * 1.4;
        let tx = 0;
        let lx = 0;
        let ly = 0;
        let glow = 0;
        if (ptr.on && c) {
          const dx = ptr.x - c.x;
          const dy = ptr.y - c.y;
          const d = Math.hypot(dx, dy);
          const f = Math.max(0, 1 - d / R);
          const e = f * f * (3 - 2 * f);
          tz += e * 150;
          trx += -(dy / R) * 34 * e;
          tryy += (dx / R) * 34 * e;
          tx += -Math.sign(dx) * e * 14; // letters part around the hand
          // the cursor is a light: rim on the side facing it
          lx = (dx / (d || 1)) * 3 * e;
          ly = (dy / (d || 1)) * 3 * e;
          glow = e;
        }
        const k = cur[i];
        k.x += (tx - k.x) * 0.09;
        k.y += (ty - k.y) * 0.09;
        k.z += (tz - k.z) * 0.09;
        k.rx += (trx - k.rx) * 0.09;
        k.ry += (tryy - k.ry) * 0.09;
        k.lx += (lx - k.lx) * 0.12;
        k.ly += (ly - k.ly) * 0.12;
        const g = k.glow + (glow - k.glow) * 0.12;
        set[i].x(k.x);
        set[i].y(k.y);
        set[i].z(k.z);
        set[i].rx(k.rx);
        set[i].ry(k.ry);
        if (solid[i] && (Math.abs(g - k.glow) > 0.002 || g > 0.002)) {
          glyphs[i].style.textShadow = g > 0.01 ? `${k.lx.toFixed(2)}px ${k.ly.toFixed(2)}px 0 rgba(224,72,44,${(g * 0.55).toFixed(3)})` : "";
        }
        k.glow = g;
      }
    };
    gsap.ticker.add(tick);

    const move = (e: PointerEvent) => {
      scene.current?.setPointer(e.clientX, e.clientY);
      ptr.x = e.clientX;
      ptr.y = e.clientY;
      ptr.on = e.pointerType === "mouse";
    };
    const leave = () => {
      ptr.on = false;
      scene.current?.leavePointer();
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") scene.current?.tap(e.clientX, e.clientY);
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => (visible = self.isActive),
      onUpdate: (self) => {
        vel = self.getVelocity();
        measure();
      },
      onRefresh: measure,
    });
    window.addEventListener("resize", measure);
    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("resize", measure);
      st.kill();
    };
  }, []);

  // ── Scroll: dive into the moon, scatter the name ─────
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const letters = gsap.utils.toArray<HTMLElement>("[data-hl-scatter]");
      const rand = gsap.utils.random;
      const dive = { p: 0 };
      gsap
        .timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "+=170%",
            pin: true,
            scrub: 0.7,
            onUpdate: (self) => scene.current?.setDive(self.progress),
          },
        })
        .to(dive, { p: 1, duration: 1 }, 0)
        // opacity, not autoAlpha: autoAlpha would un-hide the text before the entry reveals it
        .to("[data-hf]", { opacity: 0, duration: 0.15 }, 0)
        .to(
          letters,
          {
            x: () => rand(-0.7, 0.7) * window.innerWidth,
            y: () => rand(-0.6, 0.4) * window.innerHeight,
            z: () => rand(250, 900),
            rotationX: () => rand(-160, 160),
            rotationY: () => rand(-160, 160),
            rotationZ: () => rand(-50, 50),
            autoAlpha: 0,
            duration: 0.55,
            ease: "power2.in",
            stagger: { each: 0.012, from: "random" },
          },
          0.03,
        )
        .fromTo("[data-flash]", { opacity: 0 }, { opacity: 1, duration: 0.22, ease: "power2.in" }, 0.78);
    },
    { scope: root },
  );

  return (
    <section
      ref={root}
      aria-labelledby="hero-title"
      className="relative isolate h-[100svh] overflow-hidden bg-[#050608]"
    >
      {/* The world */}
      <div ref={host} className="absolute inset-0" aria-hidden>
        {!webgl && (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_68%_30%,#ece6d6_0_14%,rgba(236,230,214,.12)_15%,transparent_40%),linear-gradient(#040508,#151621)]" />
        )}
      </div>
      {/* Vignette keeps type legible over the city */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,8,0)_45%,rgba(5,6,8,.65)_100%)]" />

      <h1 id="hero-title" className="sr-only">
        {site.name} — {site.role}, {site.focus.toLowerCase()}
      </h1>

      {/* The name — every letter is its own object in space */}
      <div
        aria-hidden
        className="absolute bottom-[calc(clamp(1rem,3vh,2rem)+3.2rem)] left-[var(--pad)] select-none"
        style={{ perspective: "900px" }}
      >
        {LINES.map((line, li) => (
          <div key={line.word} className="flex" style={{ transformStyle: "preserve-3d", marginLeft: li === 1 ? "0.55em" : 0 }}>
            {line.word.split("").map((ch, i) => (
              <span key={i} data-hl-scatter className="inline-block will-change-transform" style={{ transformStyle: "preserve-3d" }}>
                <span data-hl-wrap className="inline-block will-change-transform" style={{ transformStyle: "preserve-3d" }}>
                  <span
                    data-hl
                    data-reveal
                    className={`font-display inline-block text-[clamp(4.2rem,min(15.5vw,25vh),17rem)] leading-[0.84] ${
                      line.outline ? "outline-type [-webkit-text-stroke-width:1.5px]" : "text-bone"
                    }`}
                  >
                    {ch}
                  </span>
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>

      {/* Vertical: "record of shadows" */}
      <p
        aria-hidden
        data-hf
        data-reveal
        className="absolute right-[var(--pad)] top-[calc(var(--header-h)+4vh)] hidden text-[clamp(1.4rem,2.2vw,2.4rem)] font-bold leading-none tracking-[0.3em] text-bone/80 [writing-mode:vertical-rl] md:block"
      >
        影の記録
      </p>

      {/* Statement */}
      <div className="absolute bottom-[calc(clamp(1rem,3vh,2rem)+3.5rem)] right-[var(--pad)] hidden max-w-[20rem] flex-col gap-3 text-right lg:flex">
        <p data-hf data-reveal className="meta text-ember">
          ({site.role})
        </p>
        <p data-hf data-reveal className="lede text-bone/85">
          {site.focus}. Where logic meets creativity.
        </p>
      </div>

      {/* Bottom rail */}
      <div className="meta absolute inset-x-[var(--pad)] bottom-[clamp(1rem,3vh,2rem)] flex items-end justify-between text-ash">
        <span data-hf data-reveal className="hidden sm:block">
          Night scene · move the cursor
        </span>
        <span data-hf data-reveal className="text-bone lg:hidden">
          {site.role}
        </span>
        <span data-hf data-reveal className="flex items-center gap-3 text-bone">
          <span className="relative block h-px w-10 overflow-hidden bg-bone/25">
            <span className="absolute inset-y-0 left-0 w-1/2 animate-[scrollcue_1.8s_var(--ease-cut)_infinite] bg-ember" />
          </span>
          Scroll to enter
        </span>
      </div>

      {/* Keyboard alternative to hovering the figure */}
      {webgl && (
        <button
          type="button"
          onClick={() => scene.current?.encounter()}
          className="sr-only-focusable meta absolute right-[var(--pad)] top-[calc(var(--header-h)+1rem)] z-10 border border-bone/40 bg-ink/80 px-3 py-2 text-bone"
        >
          Approach the figure on the pole
        </button>
      )}

      {/* Moon white-out → next scene */}
      <div data-flash aria-hidden className="pointer-events-none absolute inset-0 bg-bone opacity-0" />
    </section>
  );
}
