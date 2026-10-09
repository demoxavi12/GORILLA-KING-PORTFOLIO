"use client";

import { useEffect, useRef } from "react";
import { SystemField } from "@/anime/SystemField";
import { gsap, mq, ScrollTrigger, useGSAP } from "@/motion/gsap";
import type { Project } from "@/data/projects";
import { prefersReducedMotion, scrollToTarget, useUI } from "@/lib/store";
import { SystemPlate } from "./SystemPlate";
import { TransitionLink } from "@/components/ui/TransitionLink";

const CHAPTERS = [
  { id: "overview", label: "Overview" },
  { id: "problem", label: "Problem" },
  { id: "approach", label: "Approach" },
  { id: "system", label: "System" },
  { id: "code", label: "In the code" },
  { id: "status", label: "Status" },
] as const;

/**
 * Case study. The hero title sits exactly where the takeover overlay leaves it,
 * so the transition from Selected Work lands without a jump. A sticky rail
 * tracks the chapters; the system plate runs on its own in the System chapter.
 */
export function CaseStudy({ project: p, next, total }: { project: Project; next: Project; total: number }) {
  const root = useRef<HTMLElement>(null);
  const introDone = useUI((s) => s.introDone);
  const field = useRef<HTMLCanvasElement>(null);

  // The project's living system, running behind its title
  useEffect(() => {
    const c = field.current;
    if (!c) return;
    const f = new SystemField(c, { mobile: window.matchMedia("(max-width: 767.98px)").matches, still: prefersReducedMotion() });
    f.setSteps(p.system.steps, false);
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? f.start() : f.stop()));
    io.observe(c);
    const move = (e: PointerEvent) => f.setPointer(e.clientX, e.clientY);
    const resize = () => f.resize();
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("resize", resize);
    return () => {
      io.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("resize", resize);
      f.dispose();
    };
  }, [p]);

  useGSAP(
    () => {
      if (!introDone) return;
      const m = gsap.matchMedia();
      m.add(mq.motion, () => {
        gsap
          .timeline({ delay: 0.15 })
          .from("[data-cs-fade]", { autoAlpha: 0, y: 14, duration: 0.9, stagger: 0.06 })
          .from("[data-cs-rule]", { scaleX: 0, transformOrigin: "left", duration: 1.2, ease: "cut", stagger: 0.04 }, 0);

        gsap.utils.toArray<HTMLElement>("[data-cs-block]").forEach((el) => {
          gsap.from(el, { autoAlpha: 0, y: 36, duration: 1.2, scrollTrigger: { trigger: el, start: "top 85%" } });
        });

        // Next project: the title is pulled toward the viewer as you approach.
        gsap.fromTo(
          "[data-cs-next]",
          { scale: 0.86, transformOrigin: "left bottom" },
          { scale: 1, ease: "none", scrollTrigger: { trigger: "[data-cs-next-wrap]", start: "top bottom", end: "bottom bottom", scrub: true } },
        );
      });
      m.add(mq.reduce, () => gsap.set("[data-cs-fade]", { autoAlpha: 1 }));

      // Chapter rail — mark the active chapter.
      const links = gsap.utils.toArray<HTMLElement>("[data-rail]");
      CHAPTERS.forEach((c, i) => {
        ScrollTrigger.create({
          trigger: `#${c.id}`,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => {
            if (self.isActive) links.forEach((l, k) => (l.dataset.on = String(k === i)));
          },
        });
      });
      return () => m.revert();
    },
    { scope: root, dependencies: [introDone] },
  );

  const meta: [string, React.ReactNode][] = [
    ["Year", p.year],
    ["Type", p.type],
    ["Language", p.language],
    [
      "Source",
      <a key="src" href={p.repoUrl} target="_blank" rel="noreferrer" className="ulink break-all">
        github/{p.repo} ↗
      </a>,
    ],
  ];

  return (
    <article ref={root} aria-labelledby="cs-title" className="bg-ink">
      {/* Hero — mirrors the takeover overlay */}
      <header className="relative flex min-h-[100svh] flex-col px-pad pb-[8vh] pt-[calc(var(--header-h)+2vh)]">
        <canvas ref={field} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />
        <div className="meta relative flex items-center justify-between text-ash">
          <TransitionLink href="/#work" data-cs-fade data-reveal className="ulink text-bone">
            ← All work
          </TransitionLink>
          <span data-cs-fade data-reveal>
            Case {p.index} / {String(total).padStart(2, "0")}
          </span>
        </div>

        <p data-cs-fade data-reveal className="lede relative mt-auto max-w-[44ch] pb-[6vh] text-bone/80 lg:w-[38%]">
          {p.summary}
        </p>

        <span className="meta relative text-ember">Cut {p.index}</span>
        <h1 id="cs-title" className="font-display relative mt-3 text-[clamp(3.5rem,13vw,15rem)]">
          {p.title}
        </h1>
      </header>

      {/* Meta table */}
      <dl className="meta grid grid-cols-2 border-y rule px-pad md:grid-cols-4">
        {meta.map(([k, v]) => (
          <div key={k} className="flex min-w-0 flex-col gap-1.5 border-r rule py-5 pr-4 last:border-r-0 [&:nth-child(2)]:border-r-0 md:[&:nth-child(2)]:border-r">
            <dt className="text-ash" data-cs-fade data-reveal>
              {k}
            </dt>
            <dd data-cs-fade data-reveal>
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <p className="meta border-b rule px-pad py-4 text-ash">
        <span className="text-bone">Stack —</span> {p.stack.join(" · ")}
      </p>

      {/* Body */}
      <div className="grid grid-cols-12 gap-x-[var(--gutter)] px-pad py-[clamp(5rem,14vh,10rem)]">
        <nav aria-label="Chapters" className="meta col-span-3 hidden lg:block">
          <ol className="sticky top-[calc(var(--header-h)+4vh)] flex flex-col gap-2">
            {CHAPTERS.map((c, i) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToTarget(`#${c.id}`);
                  }}
                  data-rail
                  data-on={i === 0 ? "true" : "false"}
                  className="flex gap-3 text-ash transition-colors data-[on=true]:text-bone"
                >
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <span>{c.label}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="col-span-12 flex flex-col gap-[clamp(5rem,14vh,10rem)] lg:col-span-8 lg:col-start-5">
          <Chapter id="overview" n="01" label="Overview">
            <p className="statement max-w-[24ch] !text-[clamp(1.6rem,3vw,3.25rem)] !leading-[1.05]">{p.overview}</p>
          </Chapter>

          <Chapter id="problem" n="02" label="Problem">
            <p className="lede max-w-[46ch] text-bone/85">{p.problem}</p>
          </Chapter>

          <Chapter id="approach" n="03" label="Approach">
            <ol className="flex flex-col">
              {p.approach.map((a, i) => (
                <li key={i} className="grid grid-cols-[3rem_1fr] gap-4 border-t rule py-6">
                  <span className="meta pt-1 text-ash">{String(i + 1).padStart(2, "0")}</span>
                  <p className="max-w-[60ch] text-bone/85">{a}</p>
                </li>
              ))}
            </ol>
          </Chapter>

          <Chapter id="system" n="04" label="System">
            <SystemPlate steps={p.system.steps} caption={p.system.caption} mode="loop" size="lg" />
          </Chapter>

          <Chapter id="code" n="05" label="In the code">
            <dl className="grid grid-cols-1 sm:grid-cols-2">
              {p.inCode.map((r) => (
                <div key={r.label} className="flex flex-col gap-1 border-t rule py-5 sm:pr-6">
                  <dt className="meta text-ash">{r.label}</dt>
                  <dd className="text-[clamp(1.1rem,1.6vw,1.5rem)] tracking-[-0.02em]">{r.value}</dd>
                </div>
              ))}
            </dl>
            <p className="meta mt-6 text-ash">Values are read from the repository&rsquo;s configuration and schema — not measured results.</p>
          </Chapter>

          <Chapter id="status" n="06" label="Status">
            <p className="lede max-w-[46ch]">{p.status}</p>
            <a href={p.repoUrl} target="_blank" rel="noreferrer" className="meta mt-8 inline-flex items-center gap-3 border border-bone px-4 py-3 transition-colors hover:bg-bone hover:text-ink">
              Open repository ↗
            </a>
          </Chapter>
        </div>
      </div>

      {/* Next project */}
      <div data-cs-next-wrap className="border-t rule">
        <TransitionLink
          href={`/work/${next.slug}`}
          takeover={{ index: next.index, title: next.title }}
          data-cursor="project"
          className="group flex min-h-[80svh] flex-col justify-end px-pad pb-[8vh] pt-16"
        >
          <span className="meta flex justify-between text-ash">
            <span>Next case — ({next.index})</span>
            <span className="hidden sm:block">{next.type}</span>
          </span>
          <span data-cs-next className="font-display mt-6 block text-[clamp(3.5rem,13vw,15rem)] transition-colors duration-500 group-hover:text-signal">
            {next.title}
          </span>
        </TransitionLink>
      </div>
    </article>
  );
}

function Chapter({ id, n, label, children }: { id: string; n: string; label: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} data-cs-block className="scroll-mt-[calc(var(--header-h)+4vh)]">
      <h2 id={`${id}-h`} className="meta mb-6 flex gap-3 text-ash">
        <span>{n}</span>
        <span className="text-bone">{label}</span>
      </h2>
      {children}
    </section>
  );
}
