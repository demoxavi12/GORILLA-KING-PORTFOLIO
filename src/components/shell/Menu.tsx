"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "@/motion/gsap";
import { nav, site } from "@/data/site";
import { projects } from "@/data/projects";
import { archive } from "@/data/archive";
import { prefersReducedMotion, ui, useUI } from "@/lib/store";
import { TransitionLink } from "@/components/ui/TransitionLink";
import { Clock } from "./Clock";

/** Each destination carries a frame from the archive as its preview. */
const PREVIEW: Record<string, { src: string; count?: number }> = {
  Work: { src: "/archive/frame-10.webp", count: projects.length },
  Archive: { src: "/archive/frame-06.webp", count: archive.length },
  About: { src: "/archive/frame-11.webp" },
  Contact: { src: "/archive/frame-24.webp" },
};

/**
 * Full-screen menu — a composed scene, not an overlay list.
 * Left: direct contact. Right: oversized destinations with counts; hovering one
 * dims the rest and swaps the preview frame.
 */
export function Menu() {
  const open = useUI((s) => s.menuOpen);
  const root = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const [active, setActive] = useState<string | null>(null);

  useGSAP(
    () => {
      tl.current = gsap
        .timeline({ paused: true, defaults: { ease: "out" } })
        .set(root.current, { autoAlpha: 1 })
        .fromTo(
          "[data-m-panel]",
          { clipPath: "polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)" },
          { clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)", duration: 0.8, ease: "cut" },
        )
        .fromTo("[data-m-item]", { yPercent: 110 }, { yPercent: 0, duration: 1, stagger: 0.06 }, 0.35)
        .fromTo("[data-m-fade]", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.04 }, 0.5)
        .fromTo("[data-m-preview]", { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "cut" }, 0.45);
    },
    { scope: root },
  );

  // Play / reverse + focus management + inert background.
  useEffect(() => {
    const t = tl.current;
    const main = document.getElementById("main");
    const footer = document.getElementById("site-footer");
    if (!t) return;
    if (open) {
      main?.setAttribute("inert", "");
      footer?.setAttribute("inert", "");
      if (prefersReducedMotion()) t.progress(1);
      else t.timeScale(1).play();
      const first = root.current?.querySelector<HTMLElement>("[data-m-first]");
      window.setTimeout(() => first?.focus({ preventScroll: true }), 60);
    } else {
      main?.removeAttribute("inert");
      footer?.removeAttribute("inert");
      if (t.progress() > 0) {
        if (prefersReducedMotion()) t.progress(0);
        else t.timeScale(1.7).reverse();
        document.getElementById("menu-toggle")?.focus({ preventScroll: true });
      }
    }
  }, [open]);

  // Esc to close, Tab trapped inside the dialog.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") ui.set({ menuOpen: false });
      if (e.key !== "Tab" || !root.current) return;
      const f = Array.from(root.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"));
      if (!f.length) return;
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => ui.set({ menuOpen: false });
  const preview = PREVIEW[active ?? "Work"];

  return (
    <div
      ref={root}
      id="site-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      aria-hidden={!open}
      className="fixed inset-0"
      style={{ zIndex: "var(--z-menu)", visibility: "hidden" }}
    >
      <div data-m-panel className="flex h-full flex-col bg-ink-2 px-pad">
        {/* top row mirrors the header */}
        <div className="meta flex h-[var(--header-h)] shrink-0 items-center justify-between">
          <span data-m-fade className="font-sans text-[0.8125rem] font-semibold tracking-[0.02em]">
            {site.initials}
          </span>
          <button data-m-fade data-cursor="menu" type="button" onClick={close} className="group flex items-center gap-2.5 py-2">
            <span className="relative block h-[9px] w-[12px]" aria-hidden>
              <span className="absolute left-0 top-1/2 h-px w-full rotate-45 bg-current" />
              <span className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-current" />
            </span>
            Close
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-12 gap-x-[var(--gutter)] border-t rule pt-[clamp(1.5rem,5vh,4rem)]">
          {/* Destinations */}
          <nav aria-label="Menu" className="col-span-12 lg:order-2 lg:col-span-7">
            <ul
              className="flex flex-col"
              onPointerLeave={() => setActive(null)}
            >
              {nav.map((item, i) => {
                const count = PREVIEW[item.label]?.count;
                const dim = active !== null && active !== item.label;
                return (
                  <li key={item.href} className="border-b rule">
                    <TransitionLink
                      href={item.href}
                      onClick={close}
                      data-m-first={i === 0 ? "" : undefined}
                      onPointerEnter={() => setActive(item.label)}
                      onFocus={() => setActive(item.label)}
                      className="group flex items-baseline gap-4 py-[clamp(0.25rem,1vh,0.75rem)] transition-opacity duration-500"
                      style={{ opacity: dim ? 0.22 : 1 }}
                    >
                      <span className="meta w-8 shrink-0 text-ash">{item.index}</span>
                      <span className="mask">
                        <span data-m-item className="font-display block text-[clamp(3.25rem,10.5vh,9rem)] transition-[translate] duration-700 ease-[var(--ease-out)] group-hover:translate-x-3">
                          {item.label}
                          {count !== undefined && (
                            <sup className="meta ml-2 align-top text-ash">({String(count).padStart(2, "0")})</sup>
                          )}
                        </span>
                      </span>
                    </TransitionLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Contact + preview */}
          <div className="col-span-12 mt-10 flex flex-col justify-between gap-10 pb-[clamp(1.5rem,4vh,3rem)] lg:order-1 lg:col-span-5 lg:mt-0">
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-1 lg:gap-8">
              <div data-m-fade>
                <p className="meta mb-2 text-ash">(Write)</p>
                <a href={`mailto:${site.email}`} className="ulink text-[clamp(0.95rem,1.3vw,1.25rem)] tracking-tight">
                  {site.email}
                </a>
              </div>
              <div data-m-fade>
                <p className="meta mb-2 text-ash">(Elsewhere)</p>
                <ul className="flex flex-col gap-1">
                  {site.socials.map((s) => (
                    <li key={s.href}>
                      <a href={s.href} target="_blank" rel="noreferrer" className="ulink">
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex items-end justify-between gap-6">
              <div data-m-fade className="meta flex flex-col gap-1 text-ash">
                <Clock className="text-bone" />
                <span>{site.location}</span>
              </div>
              <div
                data-m-preview
                className="relative hidden aspect-[3/4] w-[clamp(9rem,15vw,15rem)] overflow-hidden bg-ink lg:block"
                aria-hidden
              >
                {Object.entries(PREVIEW).map(([k, v]) => (
                  <Image
                    key={k}
                    src={v.src}
                    alt=""
                    fill
                    sizes="15rem"
                    quality={70}
                    className="object-cover grayscale transition-[opacity,transform] duration-700 ease-[var(--ease-out)]"
                    style={{ opacity: preview.src === v.src ? 1 : 0, transform: preview.src === v.src ? "scale(1)" : "scale(1.08)" }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
