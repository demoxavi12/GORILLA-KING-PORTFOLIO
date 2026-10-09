"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { SystemStep } from "@/data/projects";
import { prefersReducedMotion } from "@/lib/store";

export type PlateHandle = { setActive: (i: number) => void };

type Props = {
  steps: SystemStep[];
  caption?: string;
  /** "loop" runs the system on its own while visible; "scrub" waits for setActive(); "static" shows every step. */
  mode?: "loop" | "scrub" | "static";
  size?: "sm" | "md" | "lg";
  className?: string;
};

/**
 * The project visual. These repositories have no screenshots, so the plate draws
 * the system itself — the states or stages read from each project's own code —
 * as oversized type. The active stage is solid, completed stages fade to ash,
 * pending stages are outlines; alternate/failure paths light up in signal.
 * Activation is attribute-driven (no React renders while scrolling).
 */
export const SystemPlate = forwardRef<PlateHandle, Props>(function SystemPlate(
  { steps, caption, mode = "loop", size = "md", className = "" },
  ref,
) {
  const list = useRef<HTMLOListElement>(null);
  const current = useRef(-1);

  const setActive = (i: number) => {
    const el = list.current;
    if (!el || i === current.current) return;
    current.current = i;
    el.querySelectorAll<HTMLElement>("[data-step]").forEach((li, k) => {
      li.dataset.state = k < i ? "done" : k === i ? "on" : "off";
    });
  };

  useImperativeHandle(ref, () => ({ setActive }));

  useEffect(() => {
    const el = list.current;
    if (!el) return;
    if (mode === "static" || prefersReducedMotion()) {
      el.querySelectorAll<HTMLElement>("[data-step]").forEach((li) => (li.dataset.state = "on"));
      return;
    }
    if (mode === "scrub") {
      setActive(0);
      return;
    }
    // loop: step through while on screen
    let id = 0;
    let i = 0;
    const run = () => {
      setActive(i % steps.length);
      i++;
    };
    const io = new IntersectionObserver(([entry]) => {
      window.clearInterval(id);
      if (entry.isIntersecting) {
        run();
        id = window.setInterval(run, 1300);
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      window.clearInterval(id);
    };
  }, [mode, steps.length]);

  const type =
    size === "lg"
      ? "text-[clamp(3rem,8.4vw,9.5rem)]"
      : size === "sm"
        ? "text-[clamp(2.1rem,min(4.4vw,7.4vh),5rem)]"
        : "text-[clamp(2.4rem,5.6vw,6.25rem)]";

  return (
    <figure className={`plate ${className}`}>
      <ol ref={list} className="flex flex-col" aria-label="System stages">
        {steps.map((s, k) => (
          <li
            key={s.label}
            data-step
            data-state="off"
            data-alt={s.alt ? "" : undefined}
            className="group grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-6 border-b rule py-[0.12em]"
          >
            <span className={`plate-label font-display ${type}`}>
              {s.alt && <span className="plate-branch meta mr-3 align-middle">↳</span>}
              {s.label}
            </span>
            <span className="plate-note meta pb-[0.35em] text-right">
              <span className="block text-ash">{String(k + 1).padStart(2, "0")}</span>
              {s.note}
            </span>
          </li>
        ))}
      </ol>
      {caption && <figcaption className="meta mt-4 text-ash">({caption})</figcaption>}
    </figure>
  );
});
