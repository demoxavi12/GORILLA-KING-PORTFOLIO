"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/motion/gsap";
import { projects, type Project } from "@/data/projects";
import { prefersReducedMotion, scrollToTarget } from "@/lib/store";
import { SystemField } from "@/anime/SystemField";
import { TransitionLink } from "@/components/ui/TransitionLink";

/**
 * Work — "five cuts". One pinned theatre. Each project is a full-screen scene
 * over its own living system. Scrolling to the next project triggers a katana
 * slash: stillness → an ember line → impact → the scene splits along the cut
 * and the halves fly apart, revealing the next project beneath.
 */

// The cut runs from the left edge at 64% height to the right edge at 30%.
const UPPER = "polygon(0% 0%, 100% 0%, 100% 30%, 0% 64%)";
const LOWER = "polygon(0% 64%, 100% 30%, 100% 100%, 0% 100%)";

export function Cuts() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const shards = useRef<HTMLDivElement>(null);
  const shake = useRef<HTMLDivElement>(null);
  const field = useRef<SystemField | null>(null);
  const current = useRef(0);
  const [active, setActive] = useState(0);
  const st = useRef<ScrollTrigger | null>(null);

  // Living system
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const f = new SystemField(c, {
      mobile: window.matchMedia("(max-width: 767.98px)").matches,
      still: prefersReducedMotion(),
    });
    f.setSteps(projects[0].system.steps, false);
    field.current = f;
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
  }, []);

  // The cut
  const cut = (from: number, to: number) => {
    const scenes = shake.current!.querySelectorAll<HTMLElement>("[data-cut]");
    const out = scenes[from];
    const inn = scenes[to];
    const reduce = prefersReducedMotion();
    scenes.forEach((s, i) => {
      s.style.visibility = i === to ? "visible" : "hidden";
      s.setAttribute("aria-hidden", i === to ? "false" : "true");
      if (i === to) s.removeAttribute("inert");
      else s.setAttribute("inert", "");
    });
    field.current?.setSteps(projects[to].system.steps, !reduce);
    if (reduce) {
      gsap.fromTo(inn, { opacity: 0 }, { opacity: 1, duration: 0.25 });
      return;
    }

    // Two shards of the outgoing scene
    const host = shards.current!;
    host.replaceChildren();
    const halves = [UPPER, LOWER].map((clip) => {
      const c = out.cloneNode(true) as HTMLElement;
      c.style.visibility = "visible";
      c.style.clipPath = clip;
      c.style.background = "#080808";
      c.setAttribute("aria-hidden", "true");
      c.setAttribute("inert", "");
      c.removeAttribute("data-cut");
      host.appendChild(c);
      return c;
    });
    const dir = to > from ? 1 : -1;
    const W = window.innerWidth;
    const rise = window.innerHeight * 0.34;
    gsap.set("[data-slash]", { width: Math.hypot(W, rise) + 8, rotation: (Math.atan2(-rise, W) * 180) / Math.PI, transformOrigin: "0% 50%", yPercent: -50 });

    gsap
      .timeline({ onComplete: () => host.replaceChildren() })
      // stillness → the line draws
      .fromTo("[data-slash]", { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.2, ease: "power4.in" }, 0)
      .fromTo(shake.current, { x: 0, y: 0 }, { keyframes: { x: [0, -10 * dir, 7 * dir, -3, 0], y: [0, 6, -4, 2, 0] }, duration: 0.3, ease: "none" }, 0.2)
      .to("[data-flashcut]", { keyframes: { opacity: [0, 0.35, 0] }, duration: 0.25, ease: "none" }, 0.18)
      // impact → halves fly apart along the cut
      .to(halves[0], { xPercent: -9 * dir, yPercent: -14, rotate: -3 * dir, opacity: 0, duration: 0.85, ease: "expo.out" }, 0.2)
      .to(halves[1], { xPercent: 9 * dir, yPercent: 14, rotate: 3 * dir, opacity: 0, duration: 0.85, ease: "expo.out" }, 0.2)
      .to("[data-slash]", { autoAlpha: 0, duration: 0.35 }, 0.32)
      // the next scene settles in
      .fromTo(inn, { scale: 1.08, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.9, ease: "expo.out" }, 0.22)
      .fromTo(inn.querySelectorAll("[data-cl]"), { yPercent: 105 }, { yPercent: 0, duration: 0.8, ease: "expo.out", stagger: 0.06 }, 0.28)
      .fromTo(inn.querySelectorAll("[data-cf]"), { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.04 }, 0.45);
  };

  // Pin + scroll → which cut is on stage
  useGSAP(
    () => {
      const n = projects.length;
      st.current = ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: () => `+=${window.innerHeight * (n - 1) * 0.9}`,
        pin: stage.current,
        snap: prefersReducedMotion() ? undefined : { snapTo: 1 / (n - 1), duration: { min: 0.25, max: 0.6 }, delay: 0.08, ease: "power2.inOut" },
        onUpdate: (self) => {
          const i = Math.round(self.progress * (n - 1));
          if (i !== current.current) {
            const from = current.current;
            current.current = i;
            setActive(i);
            cut(from, i);
          }
        },
      });
      return () => st.current?.kill();
    },
    { scope: root },
  );

  const goTo = (i: number) => {
    const s = st.current;
    if (!s) return;
    scrollToTarget(s.start + (s.end - s.start) * (i / (projects.length - 1)) + 2);
  };

  return (
    <section ref={root} id="work" aria-labelledby="work-title" className="relative bg-ink">
      <h2 id="work-title" className="sr-only">
        Selected work
      </h2>
      <div ref={stage} className="relative h-[100svh] overflow-hidden bg-ink">
        <div ref={shake} className="absolute inset-0">
        <canvas ref={canvas} aria-hidden className="absolute inset-0 h-full w-full" />

        {projects.map((p, i) => (
          <Scene key={p.slug} p={p} total={projects.length} visible={i === 0} />
        ))}

        <div ref={shards} aria-hidden className="pointer-events-none absolute inset-0" />
        <div data-flashcut aria-hidden className="pointer-events-none absolute inset-0 bg-ember opacity-0 mix-blend-screen" />
        {/* The slash — exactly along the cut */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            data-slash
            className="absolute left-0 top-[64%] h-[3px] w-screen bg-ember shadow-[0_0_24px_4px_rgba(224,72,44,.55)]"
            style={{ visibility: "hidden" }}
          />
        </div>

        </div>

        {/* Cut index */}
        <nav aria-label="Projects" className="meta absolute bottom-[clamp(1rem,3vh,2rem)] left-[var(--pad)] right-[var(--pad)] z-10 flex items-end justify-between gap-4">
          <ol className="flex gap-1.5">
            {projects.map((p, i) => (
              <li key={p.slug}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={i === active ? "true" : undefined}
                  aria-label={`Cut ${p.index}: ${p.title}`}
                  className="group flex flex-col items-start gap-2 py-2"
                >
                  <span className={`block h-[3px] transition-all duration-500 ${i === active ? "w-14 bg-ember" : "w-6 bg-bone/25 group-hover:bg-bone/60"}`} />
                  <span className={i === active ? "text-bone" : "text-ash"}>{p.index}</span>
                </button>
              </li>
            ))}
          </ol>
          <span className="hidden text-ash sm:block">Scroll — each cut is a project</span>
        </nav>
      </div>
    </section>
  );
}

