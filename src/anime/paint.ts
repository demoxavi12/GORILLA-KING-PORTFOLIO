/**
 * Procedural painters for the night world. Every layer is drawn in code onto a
 * 2D canvas (original artwork — no external assets). Deterministic via a seed.
 */

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.round(w);
  c.height = Math.round(h);
  return [c, c.getContext("2d")!] as const;
}

export function paintSky(w: number, h: number) {
  const [c, x] = canvas(w, h);
  const g = x.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#040508");
  g.addColorStop(0.55, "#0a0c13");
  g.addColorStop(1, "#151621");
  x.fillStyle = g;
  x.fillRect(0, 0, w, h);
  const r = rng(7);
  for (let i = 0; i < (w * h) / 2600; i++) {
    const s = r() < 0.92 ? 0.6 + r() * 0.9 : 1.6 + r() * 1.2;
    x.fillStyle = `rgba(241,239,232,${0.15 + r() * 0.6})`;
    x.beginPath();
    x.arc(r() * w, r() * h * 0.8, s, 0, Math.PI * 2);
    x.fill();
  }
  return c;
}

export function paintMoon(size: number) {
  const [c, x] = canvas(size, size);
  const R = size * 0.48;
  const cx = size / 2;
  const g = x.createRadialGradient(cx - R * 0.3, cx - R * 0.35, R * 0.1, cx, cx, R);
  g.addColorStop(0, "#fbf7ec");
  g.addColorStop(0.7, "#ece6d6");
  g.addColorStop(1, "#cfc6b0");
  x.fillStyle = g;
  x.beginPath();
  x.arc(cx, cx, R, 0, Math.PI * 2);
  x.fill();
  // maria + craters, clipped to the disc
  x.save();
  x.clip();
  const r = rng(11);
  for (let i = 0; i < 9; i++) {
    const mx = cx + (r() - 0.5) * R * 1.3;
    const my = cx + (r() - 0.5) * R * 1.3;
    const mr = R * (0.12 + r() * 0.28);
    const mg = x.createRadialGradient(mx, my, 0, mx, my, mr);
    mg.addColorStop(0, "rgba(150,140,120,0.28)");
    mg.addColorStop(1, "rgba(150,140,120,0)");
    x.fillStyle = mg;
    x.fillRect(mx - mr, my - mr, mr * 2, mr * 2);
  }
  for (let i = 0; i < 26; i++) {
    const kx = cx + (r() - 0.5) * R * 1.8;
    const ky = cx + (r() - 0.5) * R * 1.8;
    const kr = R * (0.015 + r() * 0.04);
    const kg = x.createRadialGradient(kx - kr * 0.3, ky - kr * 0.3, 0, kx, ky, kr);
    kg.addColorStop(0, "rgba(130,120,100,0.22)");
    kg.addColorStop(1, "rgba(130,120,100,0)");
    x.fillStyle = kg;
    x.fillRect(kx - kr, ky - kr, kr * 2, kr * 2);
  }
  x.restore();
  return c;
}

export function paintGlow(size: number, color: string, strength = 1) {
  const [c, x] = canvas(size, size);
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, color.replace("ALPHA", String(0.55 * strength)));
  g.addColorStop(0.25, color.replace("ALPHA", String(0.18 * strength)));
  g.addColorStop(1, color.replace("ALPHA", "0"));
  x.fillStyle = g;
  x.fillRect(0, 0, size, size);
  return c;
}

