"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { gsap, mq, ScrollTrigger, useGSAP } from "@/motion/gsap";
import { site } from "@/data/site";

/**
 * The final scene. After the stillness of About, it hits.
 *  - the moon, reduced to its outline: one silver ring
 *  - inside it, a letterbox slit of one of Sabya's night photographs; it opens
 *    when the hand comes near (discovered, not announced)
 *  - the address as a monumental object, fitted exactly to the frame; its two
 *    lines drift apart with the cursor
 */

const SLIT = { src: "/archive/frame-06.webp", alt: "A lone figure under a highway overpass in teal fog — one of Sabya's photographs." };

export function Contact() {
  const root = useRef<HTMLElement>(null);
  const mail = useRef<HTMLAnchorElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const slit = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [user, domain] = site.email.split("@");

  // Fit the address to the full frame width (both lines share one size).
  useEffect(() => {
    const a = mail.current;
    if (!a) return;
    const probe = a.querySelector<HTMLElement>("[data-fit]")!;
    const fit = () => {
      a.style.setProperty("--mail-size", "100px");
      const w = probe.getBoundingClientRect().width;
      const target = a.getBoundingClientRect().width;
      if (w > 0) a.style.setProperty("--mail-size", `${Math.floor((target / w) * 100 * 0.995)}px`);
      ScrollTrigger.refresh();
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(a);
    document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      const m = gsap.matchMedia();
      m.add(mq.motion, () => {
        // the hit — after silence
        gsap
          .timeline({ scrollTrigger: { trigger: root.current, start: "top 62%" } })
          .from("[data-ct-ring]", { scale: 0.6, autoAlpha: 0, duration: 1.6, ease: "expo.out" }, 0)
          .from("[data-ct-q]", { autoAlpha: 0, y: 18, duration: 1.1 }, 0.1)
          .from("[data-ct-line] [data-ch]", { yPercent: 110, duration: 0.9, ease: "expo.out", stagger: 0.018 }, 0.2)
          .from("[data-ct-rest]", { autoAlpha: 0, y: 10, duration: 0.8, stagger: 0.06 }, 0.8);

        // cursor — the two lines drift apart; the slit opens near the ring
        const l1 = gsap.quickTo("[data-ct-line='1']", "xPercent", { duration: 1.2, ease: "power3.out" });
        const l2 = gsap.quickTo("[data-ct-line='2']", "xPercent", { duration: 1.2, ease: "power3.out" });
        const open = gsap.quickTo(slit.current, "--open", { duration: 0.9, ease: "power3.out" });
        const move = (e: PointerEvent) => {
          const nx = e.clientX / window.innerWidth - 0.5;
          l1(nx * 2.4);
          l2(-nx * 2.4);
          const r = ring.current!.getBoundingClientRect();
          const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
          const k = gsap.utils.clamp(0, 1, 1 - (d - r.width * 0.2) / (r.width * 0.55));
          open(k);
        };
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top bottom",
          end: "bottom top",
          onToggle: (s) => (s.isActive ? window.addEventListener("pointermove", move, { passive: true }) : window.removeEventListener("pointermove", move)),
        });
        return () => {
          st.kill();
          window.removeEventListener("pointermove", move);
        };
      });
      return () => m.revert();
    },
    { scope: root },
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${site.email}`;
    }
  };

  const chars = (s: string) =>
    s.split("").map((c, i) => (
      <span key={i} data-ch className="inline-block">
        {c}
      </span>
    ));

  return (
    <section
      ref={root}
      id="contact"
      aria-labelledby="contact-title"
      className="relative flex min-h-[100svh] flex-col overflow-hidden bg-ink px-pad pb-[clamp(1.5rem,4vh,3rem)] pt-[calc(var(--header-h)+4vh)]"
    >
      {/* The ring — the moon, reduced to its outline */}
      <div
        ref={ring}
        data-ct-ring
        aria-hidden
        className="absolute right-[-12vmin] top-[8vh] aspect-square w-[min(88vmin,62rem)] rounded-full border border-[#9a9a9a]/45 max-md:left-[7vw] max-md:right-auto max-md:top-[16vh] max-md:w-[86vw]"
      >
        <span className="absolute inset-[7%] rounded-full border border-[#9a9a9a]/15" />
        {/* the photographic slit */}
        <div
          ref={slit}
          className="absolute left-1/2 top-1/2 w-[72%] -translate-x-1/2 -translate-y-1/2 overflow-hidden"
          style={{ height: "calc(10% + var(--open, 0) * 36%)", ["--open" as string]: 0 }}
        >
          <Image src={SLIT.src} alt="" fill quality={70} sizes="(max-width: 767px) 70vw, 45vw" className="object-cover grayscale-[0.4]" />
        </div>
        <span className="meta absolute bottom-[14%] left-1/2 -translate-x-1/2 text-ash">SSM_006 · night</span>
      </div>

      {/* Question */}
      <div className="relative grid grid-cols-12 gap-x-[var(--gutter)]">
        <p className="meta col-span-12 mb-5 text-ember lg:col-span-2">(06) Final frame</p>
        <h2 id="contact-title" data-ct-q className="statement col-span-12 max-w-[16ch] max-md:mt-[42vh] lg:col-span-7">
          {site.contactLead} <span className="text-ash">{site.contactSub}</span>
        </h2>
      </div>

      {/* The address — a monumental object */}
      <a
        ref={mail}
        href={`mailto:${site.email}`}
        data-cursor="mail"
        className="group relative mt-auto block w-full pt-[clamp(2rem,8vh,5rem)]"
        aria-label={`Email ${site.email}`}
      >
        {/* width probe */}
        <span data-fit aria-hidden className="font-display invisible absolute left-0 top-0 whitespace-nowrap text-[100px] leading-none">
          {user}
        </span>
        <span data-ct-line="1" className="font-display block overflow-hidden whitespace-nowrap leading-[0.8] text-bone" style={{ fontSize: "var(--mail-size, 12vw)" }}>
          {chars(user)}
        </span>
        <span
          data-ct-line="2"
          className="font-display block overflow-hidden whitespace-nowrap text-right leading-[0.8] text-bone transition-colors duration-300 group-hover:text-ember group-focus-visible:text-ember"
          style={{ fontSize: "var(--mail-size, 12vw)" }}
        >
          {chars(`@${domain}`)}
        </span>
        <span aria-hidden className="mt-3 block h-[2px] origin-left scale-x-0 bg-ember transition-transform duration-700 ease-[var(--ease-out)] group-hover:scale-x-100 group-focus-visible:scale-x-100" />
      </a>

      {/* Links — numbered, monolith-style */}
      <ul className="meta relative mt-6 grid grid-cols-2 gap-y-3 md:grid-cols-4">
        <li data-ct-rest>
          <button type="button" data-cursor="copy" onClick={copy} className="group text-left" aria-live="polite">
            <span className="text-ash">00 </span>
            <span className="ulink text-bone">{copied ? "Copied ✓" : "Copy address"}</span>
          </button>
        </li>
        {site.socials.map((s, i) => (
          <li key={s.href} data-ct-rest className="md:text-right">
            <a href={s.href} target="_blank" rel="noreferrer">
              <span className="text-ash">{String(i + 1).padStart(2, "0")} </span>
              <span className="ulink text-bone">{s.label}</span> <span className="text-ember">↗</span>
            </a>
          </li>
        ))}
      </ul>

      <span className="sr-only">{SLIT.alt}</span>
    </section>
  );
}
