/**
 * Visual archive — Sabya's photography (confirmed by Sabya), carried over from the
 * previous portfolio. Frames showing third-party logos/artwork were left out.
 * Captions are deliberately factual: frame number, orientation, dominant tone.
 * Titles/locations are not invented.
 */

export type Frame = {
  id: string;
  src: string;
  w: number;
  h: number;
  tone: string;
  alt: string;
};

const f = (n: number, w: number, h: number, tone: string, alt: string): Frame => ({
  id: String(n).padStart(3, "0"),
  src: `/archive/frame-${String(n).padStart(2, "0")}.webp`,
  w,
  h,
  tone,
  alt,
});

/** Ordered for rhythm: dark → teal → red impact → monochrome → light. */
export const archive: Frame[] = [
  f(6, 736, 920, "Teal / night", "A lone figure under a highway overpass in teal fog, lit by a single street lamp."),
  f(10, 736, 1472, "Black / signal", "A glowing CRT television alone in a dark room, reflected on the floor."),
  f(12, 736, 1472, "Fog / city", "Looking up between skyscrapers that disappear into fog."),
  f(4, 564, 704, "Red / impact", "A room lit entirely red, its walls covered with pinned photographs."),
  f(2, 600, 800, "Warm / tools", "A Fujifilm camera lying on a dark cloth with its strap and lens cap."),
  f(7, 640, 800, "Blue / void", "Rows of blue street lamps across an empty parking lot at night."),
  f(11, 474, 632, "Mono / prints", "An instant camera surrounded by black-and-white instant prints."),
  f(16, 736, 1472, "Mono / speed", "A race car sliding through a cloud of tyre smoke."),
  f(17, 540, 810, "Mono / keys", "Close-up of a backlit laptop keyboard in darkness."),
  f(3, 676, 1200, "Black / bloom", "White blossoms against a black background beneath the characters for yin and yang."),
  f(24, 736, 735, "Blue / touch", "Two hands reaching toward each other, one glowing with light."),
  f(18, 736, 1377, "Mono / silicon", "A monochrome macro view of a logic board and processor."),
  f(8, 640, 640, "Mono / desk", "Headphones and a phone resting beside an open laptop on a bed."),
  f(23, 736, 981, "Black / glass", "A camera lens photographed head-on against black."),
  f(25, 736, 736, "Mono / disc", "A translucent MiniDisc cartridge revealing the disc inside, on black."),
  f(26, 736, 736, "Teal / cinema", "A cinema camera body on a dark teal surface."),
  f(9, 734, 1104, "Mono / paper", "A pile of scattered banknotes in black and white."),
  f(5, 736, 736, "Black / key", "A single glass escape key floating in darkness."),
];

/** Frames used by the entry sequence (fast shuffle → hero). */
export const loaderFrames = [6, 4, 12, 10, 7, 2, 16, 24].map(
  (n) => `/archive/frame-${String(n).padStart(2, "0")}.webp`,
);
