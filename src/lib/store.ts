"use client";

import { useSyncExternalStore } from "react";
import type Lenis from "lenis";

/**
 * Minimal global UI state. Kept outside React so animation code can read/write
 * it without re-rendering the tree; components subscribe to the slices they need.
 */
type UIState = {
  introDone: boolean;
  menuOpen: boolean;
};

let state: UIState = { introDone: false, menuOpen: false };
const listeners = new Set<() => void>();

export const ui = {
  get: () => state,
  set(patch: Partial<UIState>) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useUI<T>(select: (s: UIState) => T): T {
  return useSyncExternalStore(
    ui.subscribe,
    () => select(state),
    () => select({ introDone: false, menuOpen: false }),
  );
}

/** The single Lenis instance (null when reduced motion is on or before mount). */
export const scroller: { lenis: Lenis | null } = { lenis: null };

export function scrollToTarget(target: string | number | HTMLElement, immediate = false) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (scroller.lenis) {
    scroller.lenis.scrollTo(target, { immediate: immediate || reduce, duration: 1.6, offset: 0 });
    return;
  }
  const el =
    typeof target === "string" ? document.querySelector<HTMLElement>(target) : typeof target === "number" ? null : target;
  if (typeof target === "number") window.scrollTo({ top: target, behavior: reduce || immediate ? "auto" : "smooth" });
  else el?.scrollIntoView({ behavior: reduce || immediate ? "auto" : "smooth" });
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Intro ↔ hero handoff. The intro's moon lands on the 3D moon and the world
 * assembles around it; values requested before the scene exists are queued.
 */
type HeroWorld = {
  setAssemble(p: number): void;
  setMoonPresence(v: number): void;
  setCharacterPresence(v: number): void;
  encounter(): void;
  moonScreen(): { x: number; y: number; d: number };
};
export const heroStage: { world: HeroWorld | null; assemble: number; moon: number; character: number } = {
  world: null,
  assemble: 0,
  moon: 0,
  character: 0,
};
export function setHeroCharacter(v: number) {
  heroStage.character = v;
  heroStage.world?.setCharacterPresence(v);
}
export function setHeroAssemble(p: number) {
  heroStage.assemble = p;
  heroStage.world?.setAssemble(p);
}
export function setHeroMoon(v: number) {
  heroStage.moon = v;
  heroStage.world?.setMoonPresence(v);
}
