"use client";

import { useRef } from "react";
import { gsap, mq, useGSAP } from "@/motion/gsap";
import { projects } from "@/data/projects";
import { useUI } from "@/lib/store";
import { TransitionLink } from "@/components/ui/TransitionLink";

/** A quiet index of every case — a typeset table, not a grid of cards. */
export function WorkIndex() {
  const root = useRef<HTMLElement>(null);
  const introDone = useUI((s) => s.introDone);

  useGSAP(
    () => {
      if (!introDone) return;
      const m = gsap.matchMedia();
      m.add(mq.motion, () => {
        gsap.from("[data-wi-line]", { yPercent: 105, duration: 1.1, stagger: 0.06, delay: 0.1 });
      });
      return () => m.revert();
    },
    { scope: root, dependencies: [introDone] },
  );

  return (
    <section ref={root} aria-labelledby="wi-title" className="min-h-[100svh] px-pad pb-24 pt-[calc(var(--header-h)+8vh)]">
      <div className="mb-[8vh] flex items-end justify-between">
        <h1 id="wi-title" className="font-display text-[clamp(4.5rem,15vw,16rem)]">
          <span className="mask">
            <span data-wi-line>Index</span>
          </span>
        </h1>
        <p className="font-display text-[clamp(3rem,9vw,10rem)] text-ash">0_{projects.length}</p>
      </div>

      <div className="meta hidden grid-cols-12 gap-x-[var(--gutter)] border-b rule pb-3 text-ash md:grid">
        <span className="col-span-1">No.</span>
        <span className="col-span-6">Project</span>
        <span className="col-span-3">Type</span>
        <span className="col-span-2 text-right">Year</span>
      </div>
      <ol>
        {projects.map((p) => (
          <li key={p.slug} className="border-b rule">
            <TransitionLink
              href={`/work/${p.slug}`}
              takeover={{ index: p.index, title: p.title }}
              data-cursor="project"
              className="group grid grid-cols-12 items-baseline gap-x-[var(--gutter)] py-4"
            >
              <span className="meta col-span-2 text-ash md:col-span-1">{p.index}</span>
              <span className="mask col-span-10 md:col-span-6">
                <span data-wi-line className="font-display block text-[clamp(2.25rem,5.4vw,6rem)] transition-[color,translate] duration-500 ease-[var(--ease-out)] group-hover:translate-x-4 group-hover:text-signal">
                  {p.title}
                </span>
              </span>
              <span className="meta col-span-10 col-start-3 text-ash md:col-span-3 md:col-start-auto">{p.type}</span>
              <span className="meta col-span-2 text-right md:col-span-2">{p.year}</span>
            </TransitionLink>
          </li>
        ))}
      </ol>
    </section>
  );
}
