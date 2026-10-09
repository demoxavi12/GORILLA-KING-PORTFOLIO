"use client";

import { useRef } from "react";
import { gsap, mq, ScrollTrigger, useGSAP } from "@/motion/gsap";
import { site } from "@/data/site";

/**
 * Manifesto — Sabya's one-line rule as a single kinetic transformation.
 *
 *   white frame (the moon's overexposure) collapses into one silver line
 *   DATABASE   is written up out of that line, row by row — persisted, stable
 *              …stillness… then tilts back into depth and fractures
 *   QUEUE      letters arrive one after another and wait in line
 *              …stillness… then leave first-in, first-out
 *   WEBSOCKETS appears all at once — instant — on a vermillion signal line
 *              …stillness… then shears into horizontal strips that streak away
 *
 * Night palette: near-black, off-white, silver, one vermillion signal.
 */

const [DB, Q, WS] = site.manifesto;
const STRIPS = 5;

export function Manifesto() {
  const root = useRef<HTMLElement>(null);
  const band = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const m = gsap.matchMedia();

      m.add(mq.motion, () => {
        const q = gsap.utils.selector(root);
        const dbL = q("[data-w='db'] [data-l]");
        const qL = q("[data-w='q'] [data-l]");
        const strips = q("[data-strip]");
        const rnd = gsap.utils.random;

        gsap.set(q("[data-w='ws']"), { autoAlpha: 0 });
        gsap.set(qL, { autoAlpha: 0 });
        gsap.set(q("[data-lead]"), { yPercent: 110 });
        gsap.set(q("[data-signal]"), { scaleX: 0 });
        gsap.set(q("[data-rule]"), { autoAlpha: 0 });

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: { trigger: q("[data-mf-stage]")[0], start: "top top", end: "+=380%", pin: true, scrub: 0.6 },
        });

        // White frame → one line
        tl.to(q("[data-shutter]"), { scaleY: 0.0025, duration: 0.55, ease: "power3.in" }, 0)
          .set(q("[data-shutter]"), { autoAlpha: 0 }, 0.55)
          .set(q("[data-rule]"), { autoAlpha: 1 }, 0.55)
          .fromTo(q("[data-hud]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.5)

          // DATABASE — written up out of the line, row by row
          .fromTo(dbL, { yPercent: 105, rotateX: -75 }, { yPercent: 0, rotateX: 0, duration: 0.55, stagger: 0.045, ease: "power3.out" }, 0.6)
          .to(q("[data-lead='0']"), { yPercent: 0, duration: 0.3, ease: "power3.out" }, 0.75)
          .set(q("[data-count]"), { textContent: "01" }, 0.6)
          // stillness 1.3 → 1.85
          // …tilts back into depth, fractures
          .to(q("[data-w='db']"), { rotateX: 78, z: -260, duration: 0.45, ease: "power2.in" }, 1.85)
          .to(dbL, { x: () => rnd(-260, 260), y: () => rnd(-220, -20), rotateZ: () => rnd(-40, 40), autoAlpha: 0, duration: 0.45, stagger: { each: 0.015, from: "random" }, ease: "power2.in" }, 1.95)
          .to(q("[data-lead='0']"), { yPercent: -110, duration: 0.25, ease: "power2.in" }, 2.0)

          // QUEUE — letters arrive one after another, and wait
          .set(q("[data-count]"), { textContent: "02" }, 2.5)
          .to(q("[data-lead='1']"), { yPercent: 0, duration: 0.3, ease: "power3.out" }, 2.5)
          .fromTo(qL, { x: () => window.innerWidth * 0.75, skewX: -28, autoAlpha: 1 }, { x: 0, skewX: 0, duration: 0.42, stagger: 0.09, ease: "power3.out" }, 2.5)
          // stillness 3.3 → 3.7
          // …dequeue: first in, first out
          .to(qL, { x: () => -window.innerWidth * 0.85, skewX: 28, duration: 0.32, stagger: 0.06, ease: "power3.in" }, 3.7)
          .to(q("[data-lead='1']"), { yPercent: -110, duration: 0.25, ease: "power2.in" }, 3.75)

          // WEBSOCKETS — instant
          .set(q("[data-count]"), { textContent: "03" }, 4.1)
          .fromTo(q("[data-w='ws']"), { scale: 1.35, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.12, ease: "expo.out" }, 4.1)
          .to(q("[data-signal]"), { scaleX: 1, duration: 0.1, ease: "power4.in" }, 4.08)
          .to(q("[data-impact]"), { keyframes: { opacity: [0, 0.22, 0] }, duration: 0.18 }, 4.1)
          .to(q("[data-lead='2']"), { yPercent: 0, duration: 0.3, ease: "power3.out" }, 4.15)
          .fromTo(q("[data-src]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25 }, 4.35)
          // stillness 4.35 → 4.9
          // …shears into strips that streak away (→ Work)
          .to(strips, { x: (i: number) => window.innerWidth * (0.35 + i * 0.22), autoAlpha: 0, duration: 0.55, ease: "power2.in", stagger: 0.03 }, 4.9)
          .to(q("[data-signal]"), { scaleX: 3, xPercent: 60, autoAlpha: 0, duration: 0.55, ease: "power2.in" }, 4.95)
          .to(q("[data-lead='2'], [data-hud], [data-src], [data-rule]"), { autoAlpha: 0, duration: 0.3 }, 4.95)
          .to({}, { duration: 0.15 });

        // Cursor — the word sits in depth; the hand tilts the space slightly
        const wrap = q("[data-mf-cursor]")[0];
        const rx = gsap.quickTo(wrap, "rotationX", { duration: 1, ease: "power3.out" });
        const ry = gsap.quickTo(wrap, "rotationY", { duration: 1, ease: "power3.out" });
        const tx = gsap.quickTo(wrap, "x", { duration: 1, ease: "power3.out" });
        const move = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          const ny = e.clientY / window.innerHeight - 0.5;
          ry(nx * 9);
          rx(-ny * 6);
          tx(-nx * 18);
        };
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (s) => (s.isActive ? window.addEventListener("pointermove", move, { passive: true }) : window.removeEventListener("pointermove", move)),
        });
        return () => {
          st.kill();
          window.removeEventListener("pointermove", move);
        };
      });

      // Velocity band: drifts slowly, scroll speed pushes it and skews it.
      m.add(mq.motion, () => {
        const track = band.current!.querySelector<HTMLElement>("[data-band-track]")!;
        const setX = gsap.quickSetter(track, "xPercent");
        const skew = gsap.quickTo(track, "skewX", { duration: 0.5, ease: "power3.out" });
        let x = 0;
        let v = 0;
        let visible = false;
        const st = ScrollTrigger.create({
          trigger: band.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (visible = self.isActive),
          onUpdate: (self) => {
            v = self.getVelocity();
          },
        });
        const tick = () => {
          if (!visible) return;
          v *= 0.9;
          x -= 0.012 + Math.min(Math.abs(v) / 9000, 0.6);
          if (x <= -50) x += 50;
          setX(x);
          skew(gsap.utils.clamp(-8, 8, v / -300));
        };
        gsap.ticker.add(tick);
        return () => {
          gsap.ticker.remove(tick);
          st.kill();
        };
      });

      return () => m.revert();
    },
    { scope: root },
  );

  const word = "font-display block whitespace-nowrap text-center text-[clamp(3.4rem,min(16.5vw,30vh),20rem)] leading-[0.8]";

  return (
    <section ref={root} aria-labelledby="manifesto-title" className="relative bg-ink">
      <h2 id="manifesto-title" className="sr-only">
        Manifesto
      </h2>
      <ul className="sr-only">
        {site.manifesto.map((l) => (
          <li key={l.key}>
            {l.lead} {l.key}.
          </li>
        ))}
      </ul>

      {/* Kinetic stage (motion) */}
      <div data-mf-stage aria-hidden className="relative h-[100svh] overflow-hidden bg-ink motion-reduce:hidden" style={{ perspective: "1100px" }}>
        {/* the moon's white-out, continued — collapses into the line */}
        <div data-shutter className="absolute inset-x-0 top-0 h-full origin-[50%_62%] bg-bone" />

        <div data-hud className="meta absolute inset-x-[var(--pad)] top-[calc(var(--header-h)+2vh)] flex justify-between text-ash" style={{ visibility: "hidden" }}>
          <span>(01) Manifesto — Sabya&rsquo;s one-line rule</span>
          <span>
            <span data-count className="text-ember">01</span> / 03
          </span>
        </div>

        {/* lead phrase */}
        <div className="absolute inset-x-[var(--pad)] top-[38vh] overflow-hidden text-center md:top-[24vh]">
          <div className="relative h-[1.1em] text-[clamp(1.4rem,3.2vw,3.4rem)] font-medium leading-[1.1] tracking-[-0.04em] text-[#a9a9a9]">
            {[DB, Q, WS].map((l, i) => (
              <span key={l.key} data-lead={i} className="absolute inset-x-0 top-0 block">
                {l.lead}
              </span>
            ))}
          </div>
        </div>

        {/* the line everything is written on */}
        <div data-rule className="absolute inset-x-[var(--pad)] top-[62%] h-px bg-[#9a9a9a]/60" />

        <div data-mf-cursor className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
          {/* DATABASE */}
          <div data-w="db" className="absolute inset-x-0 bottom-[38%] origin-bottom" style={{ transformStyle: "preserve-3d" }}>
            {/* clipped only below the line: letters rise out of it, and can still fly free */}
            <div className={`${word} text-bone`} style={{ clipPath: "inset(-120% -30% 0 -30%)" }}>
              {DB.key.split("").map((ch, i) => (
                <span key={i} data-l className="inline-block origin-bottom" style={{ transformStyle: "preserve-3d" }}>
                  {ch}
                </span>
              ))}
            </div>
          </div>

          {/* QUEUE */}
          <div data-w="q" className="absolute inset-x-0 bottom-[38%]">
            <div className={`${word} text-[#c9c9c9]`}>
              {Q.key.split("").map((ch, i) => (
                <span key={i} data-l className="inline-block">
                  {ch}
                </span>
              ))}
            </div>
          </div>

          {/* WEBSOCKETS — stacked strips so it can shear apart */}
          <div data-w="ws" className="absolute inset-x-0 bottom-[38%]">
            <div className="relative">
              <div className={`${word} invisible`}>{WS.key}.</div>
              {Array.from({ length: STRIPS }).map((_, i) => (
                <div
                  key={i}
                  data-strip
                  className={`${word} absolute inset-0 text-bone`}
                  style={{ clipPath: `inset(${(i / STRIPS) * 100}% 0 ${100 - ((i + 1) / STRIPS) * 100}% 0)` }}
                >
                  {WS.key}
                  <span className="text-ember">.</span>
                </div>
              ))}
            </div>
          </div>

          {/* the signal */}
          <div data-signal className="absolute left-[var(--pad)] right-[var(--pad)] top-[62%] h-[3px] -translate-y-1/2 origin-left bg-ember" />
        </div>

        <div data-impact className="pointer-events-none absolute inset-0 bg-ember opacity-0 mix-blend-screen" />

        <p data-src className="meta absolute bottom-[clamp(1.5rem,5vh,3rem)] left-[var(--pad)] max-w-[46ch] text-ash" style={{ visibility: "hidden" }}>
          — {site.manifestoSource}
        </p>
      </div>

      {/* Reduced motion: the same rule, still */}
      <div aria-hidden className="hidden px-pad py-[16vh] motion-reduce:block">
        <p className="meta mb-10 text-ash">(01) Manifesto — Sabya&rsquo;s one-line rule</p>
        <ul className="flex flex-col gap-10">
          {site.manifesto.map((l, i) => (
            <li key={l.key}>
              <span className="block text-[clamp(1.2rem,2.6vw,2.6rem)] tracking-[-0.03em] text-[#a9a9a9]">{l.lead}</span>
              <span className={`font-display block text-[clamp(3.4rem,13vw,13rem)] leading-[0.82] ${i === 2 ? "text-ember" : "text-bone"}`}>{l.key}.</span>
            </li>
          ))}
        </ul>
        <p className="meta mt-10 text-ash">— {site.manifestoSource}</p>
      </div>

      {/* Velocity-reactive band */}
      <div ref={band} aria-hidden className="relative overflow-hidden border-y rule py-[clamp(0.75rem,2vh,1.5rem)]">
        <div data-band-track className="flex w-max whitespace-nowrap will-change-transform">
          {Array.from({ length: 2 }).map((_, k) => (
            <span key={k} className="font-display flex items-center text-[clamp(2.5rem,7vw,7rem)] text-bone">
              {Array.from({ length: 3 }).map((__, j) => (
                <span key={j} className="flex items-center">
                  <span className="px-[0.35em]">Where logic meets creativity</span>
                  <span className="text-ember">/</span>
                  <span className="px-[0.35em] outline-type">影 · Five cuts ahead</span>
                  <span className="text-ember">/</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