function Scene({ p, total, visible }: { p: Project; total: number; visible: boolean }) {
  const link = { href: `/work/${p.slug}`, takeover: { index: p.index, title: p.title } };
  return (
    <article
      data-cut
      aria-labelledby={`cut-${p.slug}`}
      aria-hidden={!visible}
      inert={!visible}
      className="absolute inset-0 px-pad pt-[calc(var(--header-h)+2vh)] pb-[clamp(4rem,10vh,6rem)]"
      style={{ visibility: visible ? "visible" : "hidden" }}
    >
      {/* Giant index — outline, cropped by the left edge */}
      <span
        aria-hidden
        className="font-display pointer-events-none absolute -left-[0.06em] top-[8vh] select-none text-[clamp(14rem,48vh,34rem)] leading-[0.8] outline-type opacity-30"
      >
        {p.index}
      </span>

      <div className="relative flex h-full flex-col">
        <div className="meta flex flex-wrap items-center justify-between gap-3 text-ash">
          <span data-cf>
            <span className="text-ember">Cut {p.index}</span> / {String(total).padStart(2, "0")} · {p.type}
          </span>
          <span data-cf className="text-bone">
            {p.year}
          </span>
        </div>

        {/* Stack — set along the right edge */}
        <ul className="meta absolute right-0 top-[18%] hidden flex-col items-end gap-1.5 text-ash lg:flex" aria-label="Stack">
          {p.stack.map((s) => (
            <li key={s} data-cf>
              {s}
            </li>
          ))}
        </ul>

        <div className="mt-auto max-w-[min(100%,64rem)]">
          <h3 id={`cut-${p.slug}`}>
            <TransitionLink {...link} data-cursor="project" className="group block" aria-label={`${p.title} — enter the case study`}>
              {p.display.map((line) => (
                <span key={line} className="mask">
                  <span data-cl className="font-display block text-[clamp(4rem,min(12.5vw,19vh),14rem)] transition-colors duration-300 group-hover:text-ember">
                    {line}
                  </span>
                </span>
              ))}
            </TransitionLink>
          </h3>
          {/* the idea, before the implementation */}
          <p data-cf className="lede mt-5 max-w-[44ch] text-bone">
            {p.summary}
          </p>
          <div data-cf className="meta mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-ash">
            <span>{p.language}</span>
            <TransitionLink {...link} className="text-bone">
              <span className="ulink">Enter the case</span> <span className="text-ember">→</span>
            </TransitionLink>
            <a href={p.repoUrl} target="_blank" rel="noreferrer" className="ulink">
              Source ↗
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
