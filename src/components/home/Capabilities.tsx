"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap, mq, useGSAP } from "@/motion/gsap";
import { capabilities } from "@/data/capabilities";
import { projects } from "@/data/projects";
import { site } from "@/data/site";
import { TransitionLink } from "@/components/ui/TransitionLink";

/**
 * Capabilities — active rows.
 * Large numbered rows on the night. Hover, keyboard focus or tap makes a row the
 * active panel: a deep-vermillion field wipes across it, one of Sabya's photographs
 * emerges behind it through a slash-cut mask and drifts with the pointer, and the
 * title steps forward while the other rows recede. The active row persists when the
 * pointer leaves (no flicker crossing the image); moving to another row transfers it.
 */

/** Sabya's photographs, matched to each group. */
const VISUAL: Record<string, { src: string; alt: string }> = {
  systems: { src: "/archive/frame-18.webp", alt: "Macro view of a logic board and processor" },
  backend: { src: "/archive/frame-17.webp", alt: "A backlit keyboard in the dark" },
  data: { src: "/archive/frame-25.webp", alt: "A translucent MiniDisc cartridge" },
  frontend: { src: "/archive/frame-08.webp", alt: "Headphones and a phone beside an open laptop" },
  languages: { src: "/archive/frame-10.webp", alt: "A glowing CRT television in a dark room" },
  craft: { src: "/archive/frame-02.webp", alt: "A Fujifilm camera on dark cloth" },
};

