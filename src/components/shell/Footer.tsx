"use client";

import { useRef } from "react";
import { gsap, mq, useGSAP } from "@/motion/gsap";
import { site } from "@/data/site";
import { scrollToTarget } from "@/lib/store";

/**
 * The last frame. One line of credits, then a vermillion seal — 終, "end" —
 * stamped into the night. Nothing else.
 */
export function Footer() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const m = gsap.matchMedia();
      m.add(mq.motion, () => {
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "top 80%" } })
          .from("[data-ft]", { autoAlpha: 0, duration: 1, stagger: 0.08 })
          .fromTo("[data-seal]", { scale: 1.45, rotate: -14, autoAlpha: 0 }, { scale: 1, rotate: -6, autoAlpha: 1, duration: 0.42, ease: "expo.out" }, 0.35)
          .fromTo("[data-seal]", { x: 0 }, { keyframes: { x: [0, -4, 3, 0] }, duration: 0.2, ease: "none" }, 0.4);
      });
      return () => m.revert();
    },
    { scope: root },
  );

  return (
    <footer ref={root} id="site-footer" className="relative overflow-hidden bg-ink px-pad pb-[clamp(1.5rem,4vh,2.5rem)] pt-[clamp(3rem,8vh,5rem)]">
      <div className="grid grid-cols-12 items-end gap-x-[var(--gutter)] gap-y-8 border-t rule pt-6">
        <p data-ft className="meta col-span-12 max-w-[60ch] leading-[1.7] text-ash md:col-span-8">
          Designed, engineered &amp; photographed by <span className="text-bone">{site.name}</span> · Next.js · GSAP · Lenis · Three.js · Set in Anton
          &amp; Geist · The night is drawn in code
        </p>

        {/* The seal */}
        <div className="col-span-12 flex items-end justify-between gap-6 md:col-span-4 md:justify-end">
          <div data-ft className="meta flex flex-col gap-1 text-ash md:items-end md:text-right">
            <span>
              © {new Date().getFullYear()} {site.initials}
            </span>
            <button type="button" onClick={() => scrollToTarget(0)} className="text-bone">
              <span className="ulink">Back to the night ↑</span>
            </button>
          </div>
          <div
            data-seal
            aria-label="終 — end"
            role="img"
            className="grid aspect-square w-[clamp(4.5rem,8vw,6.5rem)] shrink-0 place-items-center rounded-[14%] border-[3px] border-ember text-[clamp(2.3rem,4.2vw,3.5rem)] font-bold leading-none text-ember"
            style={{ transform: "rotate(-6deg)" }}
          >
            終
          </div>
        </div>
      </div>
    </footer>
  );
}
