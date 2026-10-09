/**
 * The shadow runner — an original silhouette figure drawn procedurally on a 2D
 * canvas. Pure functions: a pose generator (run / perch) and a renderer.
 *
 * Figure space: units ≈ px at scale 1, y down, ground at y = 0, facing +x.
 * Total standing height ≈ 175 units.
 */

type V = { x: number; y: number };
type Limb = { a: number; b: number }; // a: segment angle from straight down (forward +), b: second segment relative bend

export type Pose = {
  lean: number; // torso tilt, forward +
  legs: [Limb, Limb]; // [back, front]
  arms: [Limb, Limb];
  head: number; // head tilt
  wind: number; // 0..1 how hard the cloth streams back
  /** extra crouch: lowers the hip toward the feet */
  drop?: number;
};

const L = { torso: 46, thigh: 37, shin: 37, foot: 13, upper: 27, fore: 25, neck: 15, head: 11.5 };

const add = (p: V, d: V, s = 1): V => ({ x: p.x + d.x * s, y: p.y + d.y * s });
/** Unit vector for an angle measured from straight down, forward (+x) positive. */
const dir = (a: number): V => ({ x: Math.sin(a), y: Math.cos(a) });

/** Sprint cycle, p = phase in radians. Arms swept back — the classic shadow sprint. */
export function runPose(p: number): Pose {
  const leg = (ph: number): Limb => {
    const thigh = 0.18 + 0.95 * Math.sin(ph);
    const knee = 0.28 + 1.55 * Math.max(0, Math.cos(ph)) + 0.25 * Math.max(0, -Math.sin(ph));
    return { a: thigh, b: -knee };
  };
  const sway = 0.07 * Math.sin(2 * p);
  return {
    lean: 0.66 + 0.03 * Math.sin(2 * p),
    legs: [leg(p + Math.PI), leg(p)],
    arms: [
      { a: -1.72 + sway, b: -0.12 },
      { a: -1.86 - sway, b: -0.08 },
    ],
    head: -0.38,
    wind: 1,
  };
}

/** Crouched on a pole. `look` (-1..1) turns the head toward the cursor; breathing via t. */
export function perchPose(t: number, look: V): Pose {
  const breath = Math.sin(t * 1.6) * 0.025;
  return {
    lean: 0.5 + breath,
    legs: [
      { a: 1.5, b: -2.25 },
      { a: 2.25, b: -2.6 },
    ],
    arms: [
      { a: 0.3, b: -0.05 },
      { a: 1.25 + breath, b: -1.05 },
    ],
    head: -0.5 + look.y * 0.5 + breath,
    wind: 0.4,
  };
}

type Joints = {
  hip: V;
  neck: V;
  headC: V;
  up: V;
  back: V;
  legs: { knee: V; ankle: V; toe: V }[];
  arms: { elbow: V; hand: V }[];
};

function solve(pose: Pose): Joints {
  const up: V = { x: Math.sin(pose.lean), y: -Math.cos(pose.lean) };
  const back: V = { x: -Math.cos(pose.lean), y: -Math.sin(pose.lean) };
  let hip: V = { x: 0, y: 0 };
  const legs = pose.legs.map((l) => {
    const knee = add(hip, dir(l.a), L.thigh);
    const shinA = l.a + l.b;
    const ankle = add(knee, dir(shinA), L.shin);
    const toe = add(ankle, dir(shinA + 1.45), L.foot);
    return { knee, ankle, toe };
  });
  // Plant the lowest point on the ground.
  const low = Math.max(...legs.flatMap((g) => [g.ankle.y + 3, g.toe.y + 2]));
  const shift = -low;
  hip = { x: 0, y: shift };
  legs.forEach((g) => {
    g.knee.y += shift;
    g.ankle.y += shift;
    g.toe.y += shift;
  });
  const neck = add(hip, up, L.torso);
  const headC = add(neck, { x: Math.sin(pose.lean + pose.head), y: -Math.cos(pose.lean + pose.head) }, L.neck);
  const shoulder = add(hip, up, L.torso * 0.9);
  const arms = pose.arms.map((a) => {
    const elbow = add(shoulder, dir(a.a), L.upper);
    const hand = add(elbow, dir(a.a + a.b), L.fore);
    return { elbow, hand };
  });
  return { hip, neck, headC, up, back, legs, arms };
}

function line(ctx: CanvasRenderingContext2D, pts: V[], w: number) {
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}