/** Thin, long anime cloud wisps — dark bodies with a moonlit upper edge. */
export function paintClouds(w: number, h: number, seed: number, yBand: [number, number]) {
  const [c, x] = canvas(w, h);
  const r = rng(seed);
  x.lineCap = "round";
  for (let b = 0; b < 7; b++) {
    const y = h * (yBand[0] + r() * (yBand[1] - yBand[0]));
    const len = w * (0.18 + r() * 0.45);
    const x0 = r() * w * 1.1 - len * 0.2;
    const th = h * (0.004 + r() * 0.012);
    const curve = (r() - 0.5) * h * 0.02;
    // body: stack of strokes thinning toward the ends
    for (let k = 0; k < 3; k++) {
      x.strokeStyle = `rgba(22,24,33,${0.55 + k * 0.15})`;
      x.lineWidth = th * (1 - k * 0.3);
      x.beginPath();
      x.moveTo(x0 + len * k * 0.06, y + k * th * 0.15);
      x.quadraticCurveTo(x0 + len / 2, y + curve, x0 + len * (1 - k * 0.06), y + k * th * 0.15);
      x.stroke();
    }
    // moonlit rim
    x.strokeStyle = "rgba(236,230,214,0.22)";
    x.lineWidth = Math.max(1, th * 0.12);
    x.beginPath();
    x.moveTo(x0 + len * 0.15, y - th * 0.42);
    x.quadraticCurveTo(x0 + len / 2, y + curve - th * 0.45, x0 + len * 0.85, y - th * 0.42);
    x.stroke();
  }
  return c;
}

function ridge(x: CanvasRenderingContext2D, w: number, h: number, base: number, amp: number, seed: number, color: string) {
  const r = rng(seed);
  const n = 128;
  const pts = Array.from({ length: n + 1 }, () => 0);
  let step = n;
  let a = amp;
  pts[0] = r() - 0.5;
  pts[n] = r() - 0.5;
  while (step > 1) {
    for (let i = step / 2; i < n; i += step) pts[i] = (pts[i - step / 2] + pts[i + step / 2]) / 2 + (r() - 0.5) * a;
    step /= 2;
    a *= 0.55;
  }
  x.fillStyle = color;
  x.beginPath();
  x.moveTo(0, h);
  pts.forEach((p, i) => x.lineTo((i / n) * w, h * base - p * h * 0.25));
  x.lineTo(w, h);
  x.closePath();
  x.fill();
}

export function paintMountains(w: number, h: number) {
  const [c, x] = canvas(w, h);
  ridge(x, w, h, 0.62, 1.4, 21, "#14161f");
  ridge(x, w, h, 0.7, 1.0, 34, "#0f1118");
  return c;
}

/** Rooftops — hip roofs with flared eaves, water tanks, antennas, a few lit windows. */
export function paintCity(w: number, h: number) {
  const [c, x] = canvas(w, h);
  const r = rng(5);
  const ground = h;
  let px = -20;
  const lights: [number, number, number, number, string][] = [];
  while (px < w + 40) {
    const bw = w * (0.03 + r() * 0.07);
    const bh = h * (0.32 + r() * 0.42);
    const top = ground - bh;
    x.fillStyle = "#07080c";
    x.fillRect(px, top, bw, bh);
    const kind = r();
    if (kind < 0.35) {
      // Japanese hip roof with flared eaves
      const eave = bw * 0.18;
      const rh = bh * (0.18 + r() * 0.12);
      x.beginPath();
      x.moveTo(px - eave, top + 4);
      x.quadraticCurveTo(px + bw * 0.1, top - rh * 0.15, px + bw * 0.22, top - rh);
      x.lineTo(px + bw * 0.78, top - rh);
      x.quadraticCurveTo(px + bw * 0.9, top - rh * 0.15, px + bw + eave, top + 4);
      x.closePath();
      x.fill();
    } else if (kind < 0.55) {
      // water tank on legs
      const tx = px + bw * (0.2 + r() * 0.5);
      const tw = bw * 0.28;
      x.fillRect(tx, top - tw * 1.3, tw, tw);
      x.fillRect(tx + 2, top - tw * 0.3, 2, tw * 0.3);
      x.fillRect(tx + tw - 4, top - tw * 0.3, 2, tw * 0.3);
    } else if (kind < 0.7) {
      // antenna
      const ax = px + bw * r();
      x.fillRect(ax, top - bh * 0.6, 2, bh * 0.6);
      x.fillRect(ax - 8, top - bh * 0.45, 18, 2);
    }
    // windows
    for (let k = 0; k < 4; k++) {
      if (r() < 0.45) {
        const wx = px + bw * (0.12 + r() * 0.7);
        const wy = top + bh * (0.15 + r() * 0.6);
        lights.push([wx, wy, Math.max(3, bw * 0.08), Math.max(3, bw * 0.06), r() < 0.18 ? "rgba(224,72,44,0.85)" : "rgba(232,200,150,0.55)"]);
      }
    }
    px += bw + (r() < 0.3 ? r() * w * 0.02 : 0);
  }
  lights.forEach(([lx, ly, lw, lh, col]) => {
    x.fillStyle = col;
    x.fillRect(lx, ly, lw, lh);
  });
  return c;
}

