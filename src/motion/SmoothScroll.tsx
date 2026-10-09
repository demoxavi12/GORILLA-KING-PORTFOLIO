"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { gsap, ScrollTrigger } from "./gsap";
import { scroller, ui } from "@/lib/store";

/**
 * Lenis is the only scroll engine. It is driven by GSAP's ticker so there is a
 * single RAF loop for scroll + every ScrollTrigger. Disabled for reduced motion.
 */
export function SmoothScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let lenis: Lenis | null = null;
    const tick = (time: number) => lenis?.raf(time * 1000);

    const start = () => {
      if (reduce.matches || lenis) return;
      lenis = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
        wheelMultiplier: 0.9,
        anchors: false,
        autoRaf: false,
        prevent: (node) => node.closest("[data-lenis-prevent]") !== null,
      });
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      scroller.lenis = lenis;
      // Respect a stop requested before Lenis existed (loader / menu).
      if (!ui.get().introDone || ui.get().menuOpen) lenis.stop();
    };
    const stop = () => {
      if (!lenis) return;
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenis = null;
      scroller.lenis = null;
    };

    start();
    const onChange = () => (reduce.matches ? stop() : start());
    reduce.addEventListener("change", onChange);

    // Lock scroll while the intro plays or the menu is open.
    const unsub = ui.subscribe(() => {
      const { introDone, menuOpen } = ui.get();
      const locked = !introDone || menuOpen;
      if (scroller.lenis) {
        if (locked) scroller.lenis.stop();
        else scroller.lenis.start();
      }
      document.documentElement.style.overflow = locked && !scroller.lenis ? "hidden" : "";
    });

    return () => {
      unsub();
      reduce.removeEventListener("change", onChange);
      stop();
    };
  }, []);

  // New route → top of page, recalc triggers once layout settles.
  useEffect(() => {
    if (window.location.hash) return;
    scroller.lenis?.scrollTo(0, { immediate: true, force: true });
    window.scrollTo(0, 0);
    const id = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(id);
  }, [pathname]);

  return null;
}
