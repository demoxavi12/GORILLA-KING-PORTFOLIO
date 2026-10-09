"use client";

import { useRef } from "react";
import { gsap, useGSAP } from "@/motion/gsap";
import { nav, site } from "@/data/site";
import { prefersReducedMotion, ui, useUI } from "@/lib/store";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { Clock } from "./Clock";
import { ScrollProgress } from "./ScrollProgress";

/**
 * Closed navigation state. Instrument-panel header: identity · local time ·
 * location · scroll progress | numbered nav · menu. Difference-blended so it
 * stays legible over the light About scene and imagery.
 */
export function Header() {
  const root = useRef<HTMLElement>(null);
  const introDone = useUI((s) => s.introDone);
  const menuOpen = useUI((s) => s.menuOpen);

  useGSAP(
    () => {
      if (!introDone) return;
      if (prefersReducedMotion()) {
        gsap.set("[data-h]", { autoAlpha: 1 });
        return;
      }
      gsap.fromTo(
        "[data-h]",
        { yPercent: -120, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.04, delay: 0.25 },
      );
    },
    { scope: root, dependencies: [introDone] },
  );

  return (
    <header
      ref={root}
      className="fixed inset-x-0 top-0 px-pad text-bone mix-blend-difference"
      style={{ zIndex: "var(--z-header)" }}
    >
      <div className="meta flex h-[var(--header-h)] items-center justify-between gap-6">
        <div className="flex items-center gap-[clamp(1rem,3vw,3.5rem)] overflow-hidden">
          <TransitionLink href="/" data-h data-reveal aria-label={`${site.name} — home`} className="font-sans text-[0.8125rem] font-semibold tracking-[0.02em]">
            {site.initials}
          </TransitionLink>
          <span data-h data-reveal className="hidden items-center gap-3 sm:flex">
            <Clock className="text-bone" />
            <span className="text-ash">{site.location}</span>
          </span>
          <span data-h data-reveal className="hidden md:block">
            <ScrollProgress />
          </span>
        </div>

        <nav aria-label="Primary" className="flex items-center gap-[clamp(1rem,2.4vw,2.25rem)] overflow-hidden">
          <ul className="hidden items-center gap-[clamp(1rem,2.4vw,2.25rem)] lg:flex">
            {nav.map((item) => (
              <li key={item.href} data-h data-reveal>
                <TransitionLink href={item.href} className="group flex gap-1.5">
                  <span className="text-ash transition-colors group-hover:text-bone">{Number(item.index)}.</span>
                  <span className="ulink">{item.label}</span>
                </TransitionLink>
              </li>
            ))}
          </ul>
          <button
            data-h
            data-reveal
            type="button"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => ui.set({ menuOpen: !menuOpen })}
            className="group flex items-center gap-2.5 py-2"
            id="menu-toggle"
          >
            <span className="relative block h-[7px] w-[18px]" aria-hidden>
              <span className="absolute left-0 top-0 h-px w-full bg-current transition-transform duration-300 group-hover:translate-x-[3px]" />
              <span className="absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-300 group-hover:-translate-x-[3px]" />
            </span>
            <span>Menu</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
