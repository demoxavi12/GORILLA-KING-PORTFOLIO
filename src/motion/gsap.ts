"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

let registered = false;

if (typeof window !== "undefined" && !registered) {
  gsap.registerPlugin(ScrollTrigger, CustomEase, useGSAP);
  /** Weighted reveal — long, calm settle. */
  CustomEase.create("out", "0.16,1,0.3,1");
  /** Symmetric cut for wipes and scene changes. */
  CustomEase.create("cut", "0.76,0,0.24,1");
  /** Carried over from the previous portfolio's entry sequence — stillness then a hard push. */
  CustomEase.create("hop", "0.9,0,0.1,1");
  gsap.defaults({ ease: "out", duration: 0.9 });
  gsap.config({ nullTargetWarn: false });
  ScrollTrigger.config({ ignoreMobileResize: true });
  // We own scroll restoration (see app/layout.tsx): ScrollTrigger must not restore either.
  ScrollTrigger.clearScrollMemory("manual");
  registered = true;
}

export { gsap, ScrollTrigger, useGSAP };

/** Timing vocabulary (seconds) — docs/04_MOTION_SPEC.md */
export const dur = {
  micro: 0.2,
  ui: 0.4,
  reveal: 0.9,
  cinematic: 1.3,
  major: 1.8,
} as const;

/** Media conditions shared by every gsap.matchMedia() call. */
export const mq = {
  motion: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  desktop: "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
  tablet: "(min-width: 768px) and (max-width: 1023.98px) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 767.98px) and (prefers-reduced-motion: no-preference)",
  belowDesktop: "(max-width: 1023.98px) and (prefers-reduced-motion: no-preference)",
} as const;
