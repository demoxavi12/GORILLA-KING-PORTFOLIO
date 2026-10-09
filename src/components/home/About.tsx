"use client";

import { useRef } from "react";
import { gsap, mq, useGSAP } from "@/motion/gsap";
import { site } from "@/data/site";

/**
 * About — the one moment of extreme stillness.
 * The archive's iris has just closed to a point; that point stays, small and
 * ember, at the centre of an almost empty frame. One statement. Small metadata.
 * Nothing moves except a slow fade. The final scene hits harder after it.
 */
export function About() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const m = gsap.matchMedia();
      m.add(mq.motion, () => {
        gsap.from("[data-ab-still]", { autoAlpha: 0, duration: 2.4, ease: "power1.out", stagger: 0.35, scrollTrigger: { trigger: root.current, start: "top 60%" } });
        gsap.utils.toArray<HTMLElement>("[data-ab]").forEach((el) => {
          gsap.from(el, { autoAlpha: 0, duration: 1.8, ease: "power1.out", scrollTrigger: { trigger: el, start: "top 88%" } });
        });
      });
      return () => m.revert();
    },
    { scope: root },
  );

  const facts: [string, string][] = [
    ["Based in", site.location],
    ["Practice", site.role],
    ["Focus", site.focus],
    ["Problem solving", "Data structures & algorithms in Java"],
    ["Outside code", "Photography · editing · color grading"],
  ];

  return (
    <section ref={root} id="about" aria-labelledby="about-title" className="relative bg-ink">
      {/* The still frame */}
      <div className="relative flex min-h-[100svh] flex-col px-pad py-[calc(var(--header-h)+4vh)]">
        <p data-ab-still className="meta flex justify-between text-ash">
          <span>(05) About</span>
          <span>{site.location}</span>
        </p>
        {/* the vanishing point, left behind */}
        <span aria-hidden className="absolute left-1/2 top-1/2 block h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ember" />
        <h2 id="about-title" data-ab-still className="mt-auto max-w-[19ch] text-[clamp(1.9rem,4.4vw,4.6rem)] font-medium leading-[1.02] tracking-[-0.045em] text-[#bdbdbd]">
          {site.profile.goal}
        </h2>
      </div>

      {/* Then, quietly, the person */}
      <div className="grid grid-cols-12 gap-x-[var(--gutter)] gap-y-12 border-t rule px-pad pb-[clamp(6rem,16vh,10rem)] pt-[clamp(3rem,8vh,5rem)]">
        <div className="col-span-12 flex flex-col gap-6 md:col-span-7 lg:col-span-5">
          {site.about.map((p) => (
            <p key={p.slice(0, 16)} data-ab className="lede text-bone/80">
              {p}
            </p>
          ))}
          <p data-ab className="text-ash">
            {site.profile.backend}
          </p>
        </div>
        <dl data-ab className="meta col-span-12 grid grid-cols-[8.5rem_1fr] self-end md:col-span-5 lg:col-span-4 lg:col-start-9">
          {facts.map(([k, v]) => (
            <div key={k} className="col-span-2 grid grid-cols-subgrid border-t rule py-2.5">
              <dt className="text-ash">{k}</dt>
              <dd className="text-bone">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
