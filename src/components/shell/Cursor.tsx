"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { gsap } from "@/motion/gsap";

/**
 * Contextual cursor — docs/06_INTERACTION_SPEC.md.
 * State is read from the nearest [data-cursor] ancestor; plain links/buttons
 * fall back to "link" or "external". Fine pointers only, never with reduced motion.
 */
const LABELS: Record<string, string> = {
  link: "↗",
  project: "View",
  image: "Explore",
  drag: "← Drag →",
  menu: "Close",
  external: "↗ Open",
  copy: "Copy",
  mail: "Write ↗",
};

function resolve(target: EventTarget | null): string {
  if (!(target instanceof Element)) return "";
  const tagged = target.closest<HTMLElement>("[data-cursor]");
  if (tagged) return tagged.dataset.cursor ?? "";
  const link = target.closest("a, button, [role='button']");
  if (!link) return "";
  if (link instanceof HTMLAnchorElement && link.target === "_blank") return "external";
  return "link";
}

export function Cursor() {
  const [enabled, setEnabled] = useState(false);
  const [state, setState] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const trail = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(fine.matches && !reduce.matches);
    update();
    fine.addEventListener("change", update);
    reduce.addEventListener("change", update);
    return () => {
      fine.removeEventListener("change", update);
      reduce.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    const el = root.current;
    if (!enabled || !el) return;
    document.documentElement.classList.add("has-cursor");

    const x = gsap.quickTo(el, "x", { duration: 0.18, ease: "power3.out" });
    const y = gsap.quickTo(el, "y", { duration: 0.18, ease: "power3.out" });
    // Afterimages — the same ember ghosts the shadow leaves behind
    const ghosts = Array.from(trail.current?.children ?? []).map((g, i) => ({
      x: gsap.quickTo(g, "x", { duration: 0.22 + i * 0.07, ease: "power3.out" }),
      y: gsap.quickTo(g, "y", { duration: 0.22 + i * 0.07, ease: "power3.out" }),
    }));
    let current = "";
    let visible = false;

    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      x(e.clientX);
      y(e.clientY);
      ghosts.forEach((g) => {
        g.x(e.clientX);
        g.y(e.clientY);
      });
      if (!visible) {
        visible = true;
        gsap.set(el, { x: e.clientX, y: e.clientY });
        gsap.to(el, { autoAlpha: 1, duration: 0.2 });
      }
    };
    const over = (e: PointerEvent) => {
      const next = resolve(e.target);
      if (next !== current) {
        current = next;
        setState(next);
      }
    };
    const leave = () => {
      visible = false;
      gsap.to(el, { autoAlpha: 0, duration: 0.2 });
    };
    const down = () => gsap.to(el, { scale: 0.86, duration: 0.15 });
    const up = () => gsap.to(el, { scale: 1, duration: 0.3 });

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    return () => {
      document.documentElement.classList.remove("has-cursor");
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [enabled]);

  if (!enabled) return null;
  const label = LABELS[state];

  return (
    <>
    <div ref={trail} aria-hidden className="pointer-events-none fixed left-0 top-0" style={{ zIndex: "var(--z-cursor)" }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="absolute left-0 top-0 block rounded-full bg-ember"
          style={{ width: 6 - i, height: 6 - i, marginLeft: -(6 - i) / 2, marginTop: -(6 - i) / 2, opacity: 0.55 - i * 0.1 }}
        />
      ))}
    </div>
    <div
      ref={root}
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 mix-blend-difference"
      style={{ zIndex: "var(--z-cursor)", visibility: "hidden", opacity: 0 }}
    >
      <div className="relative -translate-x-1/2 -translate-y-1/2">
        <motion.span
          className="absolute left-1/2 top-1/2 block rounded-full bg-bone"
          initial={false}
          animate={{ width: label ? 0 : 7, height: label ? 0 : 7, x: "-50%", y: "-50%" }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        />
        <AnimatePresence mode="popLayout">
          {label && (
            <motion.span
              key={state}
              className="meta absolute left-1/2 top-1/2 block whitespace-nowrap bg-bone px-2.5 py-1.5 text-ink"
              initial={{ opacity: 0, scale: 0.6, x: "-50%", y: "-50%" }}
              animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
              exit={{ opacity: 0, scale: 0.6, x: "-50%", y: "-50%" }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
    </>
  );
}
