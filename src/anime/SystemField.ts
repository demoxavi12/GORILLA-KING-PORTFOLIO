import type { SystemStep } from "@/data/projects";

/**
 * A living system. Each project's real stages (read from its own code) become
 * nodes; packets of light travel between them. The failure/alternate path
 * branches off and burns ember. The cursor bends the flow and wakes nodes.
 */

type Node = { x: number; y: number; label: string; note: string; alt: boolean; pulse: number; born: number };
type Packet = { from: number; to: number; t: number; speed: number; alt: boolean; free?: { vx: number; vy: number; life: number; x: number; y: number } };

const MAX = 150;

export class SystemField {
  private ctx: CanvasRenderingContext2D;
  private w = 1;
  private h = 1;
  private dpr = 1;
  private nodes: Node[] = [];
  private mainCount = 0;
  private branchFrom = -1;
  private packets: Packet[] = [];
  private debris: Packet[] = [];
  private raf = 0;
  private running = false;
  private last = 0;
  private time = 0;
  private pointer = { x: -9999, y: -9999 };
  private font = "monospace";
  private steps: SystemStep[] = [];

  constructor(private canvas: HTMLCanvasElement, private opts: { mobile: boolean; still: boolean }) {
    this.ctx = canvas.getContext("2d")!;
    const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-geist-mono").trim();
    if (fam) this.font = fam;
    this.resize();
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.steps.length) this.layout(this.steps, false);
  }

  private layout(steps: SystemStep[], fresh: boolean) {
    const main = steps.filter((s) => !s.alt);
    const alt = steps.filter((s) => s.alt);
    const m = this.opts.mobile;
    const x0 = this.w * (m ? 0.12 : 0.44);
    const x1 = this.w * (m ? 0.88 : 0.9);
    const y0 = this.h * (m ? 0.34 : 0.2);
    const y1 = this.h * (m ? 0.56 : 0.6);
    const now = this.time;
    const nodes: Node[] = main.map((s, i) => {
      const k = main.length === 1 ? 0.5 : i / (main.length - 1);
      return {
        x: x0 + (x1 - x0) * k,
        y: y0 + (y1 - y0) * k + Math.sin(i * 1.7) * this.h * 0.05,
        label: s.label,
        note: s.note,
        alt: false,
        pulse: 0,
        born: fresh ? now + i * 0.09 : -10,
      };
    });
    this.mainCount = nodes.length;
    this.branchFrom = Math.max(0, nodes.length - 2);
    alt.forEach((s, j) => {
      const b = nodes[this.branchFrom];
      nodes.push({
        x: b.x + this.w * (m ? 0.1 : 0.07) * (j + 1),
        y: b.y + this.h * (m ? 0.14 : 0.2),
        label: s.label,
        note: s.note,
        alt: true,
        pulse: 0,
        born: fresh ? now + (nodes.length + j) * 0.09 : -10,
      });
    });
    this.nodes = nodes;
  }

  /** Swap to a new system. `burst` explodes the current packets outward first. */
  setSteps(steps: SystemStep[], burst: boolean) {
    if (burst) {
      for (const p of this.packets) {
        const pos = this.pos(p);
        const a = Math.random() * Math.PI * 2;
        const v = 4 + Math.random() * 12;
        this.debris.push({ ...p, free: { x: pos.x, y: pos.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1 } });
      }
    }
    this.steps = steps;
    this.packets = [];
    this.layout(steps, true);
    if (this.opts.still) this.draw(0);
  }

  setPointer(x: number, y: number) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = x - r.left;
    this.pointer.y = y - r.top;
  }

  start() {
    if (this.running || this.opts.still) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      this.raf = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.time += dt;
      this.step(dt);
      this.draw(dt);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private pos(p: Packet) {
    const a = this.nodes[p.from];
    const b = this.nodes[p.to];
    if (!a || !b) return { x: -100, y: -100 };
    // gentle arc between nodes
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.12;
    const t = p.t;
    const x = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mx + t * t * b.x;
    const y = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * my + t * t * b.y;
    return { x, y };
  }

  private next(from: number): { to: number; alt: boolean } | null {
    if (from === this.branchFrom && this.nodes.length > this.mainCount && Math.random() < 0.2) {
      return { to: this.mainCount, alt: true };
    }
    if (from < this.mainCount - 1) return { to: from + 1, alt: false };
    return null;
  }

  private step(dt: number) {
    const cap = this.opts.mobile ? 60 : MAX;
    if (this.packets.length < cap && Math.random() < 0.55 && this.nodes.length > 1) {
      this.packets.push({ from: 0, to: 1, t: 0, speed: 0.45 + Math.random() * 0.6, alt: false });
    }
    for (let i = this.packets.length - 1; i >= 0; i--) {
      const p = this.packets[i];
      p.t += p.speed * dt;
      if (p.t >= 1) {
        const n = this.nodes[p.to];
        if (n) n.pulse = 1;
        const nx = p.alt ? null : this.next(p.to);
        if (!nx) {
          this.packets.splice(i, 1);
          continue;
        }
        p.from = p.to;
        p.to = nx.to;
        p.alt = nx.alt;
        p.t = 0;
      }
    }
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const f = this.debris[i].free!;
      f.x += f.vx;
      f.y += f.vy;
      f.vx *= 0.92;
      f.vy *= 0.92;
      f.life -= dt * 1.8;
      if (f.life <= 0) this.debris.splice(i, 1);
    }
    this.nodes.forEach((n) => (n.pulse = Math.max(0, n.pulse - dt * 2.2)));
  }

  private draw(dt: number) {
    const c = this.ctx;
    // motion trails
    c.globalCompositeOperation = "source-over";
    // transparent trails: fade what was drawn instead of painting black (the ink shows through)
    if (dt === 0) c.clearRect(0, 0, this.w, this.h);
    else {
      c.globalCompositeOperation = "destination-out";
      c.fillStyle = "rgba(0,0,0,0.24)";
      c.fillRect(0, 0, this.w, this.h);
      c.globalCompositeOperation = "source-over";
    }
    const P = this.pointer;
    const born = (n: Node) => Math.min(1, Math.max(0, (this.time - n.born) / 0.5));

    // edges
    c.lineWidth = 1;
    for (let i = 0; i < this.mainCount - 1; i++) this.edge(this.nodes[i], this.nodes[i + 1], "rgba(241,239,232,0.07)", Math.min(born(this.nodes[i]), born(this.nodes[i + 1])));
    for (let j = this.mainCount; j < this.nodes.length; j++) {
      c.setLineDash([4, 6]);
      this.edge(this.nodes[this.branchFrom], this.nodes[j], "rgba(224,72,44,0.55)", born(this.nodes[j]));
      c.setLineDash([]);
    }

    // packets
    c.globalCompositeOperation = "lighter";
    for (const p of this.packets) {
      let { x, y } = this.pos(p);
      const dx = x - P.x;
      const dy = y - P.y;
      const d = Math.hypot(dx, dy);
      const R = 140;
      if (d < R && d > 0.01) {
        const f = (1 - d / R) * 38;
        x += (dx / d) * f;
        y += (dy / d) * f;
      }
      c.fillStyle = p.alt ? "rgba(224,72,44,0.8)" : "rgba(241,239,232,0.42)";
      c.beginPath();
      c.arc(x, y, p.alt ? 2.6 : 1.7, 0, Math.PI * 2);
      c.fill();
    }
    for (const p of this.debris) {
      const f = p.free!;
      c.fillStyle = `rgba(${p.alt ? "224,72,44" : "241,239,232"},${f.life})`;
      c.fillRect(f.x, f.y, 2, 2);
    }
    c.globalCompositeOperation = "source-over";

    // nodes
    this.nodes.forEach((n, i) => {
      const b = born(n);
      if (b <= 0) return;
      const near = Math.max(0, 1 - Math.hypot(n.x - P.x, n.y - P.y) / 160);
      const r = (5 + n.pulse * 7 + near * 6) * b;
      c.strokeStyle = n.alt ? `rgba(224,72,44,${0.5 + near * 0.5})` : `rgba(241,239,232,${0.35 + near * 0.55 + n.pulse * 0.2})`;
      c.lineWidth = 1.2;
      c.beginPath();
      c.arc(n.x, n.y, r, 0, Math.PI * 2);
      c.stroke();
      if (n.pulse > 0.05) {
        c.strokeStyle = n.alt ? `rgba(224,72,44,${n.pulse * 0.6})` : `rgba(241,239,232,${n.pulse * 0.4})`;
        c.beginPath();
        c.arc(n.x, n.y, r + (1 - n.pulse) * 26, 0, Math.PI * 2);
        c.stroke();
      }
      c.fillStyle = n.alt ? "#e0482c" : "#f1efe8";
      c.beginPath();
      c.arc(n.x, n.y, 2 * b, 0, Math.PI * 2);
      c.fill();
      // labels — quiet until a packet or the hand wakes them; notes only near the hand
      const wake = Math.min(1, 0.32 + near * 0.9 + n.pulse * 0.35);
      c.globalAlpha = b * wake;
      c.font = `500 ${this.opts.mobile ? 10 : 11}px ${this.font}`;
      c.textBaseline = "alphabetic";
      c.fillStyle = n.alt ? "#e0482c" : "rgba(241,239,232,0.92)";
      const lx = n.x + 14;
      const ly = n.y - 10;
      c.fillText(`${String(i + 1).padStart(2, "0")} ${n.label.toUpperCase()}`, lx, ly);
      if (near > 0.05) {
        c.globalAlpha = b * Math.min(1, near * 1.6);
        c.fillStyle = "rgba(160,160,160,1)";
        c.fillText(n.note.toUpperCase(), lx, ly + 15);
      }
      c.globalAlpha = 1;
    });
  }

  private edge(a: Node, b: Node, color: string, k: number) {
    if (k <= 0) return;
    const c = this.ctx;
    const mx = (a.x + b.x) / 2;
    const my = (a.y + b.y) / 2 - Math.abs(b.x - a.x) * 0.12;
    c.strokeStyle = color;
    c.beginPath();
    c.moveTo(a.x, a.y);
    // draw partially while the node is being born
    const steps = 24;
    for (let i = 1; i <= Math.round(steps * k); i++) {
      const t = i / steps;
      c.lineTo((1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * mx + t * t * b.x, (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * my + t * t * b.y);
    }
    c.stroke();
  }

  dispose() {
    this.stop();
  }
}