/** Utility poles + catenary wires. Returns the top of the perch pole in canvas px. */
export function paintPoles(w: number, h: number, poleXs: number[], perchIndex: number, perchTop: number) {
  const [c, x] = canvas(w, h);
  x.fillStyle = "#040405";
  x.strokeStyle = "#040405";
  const tops: { x: number; y: number }[] = [];
  const poleW = Math.max(10, w * 0.009);
  poleXs.forEach((fx, i) => {
    const px = fx * w;
    const top = h * (i === perchIndex ? perchTop : perchTop + 0.04 + (i % 2) * 0.05);
    x.fillRect(px - poleW / 2, top, poleW, h - top);
    // crossarms + insulators
    [0.05, 0.11].forEach((dy, k) => {
      const ay = top + h * dy;
      const aw = w * (0.05 - k * 0.012);
      x.fillRect(px - aw, ay, aw * 2, poleW * 0.45);
      for (let j = -2; j <= 2; j++) x.fillRect(px + (j / 2) * aw * 0.9 - 2, ay - 8, 4, 9);
    });
    // transformer on one pole
    if (i === (perchIndex + 1) % poleXs.length) x.fillRect(px - poleW * 1.6, top + h * 0.17, poleW * 3.2, h * 0.06);
    tops.push({ x: px, y: top });
  });
  // wires between poles and off-canvas
  const anchors = [{ x: -w * 0.1, y: h * 0.45 }, ...tops.map((t) => ({ x: t.x, y: t.y + h * 0.05 })), { x: w * 1.1, y: h * 0.4 }];
  for (let k = 0; k < 4; k++) {
    x.lineWidth = Math.max(1.5, w * 0.0012);
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i];
      const b = anchors[i + 1];
      const off = (k - 1.5) * w * 0.02;
      const sag = h * (0.05 + k * 0.012);
      x.beginPath();
      x.moveTo(a.x + off, a.y + k * h * 0.012);
      x.quadraticCurveTo((a.x + b.x) / 2, Math.max(a.y, b.y) + sag, b.x + off, b.y + k * h * 0.012);
      x.stroke();
    }
  }
  return { canvas: c, perch: tops[perchIndex] };
}

/** Foreground branch with leaves, entering from the top-left corner. */
export function paintBranch(w: number, h: number) {
  const [c, x] = canvas(w, h);
  const r = rng(3);
  x.fillStyle = "#020203";
  x.strokeStyle = "#020203";
  x.lineCap = "round";
  const grow = (sx: number, sy: number, ang: number, len: number, wd: number, depth: number) => {
    const ex = sx + Math.cos(ang) * len;
    const ey = sy + Math.sin(ang) * len;
    x.lineWidth = wd;
    x.beginPath();
    x.moveTo(sx, sy);
    x.quadraticCurveTo((sx + ex) / 2 + (r() - 0.5) * len * 0.3, (sy + ey) / 2 + (r() - 0.5) * len * 0.3, ex, ey);
    x.stroke();
    if (depth > 3) {
      for (let i = 0; i < 6; i++) {
        const lx = sx + (ex - sx) * r();
        const ly = sy + (ey - sy) * r();
        x.save();
        x.translate(lx, ly);
        x.rotate(r() * Math.PI * 2);
        x.beginPath();
        x.ellipse(0, 0, w * 0.012, w * 0.005, 0, 0, Math.PI * 2);
        x.fill();
        x.restore();
      }
    }
    if (depth < 5) {
      grow(ex, ey, ang + 0.35 + r() * 0.3, len * 0.72, wd * 0.62, depth + 1);
      grow(ex, ey, ang - 0.25 - r() * 0.3, len * 0.66, wd * 0.6, depth + 1);
    }
  };
  grow(-w * 0.02, h * 0.02, 0.35, w * 0.16, w * 0.012, 0);
  return c;
}
