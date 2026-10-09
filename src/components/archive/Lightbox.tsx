"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { Frame } from "@/data/archive";
import { scroller } from "@/lib/store";

type Props = { frames: Frame[]; index: number | null; onChange: (i: number | null) => void };

const ease = [0.16, 1, 0.3, 1] as const;

/** Full-screen frame viewer. ← → to move, Esc to close, focus returns to the frame. */
export function Lightbox({ frames, index, onChange }: Props) {
  const closeBtn = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const state = useRef({ index, frames, onChange });
  useEffect(() => {
    state.current = { index, frames, onChange };
  });
  const open = index !== null;

  useEffect(() => {
    if (!open) return;
    returnTo.current = document.activeElement as HTMLElement;
    scroller.lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      const { index: i, frames: f, onChange: set } = state.current;
      if (i === null) return;
      if (e.key === "Escape") set(null);
      if (e.key === "ArrowRight") set((i + 1) % f.length);
      if (e.key === "ArrowLeft") set((i - 1 + f.length) % f.length);
      if (e.key === "Tab" && dialog.current) {
        const btns = Array.from(dialog.current.querySelectorAll<HTMLElement>("button"));
        const at = btns.indexOf(document.activeElement as HTMLElement);
        e.preventDefault();
        btns[(at + (e.shiftKey ? -1 : 1) + btns.length) % btns.length]?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      scroller.lenis?.start();
      document.documentElement.style.overflow = "";
      returnTo.current?.focus({ preventScroll: true });
    };
  }, [open]);

  const fr = index !== null ? frames[index] : null;

  return (
    <AnimatePresence>
      {fr && (
        <motion.div
          key="lightbox"
          ref={dialog}
          role="dialog"
          aria-modal="true"
          aria-label={`Frame ${fr.id}`}
          data-lenis-prevent
          className="fixed inset-0 flex flex-col bg-ink/95 px-pad backdrop-blur-sm"
          style={{ zIndex: "var(--z-menu)" }}
          initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="meta flex h-[var(--header-h)] shrink-0 items-center justify-between">
            <span>
              SSM_{fr.id} <span className="text-ash">· {String(index! + 1).padStart(2, "0")} / {String(frames.length).padStart(2, "0")}</span>
            </span>
            <button ref={closeBtn} type="button" data-cursor="menu" onClick={() => onChange(null)} className="py-2">
              Close (Esc)
            </button>
          </div>

          <div className="relative min-h-0 flex-1 py-4" onClick={() => onChange(null)}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={fr.id}
                className="relative mx-auto h-full"
                style={{ aspectRatio: `${fr.w} / ${fr.h}`, maxWidth: "100%" }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.45, ease }}
              >
                <Image src={fr.src} alt={fr.alt} fill sizes="90vw" quality={80} className="object-contain" priority />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="meta flex shrink-0 items-center justify-between gap-6 py-4">
            <button type="button" onClick={() => onChange((index! - 1 + frames.length) % frames.length)} className="ulink py-2">
              ← Prev
            </button>
            <p className="hidden max-w-[60ch] text-center normal-case tracking-normal text-ash md:block">{fr.alt}</p>
            <button type="button" onClick={() => onChange((index! + 1) % frames.length)} className="ulink py-2">
              Next →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
