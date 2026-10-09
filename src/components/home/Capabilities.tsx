"use client";

import { useId, useRef, useState } from "react";
import { gsap, mq, useGSAP } from "@/motion/gsap";
import { capabilities } from "@/data/capabilities";
import { projects } from "@/data/projects";
import { site } from "@/data/site";
import { TransitionLink } from "@/components/ui/TransitionLink";

/**
 * Capabilities — an index, not a badge wall. Categories are set large; choosing
 * one reveals its tools and lights up the projects that actually use them.
 * Tabs semantics: arrow keys move between categories.
 */
export function Capabilities() {
  const root = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const uid = useId();
  const cap = capabilities[active];

  useGSAP(
    () => {
      const m = gsap.matchMedia();
      m.add(mq.motion, () => {
        gsap.from("[data-cap-tab]", {
          yPercent: 100,
          duration: 1,
          stagger: 0.05,
          scrollTrigger: { trigger: root.current, start: "top 65%" },
        });
      });
      return () => m.revert();
    },
    { scope: root },
  );

  // Swap animation for the detail panel.
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap.fromTo("[data-cap-item]", { yPercent: 100 }, { yPercent: 0, duration: 0.6, stagger: 0.03 });
    },
    { scope: root, dependencies: [active] },
  );

  const onKey = (e: React.KeyboardEvent) => {
    const n = capabilities.length;
    let next = active;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (active + 1) % n;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (active - 1 + n) % n;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = n - 1;
    else return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <section ref={root} id="capabilities" aria-labelledby="cap-title" className="relative border-t rule bg-ink px-pad py-[clamp(6rem,16vh,12rem)]">
      <div className="mb-[clamp(3rem,8vh,6rem)] grid grid-cols-12 gap-x-[var(--gutter)]">
        <p className="meta col-span-12 mb-4 text-ash lg:col-span-2">(03) Capabilities</p>
        <h2 id="cap-title" className="statement col-span-12 max-w-[22ch] lg:col-span-9">
          Full-stack by practice. <span className="text-ash">Backend and systems by choice.</span>
        </h2>
      </div>

      <div className="grid grid-cols-12 gap-x-[var(--gutter)] gap-y-12">
        {/* Category index */}
        <div role="tablist" aria-label="Capability groups" aria-orientation="vertical" className="col-span-12 flex flex-col lg:col-span-6" onKeyDown={onKey}>
          {capabilities.map((c, i) => {
            const on = i === active;
            return (
              <button
                key={c.key}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                role="tab"
                id={`${uid}-tab-${c.key}`}
                aria-selected={on}
                aria-controls={`${uid}-panel`}
                tabIndex={on ? 0 : -1}
                onClick={() => setActive(i)}
                onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
                className="group flex items-baseline gap-4 border-b rule text-left"
              >
                <span className="meta w-8 shrink-0 text-ash">{String(i + 1).padStart(2, "0")}</span>
                <span className="mask flex-1">
                  <span data-cap-tab className="block">
                    <span
                      className={`font-display block text-[clamp(3rem,7.2vw,7.5rem)] transition-[color,translate,opacity] duration-500 ease-[var(--ease-out)] ${
                        on ? "translate-x-3 text-bone" : "outline-type opacity-60 group-hover:opacity-100"
                      }`}
                    >
                      {c.title}
                    </span>
                  </span>
                </span>
                <span className={`meta shrink-0 transition-opacity ${on ? "text-signal opacity-100" : "opacity-0"}`} aria-hidden>
                  ●
                </span>
              </button>
            );
          })}
        </div>

        {/* Detail */}
        <div
          id={`${uid}-panel`}
          role="tabpanel"
          aria-labelledby={`${uid}-tab-${cap.key}`}
          className="col-span-12 flex flex-col gap-10 lg:sticky lg:top-[calc(var(--header-h)+4vh)] lg:col-span-5 lg:col-start-8 lg:self-start"
        >
          <ul className="flex flex-col">
            {cap.items.map((it) => (
              <li key={it} className="mask border-b rule">
                <span data-cap-item className="block py-2 text-[clamp(1.35rem,2.2vw,2.25rem)] tracking-[-0.03em]">
                  {it}
                </span>
              </li>
            ))}
          </ul>
          {cap.note && <p className="max-w-[40ch] text-bone/70">{cap.note}</p>}
          <div>
            <p className="meta mb-3 text-ash">(Used in)</p>
            <ul className="flex flex-wrap gap-2">
              {projects.map((p) => {
                const used = cap.projects.includes(p.index);
                return (
                  <li key={p.slug}>
                    {used ? (
                      <TransitionLink
                        href={`/work/${p.slug}`}
                        className="meta inline-flex items-center gap-2 border border-bone px-3 py-2 transition-colors hover:bg-bone hover:text-ink"
                      >
                        {p.index} <span className="normal-case tracking-normal">{p.title}</span>
                      </TransitionLink>
                    ) : (
                      <span className="meta inline-flex border border-[var(--line)] px-3 py-2 text-ash/50" aria-hidden>
                        {p.index}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            {cap.projects.length === 0 && <p className="meta mt-3 text-ash">→ See the visual archive</p>}
          </div>
        </div>
      </div>

      {/* Learning + practice — from the GitHub profile */}
      <div className="mt-[clamp(4rem,12vh,8rem)] grid grid-cols-12 gap-x-[var(--gutter)] gap-y-8 border-t rule pt-8">
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