export function Capabilities() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const drift = useRef<{ x: (v: number) => void; y: (v: number) => void }[]>([]);

  useGSAP(
    () => {
      const m = gsap.matchMedia();
      m.add(mq.motion, () => {
        gsap.from("[data-row-line]", {
          yPercent: 105,
          duration: 1,
          stagger: 0.06,
          ease: "expo.out",
          scrollTrigger: { trigger: "[data-rows]", start: "top 72%" },
        });
      });
      return () => m.revert();
    },
    { scope: root },
  );

  // The image inside each row drifts with the pointer (only matters on the active row).
  useEffect(() => {
    const el = root.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const imgs = Array.from(el.querySelectorAll<HTMLElement>("[data-row-photo]"));
    drift.current = imgs.map((img) => ({
      x: gsap.quickTo(img, "xPercent", { duration: 0.9, ease: "power3.out" }),
      y: gsap.quickTo(img, "yPercent", { duration: 0.9, ease: "power3.out" }),
    }));
  }, []);

  const onMove = (i: number, e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width - 0.5;
    const ny = (e.clientY - r.top) / r.height - 0.5;
    drift.current[i]?.x(nx * -6);
    drift.current[i]?.y(ny * -10);
  };

  return (
    <section ref={root} id="capabilities" aria-labelledby="cap-title" className="relative border-t rule bg-ink py-[clamp(6rem,16vh,12rem)]">
      <div className="mb-[clamp(3rem,8vh,5rem)] grid grid-cols-12 gap-x-[var(--gutter)] px-pad">
        <p className="meta col-span-12 mb-4 text-ash lg:col-span-2">(03) Capabilities</p>
        <h2 id="cap-title" className="statement col-span-12 max-w-[22ch] lg:col-span-9">
          Full-stack by practice. <span className="text-ash">Backend and systems by choice.</span>
        </h2>
      </div>

      <ul data-rows className="border-t border-bone/15">
        {capabilities.map((c, i) => {
          const on = active === i;
          const dim = active !== null && !on;
          const v = VISUAL[c.key];
          const used = projects.filter((p) => c.projects.includes(p.index));
          return (
            <li
              key={c.key}
              data-active={on ? "" : undefined}
              className="group/row relative overflow-hidden border-b border-bone/15"
              onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
              onPointerMove={(e) => onMove(i, e)}
            >
              {/* the vermillion field */}
              <div
                aria-hidden
                className="absolute inset-0 bg-[#b8301b] transition-[clip-path] duration-[650ms] ease-[var(--ease-cut)]"
                style={{ clipPath: on ? "inset(0 0 0 0)" : "inset(0 100% 0 0)" }}
              />
              {/* the photograph, emerging through a slash-cut mask */}
              <div
                aria-hidden
                className="absolute inset-y-0 right-0 w-[40%] overflow-hidden transition-[clip-path] duration-[800ms] ease-[var(--ease-out)] md:w-[46%]"
                style={{
                  clipPath: on ? "polygon(16% 0, 100% 0, 100% 100%, 0 100%)" : "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
                  transitionDelay: on ? "120ms" : "0ms",
                }}
              >
                <div data-row-photo className="absolute -inset-[8%]">
                  <Image
                    src={v.src}
                    alt=""
                    fill
                    quality={70}
                    sizes="(max-width: 767px) 60vw, 46vw"
                    className="object-cover grayscale contrast-125 mix-blend-multiply"
                    style={{ transform: on ? "scale(1)" : "scale(1.12)", transition: "transform 1.2s cubic-bezier(0.16,1,0.3,1)" }}
                  />
                </div>
                <div className="absolute inset-0 bg-[#b8301b] mix-blend-color opacity-60" />
              </div>

              <button
                type="button"
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                aria-describedby={`cap-${c.key}-items`}
                aria-expanded={on}
                className="relative grid w-full grid-cols-[3.2rem_1fr] items-baseline gap-x-[var(--gutter)] px-pad py-[clamp(1rem,2.6vh,1.8rem)] text-left md:grid-cols-[6rem_1fr]"
              >
                <span className={`font-display text-[clamp(1.6rem,3.2vw,3.2rem)] transition-colors duration-500 ${on ? "text-bone" : dim ? "text-ash/40" : "text-bone"}`}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex flex-col">
                  <span className="mask">
                    <span
                      data-row-line
                      className={`font-display block text-[clamp(2.8rem,7vw,7.4rem)] leading-[0.86] transition-[color,translate,opacity] duration-500 ease-[var(--ease-out)] ${
                        on ? "translate-x-[0.18em] text-bone" : dim ? "text-bone/35" : "text-bone"
                      }`}
                    >
                      {c.title}
                    </span>
                  </span>
                  <span
                    id={`cap-${c.key}-items`}
                    className={`mt-2 max-w-[52ch] text-[clamp(0.85rem,1.05vw,1rem)] transition-colors duration-500 max-md:pr-[34%] ${on ? "text-bone" : dim ? "text-ash/50" : "text-ash"}`}
                  >
                    {c.items.join(" · ")}
                  </span>
                </span>
              </button>

              {/* where it's used — pinned inside the panel so the row never changes height (no reflow under the pointer) */}
              <div
                className={`absolute bottom-[clamp(0.6rem,1.6vh,1rem)] right-[var(--pad)] flex max-w-[56%] flex-wrap items-center justify-end gap-1.5 transition-opacity duration-500 max-md:hidden ${
                  on ? "opacity-100 delay-200" : "pointer-events-none opacity-0"
                }`}
                inert={!on}
              >
                {used.length > 0 && <span className="meta mr-1 text-bone/85">Used in</span>}
                {used.map((p) => (
                  <TransitionLink
                    key={p.slug}
                    href={`/work/${p.slug}`}
                    className="meta inline-flex items-center gap-1.5 bg-ink/70 px-2.5 py-1.5 text-bone backdrop-blur-[2px] transition-colors hover:bg-bone hover:text-[#b8301b]"
                  >
                    {p.index} <span className="normal-case tracking-normal">{p.title}</span>
                  </TransitionLink>
                ))}
                {c.key === "craft" && <span className="meta bg-ink/70 px-2.5 py-1.5 text-bone">→ See the visual archive</span>}
              </div>
              <span className="sr-only">{v.alt}</span>
            </li>
          );
        })}
      </ul>

      {/* Learning + practice — from the GitHub profile */}
      <div className="mt-[clamp(4rem,12vh,8rem)] grid grid-cols-12 gap-x-[var(--gutter)] gap-y-8 px-pad">
        <div className="col-span-12 md:col-span-6 lg:col-span-4 lg:col-start-1">
          <p className="meta mb-3 text-ash">(Currently learning)</p>
          <p className="lede">{site.profile.learning.join(" · ")}</p>
        </div>
        <div className="col-span-12 md:col-span-6 lg:col-span-4 lg:col-start-8">
          <p className="meta mb-3 text-ash">(Practice)</p>
          <p className="lede">
            {site.profile.competitive}{" "}
            <a href="https://github.com/Mrsachin-Developer/DSA" target="_blank" rel="noreferrer" className="ulink text-ash">
              DSA repository ↗
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