/** A ribbon that streams backward from `from`, waving over time. Drawn as a tapered polygon. */
function ribbon(ctx: CanvasRenderingContext2D, from: V, t: number, len: number, width: number, wind: number, seed: number, droop: number) {
  const n = 14;
  const top: V[] = [];
  const bot: V[] = [];
  for (let i = 0; i <= n; i++) {
    const k = i / n;
    const x = from.x - len * k * (0.35 + 0.65 * wind);
    const wave = Math.sin(t * 17 * (0.4 + wind) - k * 6 + seed) * (2 + 9 * k) * (0.35 + 0.65 * wind);
    const y = from.y + wave + droop * k * k * (1 - wind) * len * 0.8 - 4 * k * wind;
    const w = width * (1 - k * 0.85);
    top.push({ x, y: y - w / 2 });
    bot.push({ x, y: y + w / 2 });
  }
  ctx.beginPath();
  ctx.moveTo(top[0].x, top[0].y);
  top.forEach((p) => ctx.lineTo(p.x, p.y));
  for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i].x, bot[i].y);
  ctx.closePath();
  ctx.fill();
}

export type DrawOpts = {
  x: number;
  y: number; // ground line in canvas px
  scale: number;
  facing?: 1 | -1;
  color?: string;
  alpha?: number;
  t: number; // seconds, drives cloth
  rim?: string | null; // optional rim-light colour
};

/** Draw the figure with its feet on (x, y). */
export function drawNinja(ctx: CanvasRenderingContext2D, pose: Pose, o: DrawOpts) {
  const j = solve(pose);
  const color = o.color ?? "#060606";
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.translate(o.x, o.y);
  ctx.scale(o.scale * (o.facing ?? 1), o.scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  if (o.rim) {
    ctx.shadowColor = o.rim;
    ctx.shadowBlur = 10;
  }

  // Scarf + headband tails (behind the body)
  ribbon(ctx, add(j.neck, j.back, 3), o.t, 92, 11, pose.wind, 0, 0.9);
  const knot = add(j.headC, j.back, L.head * 0.9);
  ribbon(ctx, knot, o.t + 0.13, 46, 5, pose.wind, 1.7, 0.6);
  ribbon(ctx, add(knot, { x: 0, y: 2 }), o.t + 0.31, 36, 4, pose.wind, 3.1, 0.8);

  // Katana across the back
  const swordBase = add(add(j.hip, j.up, 24), j.back, 6);
  const swordDir: V = { x: j.up.x * 0.42 + j.back.x * 0.91, y: j.up.y * 0.42 + j.back.y * 0.91 };
  const tip = add(swordBase, swordDir, -14);
  const guard = add(swordBase, swordDir, 30);
  line(ctx, [tip, guard], 4);
  line(ctx, [guard, add(guard, swordDir, 17)], 5.5);
  const gn: V = { x: -swordDir.y, y: swordDir.x };
  line(ctx, [add(guard, gn, -5), add(guard, gn, 5)], 3);

  // Back limbs
  line(ctx, [add(j.hip, j.up, L.torso * 0.9), j.arms[0].elbow, j.arms[0].hand], 8.5);
  line(ctx, [j.hip, j.legs[0].knee], 15);
  line(ctx, [j.legs[0].knee, j.legs[0].ankle], 10.5);
  line(ctx, [j.legs[0].ankle, j.legs[0].toe], 8);

  // Torso — tapered
  const hipW = 9.5;
  const chestW = 12.5;
  const sh = add(j.hip, j.up, L.torso);
  ctx.beginPath();
  ctx.moveTo(j.hip.x + j.back.x * hipW, j.hip.y + j.back.y * hipW);
  ctx.lineTo(j.hip.x - j.back.x * hipW, j.hip.y - j.back.y * hipW);
  ctx.lineTo(sh.x - j.back.x * chestW, sh.y - j.back.y * chestW);
  ctx.lineTo(sh.x + j.back.x * chestW * 1.1, sh.y + j.back.y * chestW * 1.1);
  ctx.closePath();
  ctx.fill();
  line(ctx, [j.hip, sh], 16);

  // Head — hood with a forward point (mask)
  ctx.beginPath();
  ctx.arc(j.headC.x, j.headC.y, L.head, 0, Math.PI * 2);
  ctx.fill();
  const fwd: V = { x: -j.back.x, y: -j.back.y };
  ctx.beginPath();
  ctx.moveTo(j.headC.x + fwd.x * 6 + j.up.x * 6, j.headC.y + fwd.y * 6 + j.up.y * 6);
  ctx.lineTo(j.headC.x + fwd.x * (L.head + 5) - j.up.x * 3, j.headC.y + fwd.y * (L.head + 5) - j.up.y * 3);
  ctx.lineTo(j.headC.x - j.up.x * 10, j.headC.y - j.up.y * 10);
  ctx.closePath();
  ctx.fill();

  // Front limbs
  line(ctx, [j.hip, j.legs[1].knee], 16);
  line(ctx, [j.legs[1].knee, j.legs[1].ankle], 11);
  line(ctx, [j.legs[1].ankle, j.legs[1].toe], 8);
  line(ctx, [add(j.hip, j.up, L.torso * 0.9), j.arms[1].elbow, j.arms[1].hand], 9);

  ctx.restore();
}

/** Height of the figure in figure-units for a pose (ground to top of head). */
export const FIGURE_HEIGHT = 168;
