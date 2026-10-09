"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/motion/gsap";
import { archive } from "@/data/archive";
import { site } from "@/data/site";
import { prefersReducedMotion } from "@/lib/store";
import { Lightbox } from "@/components/archive/Lightbox";

/**
 * Visual archive — a memory tunnel. Engineering gives way to the eye: you fly
 * forward through Sabya's photographs suspended in the dark. Distance is fog;
 * frames sharpen as they approach and slip past the camera. The cursor steers.
 */

const GAP = 640; // px of depth between frames

// Lanes around the camera path — deterministic rhythm, never centred.
// Two lanes run close to the camera path, so those photographs sweep past the lens.
const LANES = [
  { x: -0.31, y: -0.04, w: 0.48 },
  { x: 0.3, y: 0.08, w: 0.41 },
  { x: -0.09, y: 0.12, w: 0.44 },
  { x: 0.34, y: -0.12, w: 0.46 },
  { x: -0.35, y: 0.03, w: 0.39 },
  { x: 0.1, y: -0.1, w: 0.52 },
];

export function Archive() {
  const root = useRef<HTMLElement>(null);
  const world = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const iris = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const frames = gsap.utils.toArray<HTMLElement>("[data-ar-frame]");
      const reduce = prefersReducedMotion();
      if (reduce) return;
      const n = frames.length;
      const depth = (n + 1.2) * GAP;
      const cam = { z: 0 };
      const tilt = {
        x: gsap.quickTo(world.current, "rotationX", { duration: 1.2, ease: "power3.out" }),
        y: gsap.quickTo(world.current, "rotationY", { duration: 1.2, ease: "power3.out" }),
      };

      const inners = frames.map((f) => f.querySelector<HTMLElement>("[data-ar-inner]")!);
      const grow = inners.map((el) => {
        const sx = gsap.quickTo(el, "scaleX", { duration: 0.7, ease: "power3.out" });
        const sy = gsap.quickTo(el, "scaleY", { duration: 0.7, ease: "power3.out" });
        let last = 1;
        return (v: number) => {
          if (Math.abs(v - last) < 0.001) return;
          last = v;
          sx(v);
          sy(v);
        };
      });
      const blurNow = frames.map(() => -1);
      const ptr = { x: -9999, y: -9999, on: false };

      const render = () => {
        gsap.set(world.current, { z: cam.z });
        let nearest = 0;
        frames.forEach((f, i) => {
          const d = -(i + 1) * GAP + cam.z; // distance in front (negative = ahead)
          // fog in from far, fade out as it passes the lens
          const far = gsap.utils.clamp(0, 1, 1 - (-d - GAP * 0.4) / (GAP * 2.6));
          const pass = gsap.utils.clamp(0, 1, 1 - (d + 120) / 380);
          const a = far * pass;
          f.style.opacity = String(a);
          f.style.visibility = a < 0.01 ? "hidden" : "visible";
          if (a >= 0.01) {
            // depth of field: far = soft, mid/near = sharp
            const blur = Math.round(gsap.utils.clamp(0, 5, ((-d - GAP * 0.9) / GAP) * 2.2) * 4) / 4;
            if (blur !== blurNow[i]) {
              blurNow[i] = blur;
              inners[i].style.filter = blur > 0 ? `blur(${blur}px)` : "";
            }
          }
          if (d < 0 && d > -GAP) nearest = i;
        });
        if (counter.current) counter.current.textContent = `${String(nearest + 1).padStart(3, "0")} / ${String(n).padStart(3, "0")}`;
        proximity();
      };

      // The frame nearest the hand swells — "active" scale
      const proximity = () => {
        frames.forEach((f, i) => {
          if (f.style.visibility === "hidden" || !ptr.on) {
            grow[i](1);
            return;
          }
          const r = f.getBoundingClientRect();
          const d = Math.hypot(ptr.x - (r.left + r.width / 2), ptr.y - (r.top + r.height / 2));
          const k = gsap.utils.clamp(0, 1, 1 - d / Math.max(r.width * 0.9, 220));
          grow[i](1 + k * k * 0.16);
        });
      };

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: () => `+=${n * window.innerHeight * 0.46}`,
          pin: true,
          scrub: 0.9,
          invalidateOnRefresh: true,
        },
      });
      // travel …
      tl.to(cam, { z: depth, duration: 0.86, onUpdate: render }, 0)
        // … then the camera exits: the tunnel collapses to its vanishing point
        .fromTo(iris.current, { width: "260vmax", height: "260vmax" }, { width: "0vmax", height: "0vmax", duration: 0.12, ease: "power2.in" }, 0.86)
        .to("[data-ar-hud]", { autoAlpha: 0, duration: 0.06 }, 0.86)
        .to({}, { duration: 0.02 });
      gsap.to("[data-ar-title]", {
        z: 900,
        autoAlpha: 0,
        ease: "power1.in",
        scrollTrigger: { trigger: root.current, start: "top top", end: () => `+=${window.innerHeight * 0.9}`, scrub: true },
      });
      render();

      const move = (e: PointerEvent) => {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        tilt.y(nx * 10);
        tilt.x(-ny * 7);
        ptr.x = e.clientX;
        ptr.y = e.clientY;
        ptr.on = e.pointerType === "mouse";
        proximity();
      };
      const st = ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => (self.isActive ? window.addEventListener("pointermove", move, { passive: true }) : window.removeEventListener("pointermove", move)),
      });
      return () => {
        st.kill();
        window.removeEventListener("pointermove", move);
      };
    },
    { scope: root },
  );

  return (
    <section ref={root} id="archive" aria-labelledby="archive-title" className="relative bg-ink">
      {/* Reduced motion / no-3D fallback is a plain grid (see below); the tunnel is the default. */}
      <div className="relative h-[100svh] overflow-hidden motion-reduce:hidden" style={{ perspective: "900px", perspectiveOrigin: "50% 50%" }}>
        <div ref={world} className="absolute left-1/2 top-1/2" style={{ transformStyle: "preserve-3d" }}>
          {/* Opening title, deep in the tunnel */}
          <div data-ar-title className="absolute left-0 top-0 w-[92vw] max-w-[80rem] text-center" style={{ transform: "translate(-50%,-50%) translateZ(-260px)" }}>
            <p className="meta mb-4 text-ember">(04) Visual archive</p>
            <h2 id="archive-title" className="font-display text-[clamp(5rem,17vw,19rem)] leading-[0.8]">
              Archive
            </h2>
            <p className="lede mx-auto mt-6 max-w-[34ch] text-bone/75">
              From engineering to the eye. {site.profile.creative}
            </p>
          </div>

          {archive.map((fr, i) => {
            const L = LANES[i % LANES.length];
            return (
              <button
                key={fr.id}
                type="button"
                data-ar-frame
                data-cursor="image"
                onClick={() => setOpen(i)}
                aria-label={`View frame ${fr.id}: ${fr.alt}`}
                className="group absolute left-0 top-0 block text-left"
                style={{
                  width: `min(${L.w * 190}vw, ${L.w * 150}vh)`,
                  transform: `translate(-50%, -50%) translate3d(${L.x * 100}vw, ${L.y * 100}vh, ${-(i + 1) * GAP}px)`,
                  opacity: 0,
                }}
              >
                <span data-ar-inner className="relative block overflow-hidden bg-ink-2 will-change-transform" style={{ aspectRatio: `${fr.w} / ${fr.h}` }}>
                  <Image
                    src={fr.src}
                    alt=""
                    fill
                    quality={70}
                    sizes="(max-width: 767px) 90vw, 50vw"
                    className="object-cover grayscale-[0.25] transition-[filter,transform] duration-700 group-hover:scale-[1.04] group-hover:grayscale-0"
                  />
                  <span className="absolute inset-0 ring-1 ring-inset ring-bone/10 transition-colors group-hover:ring-ember" />
                </span>
                <span className="meta mt-2 flex justify-between gap-4 text-ash">
                  <span className="text-bone">SSM_{fr.id}</span>
                  <span>
                    {fr.w}×{fr.h} · {fr.tone}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* Iris — closes on the vanishing point as the camera leaves the tunnel */}
        <div
          ref={iris}
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ width: "260vmax", height: "260vmax", boxShadow: "0 0 0 200vmax #080808" }}
        />

        {/* HUD */}
        <div data-ar-hud className="meta pointer-events-none absolute inset-x-[var(--pad)] bottom-[clamp(1rem,3vh,2rem)] flex justify-between text-ash">
          <span>
            Frame <span ref={counter} className="text-bone tabular-nums">001 / {String(archive.length).padStart(3, "0")}</span>
          </span>
          <span className="hidden sm:block">Scroll to travel · move to steer · click to view</span>
        </div>
        <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2">
          <span className="absolute left-1/2 top-0 h-full w-px bg-bone/30" />
          <span className="absolute left-0 top-1/2 h-px w-full bg-bone/30" />
        </div>
      </div>

      {/* Reduced motion: the same archive as a calm index grid */}
      <div className="hidden px-pad py-24 motion-reduce:block">
        <h2 className="font-display mb-10 text-[clamp(4rem,14vw,12rem)]">Archive</h2>
        <ul className="grid grid-cols-2 gap-[var(--gutter)] md:grid-cols-4">
          {archive.map((fr, i) => (
            <li key={fr.id}>
              <button type="button" onClick={() => setOpen(i)} className="block w-full text-left" aria-label={`View frame ${fr.id}: ${fr.alt}`}>
                <span className="relative block overflow-hidden bg-ink-2" style={{ aspectRatio: `${fr.w} / ${fr.h}` }}>
                  <Image src={fr.src} alt="" fill quality={70} sizes="25vw" className="object-cover" />
                </span>
                <span className="meta mt-2 block text-ash">SSM_{fr.id}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <Lightbox frames={archive} index={open} onChange={setOpen} />
    </section>
  );
}
